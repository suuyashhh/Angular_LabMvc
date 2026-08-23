import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Bill } from '../../models/interfaces';
import { BillingService } from '../../services/billing.service';
import { PrinterService } from '../../services/printer.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-entries',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.css']
})
export class EntriesComponent implements OnInit {
  bills: Bill[] = [];
  printMessage = '';
  
  showFilterModal = false;
  startDate: string = '';
  endDate: string = '';

  constructor(
    private billing: BillingService,
    private printer: PrinterService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    this.startDate = todayStr;
    this.endDate = todayStr;

    this.applyFilter();
  }

  applyFilter(): void {
    const startStr = `${this.startDate}T00:00:00`;
    const endStr = `${this.endDate}T23:59:59`;

    this.billing.fetchBillsByDateRange(startStr, endStr).subscribe(bills => {
      let filtered = [...bills];

      filtered.sort((a, b) => {
        const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (dateDiff !== 0) return dateDiff;
        const numA = parseInt(a.billNumber.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.billNumber.replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });

      this.bills = filtered;
      this.showFilterModal = false;
    });
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  getTotalItems(bill: Bill): number {
    return bill.items.reduce((s, i) => s + i.quantity, 0);
  }

  getItemNames(bill: Bill): string {
    return bill.items.map(i => i.name).join(', ');
  }

  async reprintBill(bill: Bill): Promise<void> {
    const result = await this.printer.printBill(bill);
    if (result === 'not_connected') {
      this.printMessage = '⚠ Printer is not connected! Go to Printer page to connect.';
    } else if (result === 'success') {
      this.printMessage = '✓ Sent to printer!';
    } else {
      this.printMessage = '✗ Print failed — try reconnecting';
    }
    setTimeout(() => this.printMessage = '', 4000);
  }
}
