import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-fab-admin-salary-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fab-admin-salary-history.component.html',
  styleUrls: ['./fab-admin-salary-history.component.css']
})
export class FabAdminSalaryHistoryComponent implements OnInit {
  user: any = null;
  isAdmin = false;
  slips: any[] = [];
  
  // Date Range Search (for Admin)
  searchFrom: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  searchTo: string = new Date().toISOString().substring(0, 10);

  // Selected Slip for Details modal
  selectedSlip: any = null;
  showModal = false;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.user = this.auth.getFabCredentialsFromCookie();
    if (!this.user) return;
    this.isAdmin = this.user.type === 'Admin';
    this.fetchSalarySlips();
  }

  fetchSalarySlips() {
    this.loader.show();
    if (this.isAdmin) {
      // Load all slips or filter by range
      this.http.get<any[]>(`${this.api.baseurl}Fab/SalarySlips/Range?fromDate=${this.searchFrom}&toDate=${this.searchTo}`).subscribe({
        next: (res) => {
          this.slips = res || [];
          this.loader.hide();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to load salary slips history', 'Error');
          this.loader.hide();
        }
      });
    } else {
      // Helper: Load personal history only
      this.http.get<any[]>(`${this.api.baseurl}Fab/Helper/${this.user.user_id}/SalarySlips`).subscribe({
        next: (res) => {
          this.slips = res || [];
          this.loader.hide();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to load your salary slips', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  openSlipDetails(slip: any) {
    this.selectedSlip = slip;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedSlip = null;
  }

  printPayslip() {
    window.print();
  }
}
