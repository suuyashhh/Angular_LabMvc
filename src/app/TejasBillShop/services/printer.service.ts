import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PrinterSettings, ShopDetails, Bill, DiscoveredPrinter } from '../models/interfaces';
import { StorageService } from './storage.service';

const PRINTER_KEY = 'bc_printer_settings';
const SHOP_KEY = 'bc_shop_details';

// Common ESC/POS Bluetooth service/characteristic UUIDs
const BT_PRINTER_SERVICE = '000018f0-0000-1000-8000-00805f9b34fb';
const BT_PRINTER_CHAR = '00002af1-0000-1000-8000-00805f9b34fb';

// Fallback SPP-like UUIDs many thermal printers use
const BT_SPP_SERVICE = '0000ff00-0000-1000-8000-00805f9b34fb';
const BT_SPP_CHAR = '0000ff02-0000-1000-8000-00805f9b34fb';

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private settingsSubject = new BehaviorSubject<PrinterSettings>({
    connectionType: 'bluetooth',
    paperWidth: '58mm'
  });
  settings$ = this.settingsSubject.asObservable();

  private shopSubject = new BehaviorSubject<ShopDetails>({
    shopName: 'Breakfast Center',
    address: '123 Main Road',
    phone: ''
  });
  shop$ = this.shopSubject.asObservable();

  // Connection state
  private connectedSubject = new BehaviorSubject<boolean>(false);
  connected$ = this.connectedSubject.asObservable();

  private scanningSubject = new BehaviorSubject<boolean>(false);
  scanning$ = this.scanningSubject.asObservable();

  private connectingSubject = new BehaviorSubject<boolean>(false);
  connecting$ = this.connectingSubject.asObservable();

  private printerStatusSubject = new BehaviorSubject<string>('Not connected');
  printerStatus$ = this.printerStatusSubject.asObservable();

  // Connected device references
  private bluetoothDevice: any = null; // BluetoothDevice
  private bluetoothCharacteristic: any = null; // BluetoothRemoteGATTCharacteristic
  private usbDevice: any = null; // USBDevice

  constructor(private storage: StorageService) {
    this.load();
    this.tryReconnect();
  }

  private load(): void {
    const settings = this.storage.get<PrinterSettings>(PRINTER_KEY);
    if (settings) {
      // Migrate old wifi settings
      if ((settings.connectionType as any) === 'wifi') {
        settings.connectionType = 'bluetooth';
      }
      settings.paperWidth = '58mm'; // Force 58mm
      this.settingsSubject.next(settings);
    }

    const shop = this.storage.get<ShopDetails>(SHOP_KEY);
    if (shop) this.shopSubject.next(shop);
  }

  getSettings(): PrinterSettings {
    return this.settingsSubject.getValue();
  }

  getShopDetails(): ShopDetails {
    return {
      shopName: 'TEJAS NASTA CENTER',
      address: 'Tanand Phata - Kalambi Miraj',
      phone: '9730532999'
    };
  }

  isConnected(): boolean {
    return this.connectedSubject.getValue();
  }

  updateSettings(settings: PrinterSettings): void {
    this.storage.set(PRINTER_KEY, settings);
    this.settingsSubject.next(settings);
  }

  updateShopDetails(shop: ShopDetails): void {
    this.storage.set(SHOP_KEY, shop);
    this.shopSubject.next(shop);
  }

  // ── Bluetooth Scanning & Pairing ──

  isBluetoothSupported(): boolean {
    return !!(navigator as any).bluetooth;
  }

  isUsbSupported(): boolean {
    return !!(navigator as any).usb;
  }

  async scanBluetooth(): Promise<DiscoveredPrinter | null> {
    if (!this.isBluetoothSupported()) {
      this.printerStatusSubject.next('Bluetooth not supported in this browser');
      return null;
    }

    this.scanningSubject.next(true);
    this.printerStatusSubject.next('Scanning for Bluetooth printers...');

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          BT_PRINTER_SERVICE,
          BT_SPP_SERVICE,
          '00001101-0000-1000-8000-00805f9b34fb', // Standard SPP
          '0000fee7-0000-1000-8000-00805f9b34fb', // Thermal printer
          '00004991-0000-1000-8000-00805f9b34fb'  // POS-58
        ]
      });

      const printer: DiscoveredPrinter = {
        id: device.id,
        name: device.name || 'Unknown Printer',
        type: 'bluetooth',
        paired: true,
        device: device
      };

      this.printerStatusSubject.next(`Found: ${printer.name}`);
      this.scanningSubject.next(false);
      return printer;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        this.printerStatusSubject.next('No printer selected');
      } else {
        this.printerStatusSubject.next('Bluetooth scan failed');
      }
      this.scanningSubject.next(false);
      return null;
    }
  }

  async connectBluetooth(printer: DiscoveredPrinter): Promise<boolean> {
    this.connectingSubject.next(true);
    this.printerStatusSubject.next(`Connecting to ${printer.name}...`);

    try {
      const device = printer.device;
      const server = await device.gatt.connect();

      // Try primary service first, then fallback
      let service: any = null;
      let characteristic: any = null;

      try {
        service = await server.getPrimaryService(BT_PRINTER_SERVICE);
        characteristic = await service.getCharacteristic(BT_PRINTER_CHAR);
      } catch {
        try {
          service = await server.getPrimaryService(BT_SPP_SERVICE);
          characteristic = await service.getCharacteristic(BT_SPP_CHAR);
        } catch {
          // Try getting any available service & characteristic
          try {
            const services = await server.getPrimaryServices();
            for (const s of services) {
              try {
                const chars = await s.getCharacteristics();
                const foundChar = chars.find((c: any) =>
                  c.properties.write || c.properties.writeWithoutResponse
                );
                if (foundChar) {
                  service = s;
                  characteristic = foundChar;
                  break;
                }
              } catch (e) {
                console.warn('Error fetching characteristics:', e);
              }
            }
          } catch (e) {
            console.warn('Error fetching primary services:', e);
          }
        }
      }

      if (!characteristic) {
        this.printerStatusSubject.next('No writable characteristic found');
        this.connectingSubject.next(false);
        return false;
      }

      this.bluetoothDevice = device;
      this.bluetoothCharacteristic = characteristic;

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', () => {
        this.onDisconnected();
      });

      // Save connection info
      const settings = this.getSettings();
      settings.connectionType = 'bluetooth';
      settings.connectedDeviceName = printer.name;
      settings.connectedDeviceId = printer.id;
      this.updateSettings(settings);

      this.connectedSubject.next(true);
      this.connectingSubject.next(false);
      this.printerStatusSubject.next(`Connected: ${printer.name}`);
      return true;
    } catch (err: any) {
      console.error('Bluetooth connect error:', err);
      this.printerStatusSubject.next('Connection failed');
      this.connectingSubject.next(false);
      return false;
    }
  }

  // ── USB Scanning & Connecting ──

  async scanUsb(): Promise<DiscoveredPrinter | null> {
    if (!this.isUsbSupported()) {
      this.printerStatusSubject.next('WebUSB not supported in this browser');
      return null;
    }

    this.scanningSubject.next(true);
    this.printerStatusSubject.next('Select USB printer...');

    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [] // Show all USB devices
      });

      const printer: DiscoveredPrinter = {
        id: `usb-${device.vendorId}-${device.productId}`,
        name: device.productName || `USB Printer (${device.vendorId.toString(16)}:${device.productId.toString(16)})`,
        type: 'usb',
        paired: true,
        device: device
      };

      this.printerStatusSubject.next(`Found: ${printer.name}`);
      this.scanningSubject.next(false);
      return printer;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        this.printerStatusSubject.next('No USB device selected');
      } else {
        this.printerStatusSubject.next('USB scan failed');
      }
      this.scanningSubject.next(false);
      return null;
    }
  }

  async connectUsb(printer: DiscoveredPrinter): Promise<boolean> {
    this.connectingSubject.next(true);
    this.printerStatusSubject.next(`Connecting to ${printer.name}...`);

    try {
      const device = printer.device;
      await device.open();

      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Find the correct interface for printing
      const iface = device.configuration.interfaces.find((i: any) =>
        i.alternates.some((a: any) => a.interfaceClass === 7) // Printer class
      ) || device.configuration.interfaces[0];

      if (iface) {
        await device.claimInterface(iface.interfaceNumber);
      }

      this.usbDevice = device;

      const settings = this.getSettings();
      settings.connectionType = 'usb';
      settings.connectedDeviceName = printer.name;
      settings.connectedDeviceId = printer.id;
      this.updateSettings(settings);

      this.connectedSubject.next(true);
      this.connectingSubject.next(false);
      this.printerStatusSubject.next(`Connected: ${printer.name}`);
      return true;
    } catch (err: any) {
      console.error('USB connect error:', err);
      this.printerStatusSubject.next('USB connection failed');
      this.connectingSubject.next(false);
      return false;
    }
  }

  // ── Disconnect ──

  async disconnect(): Promise<void> {
    try {
      if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
        this.bluetoothDevice.gatt.disconnect();
      }
      if (this.usbDevice) {
        await this.usbDevice.close();
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    this.onDisconnected();
  }

  private onDisconnected(): void {
    this.bluetoothDevice = null;
    this.bluetoothCharacteristic = null;
    this.usbDevice = null;
    this.connectedSubject.next(false);

    const settings = this.getSettings();
    settings.connectedDeviceName = undefined;
    settings.connectedDeviceId = undefined;
    this.updateSettings(settings);

    this.printerStatusSubject.next('Disconnected');
  }

  // ── Try to reconnect to previously paired device ──

  private async tryReconnect(): Promise<void> {
    const settings = this.getSettings();
    if (!settings.connectedDeviceName) return;

    // For Bluetooth, we can't auto-reconnect without user gesture
    // Just show the last known device name
    this.printerStatusSubject.next(`Last: ${settings.connectedDeviceName} (tap Scan to reconnect)`);
  }

  // ── ESC/POS Receipt Generation ──

  private generateEscPos(bill: Bill): Uint8Array {
    const shop = this.getShopDetails();
    const settings = this.getSettings();
    const lineWidth = settings.paperWidth === '58mm' ? 32 : 48;

    const encoder = new TextEncoder();
    const commands: number[] = [];

    // ESC/POS commands
    const ESC = 0x1B;
    const GS = 0x1D;
    const LF = 0x0A;

    // Initialize printer
    commands.push(ESC, 0x40); // ESC @ - Initialize

    // Select standard ASCII character set if needed (optional)
    commands.push(ESC, 0x74, 0x00); // ESC t 0 (PC437) to avoid Chinese characters

    // Center alignment
    commands.push(ESC, 0x61, 0x01); // ESC a 1 - Center

    // Dynamically calculate the best font size so the complete name fits on one line
    const is58mm = settings.paperWidth === '58mm';
    const maxDoubleA = is58mm ? 16 : 24; // Font A Double size max chars
    const maxDoubleB = is58mm ? 21 : 32; // Font B Double size max chars

    commands.push(ESC, 0x45, 0x01); // ESC E 1 - Bold ON

    if (shop.shopName.length <= maxDoubleA) {
      commands.push(ESC, 0x4D, 0x00); // ESC M 0 - Font A
      commands.push(GS, 0x21, 0x11);  // GS ! 0x11 - Double size
    } else if (shop.shopName.length <= maxDoubleB) {
      commands.push(ESC, 0x4D, 0x01); // ESC M 1 - Font B
      commands.push(GS, 0x21, 0x11);  // GS ! 0x11 - Double size
    } else {
      commands.push(ESC, 0x4D, 0x00); // ESC M 0 - Font A
      commands.push(GS, 0x21, 0x00);  // GS ! 0x00 - Normal size
    }

    commands.push(...encoder.encode(shop.shopName.toUpperCase()));
    commands.push(LF);

    // Reset settings for the rest of the receipt
    commands.push(ESC, 0x4D, 0x00); // ESC M 0 - Font A
    commands.push(ESC, 0x45, 0x00); // ESC E 0 - Bold OFF
    commands.push(GS, 0x21, 0x00);  // GS ! 0x00 - Normal size

    // Address
    commands.push(...encoder.encode(shop.address));
    commands.push(LF);

    // Phone
    if (shop.phone) {
      commands.push(...encoder.encode(`Mob. No: ${shop.phone}`));
      commands.push(LF);
    }

    // Divider
    commands.push(...encoder.encode('-'.repeat(lineWidth)));
    commands.push(LF);

    // Left alignment
    commands.push(ESC, 0x61, 0x00); // ESC a 0 - Left

    // Bill number and date
    const date = new Date(bill.createdAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    let hh = date.getHours();
    const ampm = hh >= 12 ? 'pm' : 'am';
    hh = hh % 12;
    hh = hh ? hh : 12;
    const min = pad(date.getMinutes());
    const dateStr = `${yyyy}-${mm}-${dd} ${pad(hh)}:${min} ${ampm}`;

    commands.push(...encoder.encode(`BILL NO : ${bill.billNumber}`));
    commands.push(LF);
    commands.push(...encoder.encode(`Date    : ${dateStr}`));
    commands.push(LF);

    // Divider
    commands.push(...encoder.encode('-'.repeat(lineWidth)));
    commands.push(LF);

    // Header
    const headerLine = this.formatItemLine('Item Name', 'Qty', 'Rate', 'Amount', lineWidth);
    commands.push(...encoder.encode(headerLine));
    commands.push(LF);
    commands.push(...encoder.encode('-'.repeat(lineWidth)));
    commands.push(LF);

    // Items
    let totalQty = 0;
    let totalItems = bill.items.length;
    for (const item of bill.items) {
      const total = item.price * item.quantity;
      totalQty += item.quantity;
      const itemLine = this.formatItemLine(
        item.name,
        item.quantity.toString(),
        item.price.toFixed(0),
        total.toFixed(0),
        lineWidth
      );
      commands.push(...encoder.encode(itemLine));
      commands.push(LF);
    }

    // Divider
    commands.push(...encoder.encode('-'.repeat(lineWidth)));
    commands.push(LF);

    // Totals line
    const totalsLine = this.padLine(`Items: ${totalItems}/${totalQty}`, `Net: ${bill.grandTotal.toFixed(0)}`, lineWidth);
    commands.push(...encoder.encode(totalsLine));
    commands.push(LF);

    // Divider
    commands.push(...encoder.encode('-'.repeat(lineWidth)));
    commands.push(LF);

    // Footer
    commands.push(ESC, 0x61, 0x01); // Center

    commands.push(...encoder.encode('Thank you! Visit again.'));
    
    // Add small bottom feed to move the text safely above the cutter
    commands.push(LF, LF, LF, LF, LF); 

    // Cut paper (partial cut)
    commands.push(GS, 0x56, 0x01); // GS V 1 - Partial cut

    return new Uint8Array(commands);
  }

  private padLine(left: string, right: string, width: number): string {
    const padding = width - left.length - right.length;
    if (padding > 0) {
      return left + ' '.repeat(padding) + right;
    }
    if (left.length + right.length + 1 > width) {
      const shortenedLeft = left.substring(0, width - right.length - 1);
      return shortenedLeft + ' ' + right;
    }
    return left + ' ' + right;
  }

  private formatItemLine(name: string, qty: string, rate: string, amt: string, width: number): string {
    const qtyW = 4;
    const rateW = 7;
    const amtW = 8;
    const nameW = width - qtyW - rateW - amtW;

    const n = name.length > nameW ? name.substring(0, nameW) : name.padEnd(nameW);
    const q = qty.padStart(qtyW);
    const r = rate.padStart(rateW);
    const a = amt.padStart(amtW);

    return n + q + r + a;
  }

  // ── Send Data to Printer ──

  private async sendToPrinter(data: Uint8Array): Promise<boolean> {
    const settings = this.getSettings();

    if (settings.connectionType === 'bluetooth' && this.bluetoothCharacteristic) {
      return await this.sendViaBluetooth(data);
    } else if (settings.connectionType === 'usb' && this.usbDevice) {
      return await this.sendViaUsb(data);
    }

    return false;
  }

  private async sendViaBluetooth(data: Uint8Array): Promise<boolean> {
    try {
      // Bluetooth LE has max write size of ~512 bytes, send in chunks
      const CHUNK_SIZE = 100;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
        if (this.bluetoothCharacteristic.properties.writeWithoutResponse) {
          await this.bluetoothCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.bluetoothCharacteristic.writeValue(chunk);
        }
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      return true;
    } catch (err) {
      console.error('Bluetooth send error:', err);
      return false;
    }
  }

  private async sendViaUsb(data: Uint8Array): Promise<boolean> {
    try {
      const device = this.usbDevice;
      // Find the OUT endpoint
      const iface = device.configuration.interfaces.find((i: any) =>
        i.alternates.some((a: any) => a.interfaceClass === 7)
      ) || device.configuration.interfaces[0];

      if (!iface) return false;

      const alt = iface.alternates[0];
      const endpoint = alt.endpoints.find((e: any) => e.direction === 'out');

      if (endpoint) {
        await device.transferOut(endpoint.endpointNumber, data);
      } else {
        // Use control transfer as fallback
        await device.controlTransferOut({
          requestType: 'class',
          recipient: 'interface',
          request: 0x09,
          value: 0x0200,
          index: iface.interfaceNumber
        }, data);
      }
      return true;
    } catch (err) {
      console.error('USB send error:', err);
      return false;
    }
  }

  // ── Print Bill (Direct only — no browser fallback) ──

  async printBill(bill: Bill): Promise<'success' | 'failed' | 'not_connected'> {
    if (!this.isConnected()) {
      this.printerStatusSubject.next('Connecting to printer...');

      // Try quick GATT reconnect if bluetoothDevice is already in memory
      let reconnected = false;
      if (this.bluetoothDevice && this.bluetoothDevice.gatt) {
        try {
          const server = await this.bluetoothDevice.gatt.connect();
          let service: any = null;
          let characteristic: any = null;

          try {
            service = await server.getPrimaryService(BT_PRINTER_SERVICE);
            characteristic = await service.getCharacteristic(BT_PRINTER_CHAR);
          } catch {
            try {
              service = await server.getPrimaryService(BT_SPP_SERVICE);
              characteristic = await service.getCharacteristic(BT_SPP_CHAR);
            } catch {
              const services = await server.getPrimaryServices();
              for (const s of services) {
                try {
                  const chars = await s.getCharacteristics();
                  const foundChar = chars.find((c: any) =>
                    c.properties.write || c.properties.writeWithoutResponse
                  );
                  if (foundChar) {
                    service = s;
                    characteristic = foundChar;
                    break;
                  }
                } catch {}
              }
            }
          }

          if (characteristic) {
            this.bluetoothCharacteristic = characteristic;
            this.connectedSubject.next(true);
            const settings = this.getSettings();
            this.printerStatusSubject.next(`Connected: ${settings.connectedDeviceName || 'Printer'}`);
            reconnected = true;
          }
        } catch (e) {
          console.log('Quick GATT reconnect failed, scanning for printers...', e);
        }
      }

      // If not reconnected, trigger bluetooth scan & connect
      if (!reconnected) {
        const settings = this.getSettings();
        let printer: DiscoveredPrinter | null = null;

        if (settings.connectionType === 'bluetooth' || !settings.connectionType) {
          printer = await this.scanBluetooth();
          if (printer) {
            const connected = await this.connectBluetooth(printer);
            if (!connected) return 'failed';
          } else {
            return 'not_connected';
          }
        } else if (settings.connectionType === 'usb') {
          printer = await this.scanUsb();
          if (printer) {
            const connected = await this.connectUsb(printer);
            if (!connected) return 'failed';
          } else {
            return 'not_connected';
          }
        }
      }
    }

    // Direct print to connected printer
    this.printerStatusSubject.next('Printing...');
    const data = this.generateEscPos(bill);
    const success = await this.sendToPrinter(data);

    if (success) {
      this.printerStatusSubject.next('Print sent successfully ✓');
      setTimeout(() => {
        if (this.isConnected()) {
          const s = this.getSettings();
          this.printerStatusSubject.next(`Connected: ${s.connectedDeviceName || 'Printer'}`);
        }
      }, 3000);
      return 'success';
    } else {
      this.printerStatusSubject.next('Print failed - try reconnecting');
      return 'failed';
    }
  }

  private printViaWindow(bill: Bill): void {
    const shop = this.getShopDetails();
    const settings = this.getSettings();
    const is58mm = settings.paperWidth === '58mm';
    const widthPx = is58mm ? 220 : 300;
    
    // Dynamically calculate the best font size so the complete name fits on one line
    const headerFontSize = is58mm 
      ? (shop.shopName.length <= 16 ? '16px' : (shop.shopName.length <= 21 ? '14px' : '12px')) 
      : (shop.shopName.length <= 24 ? '18px' : (shop.shopName.length <= 32 ? '16px' : '14px'));

    const date = new Date(bill.createdAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    let hh = date.getHours();
    const ampm = hh >= 12 ? 'pm' : 'am';
    hh = hh % 12;
    hh = hh ? hh : 12;
    const min = pad(date.getMinutes());
    const dateStr = `${yyyy}-${mm}-${dd} ${pad(hh)}:${min} ${ampm}`;

    let itemsHtml = '';
    let totalQty = 0;
    let totalItems = bill.items.length;
    for (const item of bill.items) {
      const total = item.price * item.quantity;
      totalQty += item.quantity;
      itemsHtml += `
        <tr>
          <td style="text-align:left;padding:1px 0;vertical-align:top;font-family:monospace;">${item.name}</td>
          <td style="text-align:center;padding:1px 0;vertical-align:top;font-family:monospace;">${item.quantity}</td>
          <td style="text-align:right;padding:1px 0;vertical-align:top;font-family:monospace;">${item.price.toFixed(0)}</td>
          <td style="text-align:right;padding:1px 0;vertical-align:top;font-family:monospace;">${total.toFixed(0)}</td>
        </tr>`;
    }

    const html = `
      <html>
      <head><title>Receipt - ${bill.billNumber}</title>
      <style>
        @page { margin: 0; size: ${settings.paperWidth} auto; }
        body { font-family: 'Courier New', monospace; font-size: 11px; width: ${widthPx}px; margin: 0 auto; color: #000; padding: 4px; line-height: 1.1; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 2px 0; font-size: 11px; font-family: monospace; }
        td { font-size: 11px; font-family: monospace; }
        .flex-between { display: flex; justify-content: space-between; }
      </style></head>
      <body>
        <div class="center bold" style="font-size:${headerFontSize};margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:clip;">${shop.shopName.toUpperCase()}</div>
        <div class="center">${shop.address}</div>
        ${shop.phone ? `<div class="center">Mob. No: ${shop.phone}</div>` : ''}
        <div class="divider"></div>
        <div>BILL NO : ${bill.billNumber}</div>
        <div>Date    : ${dateStr}</div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th class="bold">Item Name</th>
              <th class="bold" style="text-align:center;">Qty</th>
              <th class="bold" style="text-align:right;">Rate</th>
              <th class="bold" style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="flex-between bold">
          <span>Items: ${totalItems}/${totalQty}</span>
          <span>Net: ${bill.grandTotal.toFixed(0)}</span>
        </div>
        <div class="divider"></div>
        <div class="center" style="margin-top:2px; margin-bottom:1px;">Thank you! Visit again.</div>
        <div class="center" style="margin-bottom:25px;"></div>
      </body></html>`;

    // Use hidden iframe instead of window.open (which is blocked on mobile)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remove iframe after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    }
  }

  testPrint(): void {
    const testBill: Bill = {
      id: 'test',
      billNumber: 'BR_TEST_001',
      items: [
        { foodId: '1', name: 'Filter Coffee', price: 30, quantity: 2, image: '' },
        { foodId: '2', name: 'Masala Dosa', price: 80, quantity: 1, image: '' },
        { foodId: '3', name: 'Idli (2 pcs)', price: 40, quantity: 1, image: '' }
      ],
      subtotal: 180,
      grandTotal: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.printBill(testBill);
  }
}
