import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-fab-admin-create-salaryslip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fab-admin-create-salaryslip.component.html',
  styleUrls: ['./fab-admin-create-salaryslip.component.css']
})
export class FabAdminCreateSalaryslipComponent implements OnInit {
  helpers: any[] = [];
  selectedUserId: number | null = null;
  fromDate: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  toDate: string = new Date().toISOString().substring(0, 10);
  dateWiseAttendance: any[] = [];
  
  summary: any = null;
  calculatedSlip: any = null;
  hasCalculated = false;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchHelpers();
  }

  fetchHelpers() {
    this.http.get<any[]>(`${this.api.baseurl}Fab/Helpers`).subscribe({
      next: (res) => {
        this.helpers = res || [];
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load helpers', 'Error');
      }
    });
  }

  calculateSalary() {
    if (!this.selectedUserId || !this.fromDate || !this.toDate) {
      this.toastr.warning('Please select a helper and enter dates', 'Validation');
      return;
    }

    this.loader.show();
    
    // 1. Fetch helper date-wise attendance
    this.http.get<any[]>(`${this.api.baseurl}Fab/Helper/${this.selectedUserId}/Attendance?fromDate=${this.fromDate}&toDate=${this.toDate}`).subscribe({
      next: (attList) => {
        this.dateWiseAttendance = (attList || []).map(item => {
          let cssClass = 'off-day';
          const day = item.user_day || '';
          if (day.trim().toLowerCase() === 'full day') cssClass = 'full-day';
          else if (day.trim().toLowerCase() === 'half day') cssClass = 'half-day';
          else if (day.trim().toLowerCase() === 'off day') cssClass = 'off-day';
          return {
            ...item,
            cssClass
          };
        });

        // 2. Fetch helper attendance summary for totals
        this.http.get<any>(`${this.api.baseurl}Fab/Helper/${this.selectedUserId}/Summary?fromDate=${this.fromDate}&toDate=${this.toDate}`).subscribe({
          next: (res) => {
            this.loader.hide();
            if (res) {
              this.summary = res;
              
              // Perform calculations
              const userSalary = res.user_salary || 0;
              const fullDayTotal = res.fullDay_Count * userSalary;
              const halfDayTotal = res.halfDay_Count * (userSalary / 2);
              const advanceTotal = res.totaL_ADVANCE || 0;
              const grandTotal = (fullDayTotal + halfDayTotal) - advanceTotal;

              this.calculatedSlip = {
                user_id: res.user_id,
                user_name: res.user_name,
                from_date: this.fromDate,
                tO_date: this.toDate,
                full_day: res.fullDay_Count,
                half_day: res.halfDay_Count,
                off_day: res.offDay_Count,
                full_salary: userSalary,
                half_salary: userSalary / 2,
                advance_salary: advanceTotal,
                full_day_Total: fullDayTotal,
                half_day_total: halfDayTotal,
                advance_total: advanceTotal,
                grand_total: grandTotal,
                slip_day: new Date().toISOString().substring(0, 10)
              };
              this.hasCalculated = true;
            } else {
              this.toastr.error('Failed to aggregate summary for selected helper', 'Error');
              this.hasCalculated = false;
            }
          },
          error: (err) => {
            console.error(err);
            this.toastr.error('Failed to compile attendance and advance data', 'Error');
            this.loader.hide();
            this.hasCalculated = false;
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load date-wise attendance list', 'Error');
        this.loader.hide();
      }
    });
  }

  onSalaryInputsChange() {
    if (!this.calculatedSlip) return;
    const fullSal = parseFloat(this.calculatedSlip.full_salary) || 0;
    const halfSal = parseFloat(this.calculatedSlip.half_salary) || 0;
    const adv = parseFloat(this.calculatedSlip.advance_total) || 0;

    this.calculatedSlip.full_salary = fullSal;
    this.calculatedSlip.half_salary = halfSal;
    this.calculatedSlip.advance_salary = adv;
    this.calculatedSlip.advance_total = adv;

    this.calculatedSlip.full_day_Total = this.calculatedSlip.full_day * fullSal;
    this.calculatedSlip.half_day_total = this.calculatedSlip.half_day * halfSal;
    this.calculatedSlip.grand_total = this.calculatedSlip.full_day_Total + this.calculatedSlip.half_day_total - adv;
  }

  saveSalarySlip() {
    if (!this.calculatedSlip) return;

    this.loader.show();
    this.http.post(`${this.api.baseurl}Fab/SalarySlip`, this.calculatedSlip).subscribe({
      next: (res: any) => {
        this.loader.hide();
        if (res.success) {
          this.toastr.success('Salary Slip saved successfully!', 'Success');
          this.router.navigate(['/fab/salary-history']);
        } else {
          this.toastr.error('Failed to save salary slip', 'Error');
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Server error saving salary slip', 'Error');
        this.loader.hide();
      }
    });
  }
}
