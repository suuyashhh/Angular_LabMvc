import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PrinterSettings, ShopDetails, DiscoveredPrinter } from '../../models/interfaces';
import { PrinterService } from '../../services/printer.service';

@Component({
  selector: 'app-printer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './printer.component.html',
  styleUrls: ['./printer.component.css']
})
export class PrinterComponent implements OnInit, OnDestroy {
  settings: PrinterSettings = { connectionType: 'bluetooth', paperWidth: '58mm' };
  Tejas: ShopDetails = { shopName: 'Breakfast Center', address: '123 Main Road', phone: '' };

  isConnected = false;
  isScanning = false;
  isConnecting = false;
  printerStatus = 'Not connected';

  // Last discovered printer (from scan)
  discoveredPrinter: DiscoveredPrinter | null = null;

  connectionTypes = [
    {
      value: 'bluetooth' as const,
      label: 'Bluetooth',
      icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6.5,6.5 17.5,17.5"/><path d="M7 17l10-10-5-5v20l5-5"/></svg>'
    },
    {
      value: 'usb' as const,
      label: 'USB',
      icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V2"/><path d="M5 12H2a10 10 0 0020 0h-3"/><circle cx="12" cy="12" r="2"/></svg>'
    }
  ];

  private subs: Subscription[] = [];

  constructor(private printerService: PrinterService) {}

  ngOnInit(): void {
    this.settings = { ...this.printerService.getSettings() };
    this.Tejas = { ...this.printerService.getShopDetails() };

    this.subs.push(
      this.printerService.connected$.subscribe(c => this.isConnected = c),
      this.printerService.scanning$.subscribe(s => this.isScanning = s),
      this.printerService.connecting$.subscribe(c => this.isConnecting = c),
      this.printerService.printerStatus$.subscribe(s => this.printerStatus = s)
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  setConnectionType(type: 'bluetooth' | 'usb'): void {
    this.settings.connectionType = type;
    this.printerService.updateSettings(this.settings);
  }



  saveShopDetails(): void {
    this.printerService.updateShopDetails(this.Tejas);
  }

  testPrint(): void {
    this.printerService.testPrint();
  }

  async scanForPrinters(): Promise<void> {
    if (this.settings.connectionType === 'bluetooth') {
      this.discoveredPrinter = await this.printerService.scanBluetooth();
    } else {
      this.discoveredPrinter = await this.printerService.scanUsb();
    }

    // Auto-connect after scan
    if (this.discoveredPrinter) {
      await this.connectToPrinter();
    }
  }

  async connectToPrinter(): Promise<void> {
    if (!this.discoveredPrinter) return;

    if (this.discoveredPrinter.type === 'bluetooth') {
      await this.printerService.connectBluetooth(this.discoveredPrinter);
    } else {
      await this.printerService.connectUsb(this.discoveredPrinter);
    }
  }

  async disconnectPrinter(): Promise<void> {
    await this.printerService.disconnect();
    this.discoveredPrinter = null;
  }

  get isApiSupported(): boolean {
    return this.settings.connectionType === 'bluetooth'
      ? this.printerService.isBluetoothSupported()
      : this.printerService.isUsbSupported();
  }
}
