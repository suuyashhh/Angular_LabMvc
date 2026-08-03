import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-fab-admin-date-pe',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fab-admin-date-pe.component.html',
  styleUrls: ['./fab-admin-date-pe.component.css']
})
export class FabAdminDatePeComponent implements OnInit {
  fromDate: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  toDate: string = new Date().toISOString().substring(0, 10);
  summary: any = null;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchSummary();
  }

  fetchSummary() {
    if (!this.fromDate || !this.toDate) {
      this.toastr.warning('Please select start and end dates', 'Validation');
      return;
    }

    this.loader.show();
    this.http.get<any>(`${this.api.baseurl}Fab/ProfitExpense/Range?fromDate=${this.fromDate}&toDate=${this.toDate}`).subscribe({
      next: (res) => {
        this.summary = res || { totalBill: 0, totalExpense: 0, profit: 0 };
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load custom date range summary', 'Error');
        this.loader.hide();
      }
    });
  }
}
