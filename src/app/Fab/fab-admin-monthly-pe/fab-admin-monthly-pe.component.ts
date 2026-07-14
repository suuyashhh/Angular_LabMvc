import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-fab-admin-monthly-pe',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fab-admin-monthly-pe.component.html',
  styleUrls: ['./fab-admin-monthly-pe.component.css']
})
export class FabAdminMonthlyPeComponent implements OnInit {
  records: any[] = [];

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchMonthlySummary();
  }

  fetchMonthlySummary() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/ProfitExpense/Monthly`).subscribe({
      next: (res) => {
        this.records = res || [];
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load monthly profit and expense summary', 'Error');
        this.loader.hide();
      }
    });
  }
}
