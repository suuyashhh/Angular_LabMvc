import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent implements AfterViewInit {
  // Remove ViewChild references since we'll use template references
  fromDateValue = '';
  toDateValue = '';
  displayFromDate = '[DD/MM/yyyy]';
  displayToDate = '[DD/MM/yyyy]';

  ngAfterViewInit(): void {
    console.log('FinanceComponent initialized');
  }

  onFromDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fromDateValue = value;
    this.displayFromDate = this.formatDate(value);
  }

  onToDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.toDateValue = value;
    this.displayToDate = this.formatDate(value);
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '[DD/MM/yyyy]';

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  handlePrint(): void {
    console.log('Print button clicked');
    window.print();
  }

  handleCancel(): void {
    console.log('Cancel button clicked');
    this.fromDateValue = '';
    this.toDateValue = '';
    this.displayFromDate = '[DD/MM/yyyy]';
    this.displayToDate = '[DD/MM/yyyy]';
  }
}