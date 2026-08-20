import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrinterSettings, ShopDetails } from '../../models/interfaces';
import { PrinterService } from '../../services/printer.service';

@Component({
  selector: 'app-printer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './printer.component.html',
  styleUrls: ['./printer.component.css']
})
export class PrinterComponent implements OnInit {
  settings: PrinterSettings = { connectionType: 'bluetooth', paperWidth: '80mm' };
  shop: ShopDetails = { shopName: 'Breakfast Center', address: '123 Main Road', phone: '' };

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
    },
    {
      value: 'wifi' as const,
      label: 'Wi-Fi',
      icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>'
    }
  ];

  constructor(private printerService: PrinterService) {}

  ngOnInit(): void {
    this.settings = { ...this.printerService.getSettings() };
    this.shop = { ...this.printerService.getShopDetails() };
  }

  setConnectionType(type: 'bluetooth' | 'usb' | 'wifi'): void {
    this.settings.connectionType = type;
    this.printerService.updateSettings(this.settings);
  }

  setPaperWidth(width: '58mm' | '80mm'): void {
    this.settings.paperWidth = width;
    this.printerService.updateSettings(this.settings);
  }

  saveShopDetails(): void {
    this.printerService.updateShopDetails(this.shop);
  }

  testPrint(): void {
    this.printerService.testPrint();
  }
}
