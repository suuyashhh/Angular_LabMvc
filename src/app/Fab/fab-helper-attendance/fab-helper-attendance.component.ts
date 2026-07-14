import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-helper-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fab-helper-attendance.component.html',
  styleUrls: ['./fab-helper-attendance.component.css']
})
export class FabHelperAttendanceComponent implements OnInit {
  user: any = null;
  selectedStatus: string = 'Full Day';
  todayDateStr: string = new Date().toISOString().substring(0, 10);
  alreadyMarked = false;
  todayRecord: any = null;

  // Monthly Calendar Log
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  attendanceLogs: any[] = [];
  monthsList = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];
  yearsList: number[] = [];

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
      this.yearsList.push(y);
    }
  }

  ngOnInit() {
    this.user = this.auth.getFabCredentialsFromCookie();
    if (!this.user) {
      this.toastr.error('Session expired. Please log in again.', 'Error');
      return;
    }
    this.checkTodayAttendance();
    this.fetchMonthlyLogs();
  }

  checkTodayAttendance() {
    this.http.get<any>(`${this.api.baseurl}Fab/Attendance/Check?userId=${this.user.user_id}&userName=${encodeURIComponent(this.user.user_name)}&date=${this.todayDateStr}`).subscribe({
      next: (res) => {
        this.alreadyMarked = res.exists;
        if (res.exists) {
          // fetch today's record to display status
          this.http.get<any[]>(`${this.api.baseurl}Fab/Attendance/Date?date=${this.todayDateStr}`).subscribe({
            next: (records) => {
              this.todayRecord = (records || []).find(r => r.user_id === this.user.user_id);
            }
          });
        }
      },
      error: (err) => console.error(err)
    });
  }

  submitAttendance() {
    this.loader.show();
    const payload = {
      user_id: this.user.user_id,
      user_name: this.user.user_name,
      user_day: this.selectedStatus,
      date: this.todayDateStr
    };

    this.http.post(`${this.api.baseurl}Fab/Attendance`, payload).subscribe({
      next: (res: any) => {
        this.loader.hide();
        if (res.success) {
          this.toastr.success(`Attendance submitted: ${this.selectedStatus}`, 'Success');
          this.checkTodayAttendance();
          this.fetchMonthlyLogs();
        } else {
          this.toastr.error('Failed to submit attendance', 'Error');
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Server error submitting attendance', 'Error');
        this.loader.hide();
      }
    });
  }

  fetchMonthlyLogs() {
    this.http.get<any[]>(`${this.api.baseurl}Fab/Attendance/Helper/Month?userId=${this.user.user_id}&month=${this.selectedMonth}&year=${this.selectedYear}`).subscribe({
      next: (res) => {
        this.attendanceLogs = res || [];
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to fetch monthly attendance summary', 'Error');
      }
    });
  }
}
