import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PrinterSettings, ShopDetails, Bill } from '../models/interfaces';
import { StorageService } from './storage.service';

const PRINTER_KEY = 'bc_printer_settings';
const SHOP_KEY = 'bc_shop_details';

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private settingsSubject = new BehaviorSubject<PrinterSettings>({
    connectionType: 'bluetooth',
    paperWidth: '80mm'
  });
  settings$ = this.settingsSubject.asObservable();

  private shopSubject = new BehaviorSubject<ShopDetails>({
    shopName: 'Breakfast Center',
    address: '123 Main Road',
    phone: ''
  });
  shop$ = this.shopSubject.asObservable();

  constructor(private storage: StorageService) {
    this.load();
  }

  private load(): void {
    const settings = this.storage.get<PrinterSettings>(PRINTER_KEY);
    if (settings) this.settingsSubject.next(settings);

    const shop = this.storage.get<ShopDetails>(SHOP_KEY);
    if (shop) this.shopSubject.next(shop);
  }

  getSettings(): PrinterSettings {
    return this.settingsSubject.getValue();
  }

  getShopDetails(): ShopDetails {
    return this.shopSubject.getValue();
  }

  updateSettings(settings: PrinterSettings): void {
    this.storage.set(PRINTER_KEY, settings);
    this.settingsSubject.next(settings);
  }

  updateShopDetails(shop: ShopDetails): void {
    this.storage.set(SHOP_KEY, shop);
    this.shopSubject.next(shop);
  }

  printBill(bill: Bill): void {
    const shop = this.getShopDetails();
    const settings = this.getSettings();
    const widthPx = settings.paperWidth === '58mm' ? 220 : 300;

    const date = new Date(bill.createdAt);
    const dateStr = date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    let itemsHtml = '';
    for (const item of bill.items) {
      const total = item.price * item.quantity;
      itemsHtml += `
        <tr>
          <td style="text-align:left;padding:2px 0;">${item.name}</td>
          <td style="text-align:center;padding:2px 4px;">${item.quantity}</td>
          <td style="text-align:right;padding:2px 0;">₹${item.price.toFixed(2)}</td>
          <td style="text-align:right;padding:2px 0;">₹${total.toFixed(2)}</td>
        </tr>`;
    }

    const html = `
      <html>
      <head><title>Receipt - ${bill.billNumber}</title>
      <style>
        @page { margin: 4mm; size: ${settings.paperWidth} auto; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: ${widthPx}px; margin: 0 auto; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; font-size: 11px; }
        .total-row td { font-weight: bold; padding-top: 4px; font-size: 13px; }
      </style></head>
      <body>
        <div class="center bold" style="font-size:16px;margin-bottom:2px;">${shop.shopName}</div>
        <div class="center" style="font-size:10px;">${shop.address}</div>
        ${shop.phone ? `<div class="center" style="font-size:10px;">Ph: ${shop.phone}</div>` : ''}
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>${bill.billNumber}</span>
          <span>${dateStr}</span>
        </div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Rate</th>
              <th style="text-align:right;">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="divider"></div>
        <table>
          <tr>
            <td style="text-align:left;">Subtotal</td>
            <td style="text-align:right;">₹${bill.subtotal.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td style="text-align:left;">Grand Total</td>
            <td style="text-align:right;">₹${bill.grandTotal.toFixed(2)}</td>
          </tr>
        </table>
        <div class="divider"></div>
        <div class="center" style="font-size:10px;margin-top:6px;">Thank you! Visit again.</div>
      </body></html>`;

    const printWindow = window.open('', '_blank', `width=${widthPx + 40},height=600`);
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 400);
    }
  }

  testPrint(): void {
    const shop = this.getShopDetails();
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
