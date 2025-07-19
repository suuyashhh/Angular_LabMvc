import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent implements OnInit, AfterViewInit {
  reportCount: any;
  
  constructor(private api: ApiService) { }

  fromDateValue = '';
  toDateValue = '';
  displayFromDate = '[DD/MM/yyyy]';
  displayToDate = '[DD/MM/yyyy]';

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadData();
  }

  // Set default dates to first and last day of current month
  private setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Format for input fields (YYYY-MM-DD)
    this.fromDateValue = this.formatDateForInput(firstDay);
    this.toDateValue = this.formatDateForInput(lastDay);
    
    // Format for display (DD/MM/YYYY)
    this.displayFromDate = this.formatDateForDisplay(firstDay);
    this.displayToDate = this.formatDateForDisplay(lastDay);
    
    // Set the input element values
    setTimeout(() => {
      const fromDateInput = document.getElementById('fromDate') as HTMLInputElement;
      const toDateInput = document.getElementById('toDate') as HTMLInputElement;
      if (fromDateInput) fromDateInput.value = this.fromDateValue;
      if (toDateInput) toDateInput.value = this.toDateValue;
    });
  }

  private loadData(): void {
  if (!this.fromDateValue || !this.toDateValue) return;
  
  // Convert input dates (YYYY-MM-DD) to API format (YYYYMMDD)
  const fromDateParts = this.fromDateValue.split('-');
  const toDateParts = this.toDateValue.split('-');
  
  const dateFrom = `${fromDateParts[0]}${fromDateParts[1]}${fromDateParts[2]}`;
  const dateTo = `${toDateParts[0]}${toDateParts[1]}${toDateParts[2]}`;
  
  this.api.get('Finance/Finance/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
    this.reportCount = res;
    console.log(res);
  });
}

  onFromDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fromDateValue = value;
    this.displayFromDate = this.formatDateForDisplay(new Date(value));
    this.loadData();
  }

  onToDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.toDateValue = value;
    this.displayToDate = this.formatDateForDisplay(new Date(value));
    this.loadData();
  }

  // Format Date object to YYYY-MM-DD for input element
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format Date object to DD/MM/YYYY for display
  private formatDateForDisplay(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  handlePrint(): void {
    window.print();
  }

  ngAfterViewInit(): void {
    console.log('FinanceComponent initialized');
  }
}