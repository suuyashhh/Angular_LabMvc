import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Bill } from '../../models/interfaces';
import { BillingService } from '../../services/billing.service';
import { PrinterService } from '../../services/printer.service';

@Component({
  selector: 'app-entries',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './entries.component.html',
  styleUrls: ['./entries.component.css']
})
export class EntriesComponent implements OnInit {
  bills: Bill[] = [];
  printMessage = '';

  constructor(
    private billing: BillingService,
    private printer: PrinterService
  ) {}

  ngOnInit(): void {
    this.billing.bills$.subscribe(bills => {
      this.bills = [...bills];
    });
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
