
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../shared/api.service';

@Component({
  selector: 'app-finance-records',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './finance-records.component.html',
  styleUrls: ['./finance-records.component.css']
})
export class FinanceRecordsComponent implements OnInit {
  reportData: any;
  fromDate: string = '';
  toDate: string = '';
  type: string = '';
  displayFromDate: string = ''; 
  displayToDate: string = '';   

  constructor(private api: ApiService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.loadData();

  }

  private formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY format
    }
    return dateString; // fallback if format is unexpected
  }

  private loadData(): void {
    debugger;
    this.route.queryParams.subscribe(params => {
      this.fromDate = params['fromDate'];
      this.toDate = params['toDate'];
      this.type = params['type'];

      // Format dates for display
      this.displayFromDate = this.formatDateForDisplay(this.fromDate);
      this.displayToDate = this.formatDateForDisplay(this.toDate);
    });

    if (!this.fromDate || !this.toDate) return;

    const fromDateParts = this.fromDate.split('-');
    const toDateParts = this.toDate.split('-');

    const dateFrom = `${fromDateParts[0]}${fromDateParts[1]}${fromDateParts[2]}`;
    const dateTo = `${toDateParts[0]}${toDateParts[1]}${toDateParts[2]}`;

    if (this.type == "casepaper") {
      this.api.get('CasePaper/GetDateWiseCasePaper/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
        this.reportData = res;
        console.log(res);
      });
    }
    else if (this.type == "labmaterial") {
      this.api.get('LabMaterials/GetDateWiseLabMaterials/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
        this.reportData = res;
        console.log(res);
      });
    }
    else if (this.type == "bikefule") {
      this.api.get('BikeFule/GetDateWiseBikeFule/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
        this.reportData = res;
        console.log(res);
      });
    }
    else if (this.type == "empsalary") {
      this.api.get('EmployeeSalary/GetDateWiseEmpSalary/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
        this.reportData = res;
        console.log(res);
      });
    }
    else if (this.type == "elcbill") {
      this.api.get('ElectricityBill/GetDateWiseElcBill/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
        this.reportData = res;
        console.log(res);
      });
    }
    else if (this.type == "otherexpense") {
      this.api.get('OtherExpense/GetDateWiseOthMaterials/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
        this.reportData = res;
        console.log(res);
      });
    }
    else if (this.type == "doccommission") {
      this.api.get('DoctorCommission/GetDateWiseDocCommission/' + dateFrom + ',' + dateTo).subscribe((res: any) => {
        this.reportData = res;
        console.log(res);
      });
    }

  }


  handlePrint(): void {
    window.print();
  }
}