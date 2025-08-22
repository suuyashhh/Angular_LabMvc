import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ServicesService } from '../../shared/services.service';
import { FormattedDatePipe } from '../../shared/pipes/formatted-date.pipe';

@Component({
  selector: 'app-finance-records',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FormattedDatePipe],
  templateUrl: './finance-records.component.html',
  styleUrls: ['./finance-records.component.css']
})
export class FinanceRecordsComponent implements OnInit {
  reportData: any;
  startDate: string = '';
  endDate: string = '';
  type: string = '';
  displayFromDate: string = '';
  displayToDate: string = '';
  doctor: any;
  employee: any;

  constructor(
    private api: ApiService, 
    private route: ActivatedRoute,
    private service: ServicesService
  ) { }

  ngOnInit() {
    this.loadInitialData();
    this.loadQueryParams();
  }

  private loadInitialData(): void {
    this.api.get('Doctor/Doctors').subscribe((res: any) => {
      this.doctor = res;
    });
    
    this.api.get('Employee/Employees').subscribe((res: any) => {
      this.employee = res;
    });
  }

  private loadQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      this.startDate = params['fromDate'] || '';
      this.endDate = params['toDate'] || '';
      this.type = params['type'] || '';

      // Format dates for display
      this.displayFromDate = this.service.getFormattedDate(this.startDate, 3);
      this.displayToDate = this.service.getFormattedDate(this.endDate, 3);
      
      // Set the input values
      setTimeout(() => {
        const fromDateInput = document.getElementById('fromDate') as HTMLInputElement;
        const toDateInput = document.getElementById('toDate') as HTMLInputElement;
        if (fromDateInput) fromDateInput.value = this.startDate;
        if (toDateInput) toDateInput.value = this.endDate;
      });
      
      this.loadReportData();
    });
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      this.displayFromDate = this.service.getFormattedDate(this.startDate, 3);
      this.displayToDate = this.service.getFormattedDate(this.endDate, 3);
      this.loadReportData();
    }
  }

  private loadReportData(): void {
    if (!this.startDate || !this.endDate || !this.type) return;
    
    const dateFrom = this.service.formatDate(this.startDate, 1);
    const dateTo = this.service.formatDate(this.endDate, 1);
    
    const apiEndpoints: {[key: string]: string} = {
      'casepaper': `CasePaper/GetDateWiseCasePaper/${dateFrom},${dateTo}`,
      'labmaterial': `LabMaterials/GetDateWiseLabMaterials/${dateFrom},${dateTo}`,
      'bikefule': `BikeFule/GetDateWiseBikeFule/${dateFrom},${dateTo}`,
      'empsalary': `EmployeeSalary/GetDateWiseEmpSalary/${dateFrom},${dateTo}`,
      'elcbill': `ElectricityBill/GetDateWiseElcBill/${dateFrom},${dateTo}`,
      'otherexpense': `OtherExpense/GetDateWiseOthMaterials/${dateFrom},${dateTo}`,
      'doccommission': `DoctorCommission/GetDateWiseDocCommission/${dateFrom},${dateTo}`
    };

    const endpoint = apiEndpoints[this.type];
    
    if (endpoint) {
      this.api.get(endpoint).subscribe((res: any) => {
        this.reportData = res;
        console.log(res);
      });
    }
  }

  getDoctorName(code: number): string {
    if (!this.doctor || !Array.isArray(this.doctor)) return 'Unknown';
    const doc = this.doctor.find((d: any) => d.doctoR_CODE === code);
    return doc ? doc.doctoR_NAME : 'Unknown';
  }

  getEmployeeName(id: number): string {
    if (!this.employee || !Array.isArray(this.employee)) return 'Unknown';
    const emp = this.employee.find((e: any) => e.emP_ID == id);
    return emp ? emp.emP_NAME : 'Unknown';
  }

  handlePrint(): void {
    window.print();
  }
}