import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { Router, RouterModule } from '@angular/router';
import { ServicesService } from '../../shared/services.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent implements OnInit {
  reportCount: any;
  startDate!: string;
  endDate!: string;
  displayFromDate = '[DD/MM/yyyy]';
  displayToDate = '[DD/MM/yyyy]';
  
  constructor(
    private api: ApiService,
    private router: Router,
    private service: ServicesService
  ) { }

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadData();
  }

  // Set default dates to first and last day of current month
  private setDefaultDates(): void {
    const { start, end } = this.service.getCurrentMonthRange();
    this.startDate = start;
    this.endDate = end;
    
    this.displayFromDate = this.service.getFormattedDate(this.startDate, 3);
    this.displayToDate = this.service.getFormattedDate(this.endDate, 3);
    
    // Set the input values
    setTimeout(() => {
      const fromDateInput = document.getElementById('fromDate') as HTMLInputElement;
      const toDateInput = document.getElementById('toDate') as HTMLInputElement;
      if (fromDateInput) fromDateInput.value = this.startDate;
      if (toDateInput) toDateInput.value = this.endDate;
    });
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      this.displayFromDate = this.service.getFormattedDate(this.startDate, 3);
      this.displayToDate = this.service.getFormattedDate(this.endDate, 3);
      this.loadData();
    }
  }

  private loadData(): void {
    if (!this.startDate || !this.endDate) return;
    
    const dateFrom = this.service.formatDate(this.startDate, 1);
    const dateTo = this.service.formatDate(this.endDate, 1);
    
    this.api.get('Finance/Finance/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
      this.reportCount = res;
      console.log(res);
    });
  }

  handlePrint(): void {
    window.print();
  }

  // Navigation methods
  navigateToCasePaper() {
    this.navigateWithDates('casepaper');
  }

  navigateToLabMat() {
    this.navigateWithDates('labmaterial');
  }

  navigateToBikeFule() {
    this.navigateWithDates('bikefule');
  }

  navigateToEmpSalary() {
    this.navigateWithDates('empsalary');
  }
  
  navigateToElcBill() {
    this.navigateWithDates('elcbill');
  }
  
  navigateToOtherExp() {
    this.navigateWithDates('otherexpense');
  }
  
  navigateToDocCommission() {
    this.navigateWithDates('doccommission');
  }

  private navigateWithDates(type: string): void {
    this.router.navigate(['/LABADMIN/finance-records'], { 
      queryParams: { 
        fromDate: this.startDate,
        toDate: this.endDate,
        type: type
      }
    });
  }
}