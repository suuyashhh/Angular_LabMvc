import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-admin-profit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fab-admin-profit.component.html',
  styleUrls: ['./fab-admin-profit.component.css']
})
export class FabAdminProfitComponent implements OnInit {
  profits: any[] = [];
  
  // Date Range Search
  searchFrom: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  searchTo: string = new Date().toISOString().substring(0, 10);

  profitObj: any = {
    pro_id: null,
    pro_name: '',
    pro_price: null,
    date: new Date().toISOString().substring(0, 10)
  };
  isEditMode = false;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchProfits();
  }

  fetchProfits() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/Profits/Range?fromDate=${this.searchFrom}&toDate=${this.searchTo}`).subscribe({
      next: (res) => {
        this.profits = res || [];
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load billing profit logs', 'Error');
        this.loader.hide();
      }
    });
  }

  onSubmit() {
    if (!this.profitObj.pro_name || this.profitObj.pro_price == null || !this.profitObj.date) {
      this.toastr.warning('Please fill in all fields', 'Validation');
      return;
    }

    this.loader.show();
    if (this.isEditMode) {
      this.http.put(`${this.api.baseurl}Fab/Profit`, this.profitObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Billing record updated successfully!', 'Success');
            this.resetForm();
            this.fetchProfits();
          } else {
            this.toastr.error('Failed to update billing record', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error updating billing record', 'Error');
          this.loader.hide();
        }
      });
    } else {
      this.http.post(`${this.api.baseurl}Fab/Profit`, this.profitObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Billing record logged successfully!', 'Success');
            this.resetForm();
            this.fetchProfits();
          } else {
            this.toastr.error('Failed to record bill', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error recording bill', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  editProfit(record: any) {
    this.isEditMode = true;
    this.profitObj = {
      pro_id: record.pro_id,
      pro_name: record.pro_name,
      pro_price: record.pro_price,
      date: new Date(record.date).toISOString().substring(0, 10)
    };
  }

  deleteProfit(profitId: number) {
    if (confirm('Are you sure you want to delete this billing profit log?')) {
      this.loader.show();
      this.http.delete(`${this.api.baseurl}Fab/Profit/${profitId}`).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Billing record deleted', 'Success');
            this.fetchProfits();
          } else {
            this.toastr.error('Failed to delete billing record', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error deleting record', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  resetForm() {
    this.isEditMode = false;
    this.profitObj = {
      pro_id: null,
      pro_name: '',
      pro_price: null,
      date: new Date().toISOString().substring(0, 10)
    };
  }
}
