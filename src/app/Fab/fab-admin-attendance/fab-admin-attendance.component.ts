import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fab-admin-attendance.component.html',
  styleUrls: ['./fab-admin-attendance.component.css']
})
export class FabAdminAttendanceComponent implements OnInit {
  selectedDate: string = new Date().toISOString().substring(0, 10);
  helpers: any[] = [];
  attendanceList: any[] = [];
  isSavedAttendance = false;
  activeTab: string = 'registry';
  
  // History tab
  historyFrom: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  historyTo: string = new Date().toISOString().substring(0, 10);
  historyRecords: any[] = [];

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchDataForDate();
  }

  fetchDataForDate() {
    this.loader.show();
    // First, load all helpers to make sure we have their IDs and Names
    this.http.get<any[]>(`${this.api.baseurl}Fab/Helpers`).subscribe({
      next: (helpersRes) => {
        this.helpers = helpersRes || [];
        
        // Then, load attendance for the selected date
        this.http.get<any[]>(`${this.api.baseurl}Fab/Attendance/Date?date=${this.selectedDate}`).subscribe({
          next: (attendanceRes) => {
            const existing = attendanceRes || [];
            
            if (existing.length > 0) {
              this.isSavedAttendance = true;
              this.attendanceList = this.helpers.map(h => {
                const att = existing.find(x => x.user_id === h.user_id);
                return {
                  h_id: att ? att.h_id : null,
                  user_id: h.user_id,
                  user_name: h.user_name,
                  user_day: att ? att.user_day : 'Off Day',
                  exists: !!att
                };
              });
            } else {
              this.isSavedAttendance = false;
              this.attendanceList = this.helpers.map(h => ({
                h_id: null,
                user_id: h.user_id,
                user_name: h.user_name,
                user_day: 'Off Day', // default for marking new
                exists: false
              }));
            }
            this.loader.hide();
          },
          error: (err) => {
            console.error(err);
            this.toastr.error('Failed to fetch attendance records', 'Error');
            this.loader.hide();
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load helper list', 'Error');
        this.loader.hide();
      }
    });
  }

  saveAttendance() {
    this.loader.show();
    let completedCount = 0;
    const totalCount = this.attendanceList.length;

    if (totalCount === 0) {
      this.loader.hide();
      return;
    }

    this.attendanceList.forEach(item => {
      const payload = {
        h_id: item.h_id,
        user_id: item.user_id,
        user_name: item.user_name,
        user_day: item.user_day,
        date: this.selectedDate
      };

      const request$ = item.exists
        ? this.http.put(`${this.api.baseurl}Fab/Attendance`, payload)
        : this.http.post(`${this.api.baseurl}Fab/Attendance`, payload);

      request$.subscribe({
        next: () => {
          completedCount++;
          if (completedCount === totalCount) {
            this.toastr.success('Daily attendance submitted successfully!', 'Success');
            this.fetchDataForDate();
          }
        },
        error: (err) => {
          console.error(err);
          completedCount++;
          if (completedCount === totalCount) {
            this.toastr.warning('Attendance marked with some errors.', 'Warning');
            this.fetchDataForDate();
          }
        }
      });
    });
  }

  autoMarkOffDays() {
    if (confirm('This will mark "Off Day" for any helper who does not have an attendance entry today. Proceed?')) {
      this.loader.show();
      this.http.post(`${this.api.baseurl}Fab/Attendance/AutoMarkOff?date=${this.selectedDate}`, {}).subscribe({
        next: (res: any) => {
          this.toastr.success(`Auto-marked Off Day for ${res.count} helpers.`, 'Auto Mark Complete');
          this.fetchDataForDate();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Auto mark operation failed', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  fetchHistory() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/Attendance/Range?fromDate=${this.historyFrom}&toDate=${this.historyTo}`).subscribe({
      next: (res) => {
        const data = res || [];
        this.historyRecords = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load history', 'Error');
        this.loader.hide();
      }
    });
  }

  deleteAttendanceRecord(hId: number) {
    if (confirm('Are you sure you want to delete this specific attendance log?')) {
      this.loader.show();
      this.http.delete(`${this.api.baseurl}Fab/Attendance/${hId}`).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Attendance record deleted', 'Success');
            this.fetchHistory();
            this.fetchDataForDate();
          } else {
            this.toastr.error('Failed to delete attendance record', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error', 'Error');
          this.loader.hide();
        }
      });
    }
  }
}
