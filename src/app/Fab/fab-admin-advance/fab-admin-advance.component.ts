import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-admin-advance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fab-admin-advance.component.html',
  styleUrls: ['./fab-admin-advance.component.css']
})
export class FabAdminAdvanceComponent implements OnInit {
  helpers: any[] = [];
  advances: any[] = [];
  
  advanceObj: any = {
    exp_id: null,
    user_id: null,
    exp_name: 'Advance Payment',
    exp_price: 0,
    user_advance: null,
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
    this.fetchHelpers();
    this.fetchAdvances();
  }

  fetchHelpers() {
    this.http.get<any[]>(`${this.api.baseurl}Fab/Helpers`).subscribe({
      next: (res) => {
        this.helpers = res || [];
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load helper list', 'Error');
      }
    });
  }

  fetchAdvances() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/Advances`).subscribe({
      next: (res) => {
        this.advances = res || [];
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load advances log', 'Error');
        this.loader.hide();
      }
    });
  }

  onSubmit() {
    if (!this.advanceObj.user_id || !this.advanceObj.user_advance || !this.advanceObj.date) {
      this.toastr.warning('Please fill in all fields', 'Validation');
      return;
    }

    this.loader.show();
    if (this.isEditMode) {
      this.http.put(`${this.api.baseurl}Fab/Expense`, this.advanceObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Advance payment record updated!', 'Success');
            this.resetForm();
            this.fetchAdvances();
          } else {
            this.toastr.error('Failed to update advance record', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error updating advance', 'Error');
          this.loader.hide();
        }
      });
    } else {
      this.http.post(`${this.api.baseurl}Fab/Expense`, this.advanceObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Advance payment logged successfully!', 'Success');
            this.resetForm();
            this.fetchAdvances();
          } else {
            this.toastr.error('Failed to log advance payment', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error logging advance', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  editAdvance(record: any) {
    this.isEditMode = true;
    this.advanceObj = {
      exp_id: record.exp_id,
      user_id: record.user_id,
      exp_name: record.exp_name || 'Advance Payment',
      exp_price: 0,
      user_advance: record.user_advance,
      date: new Date(record.date).toISOString().substring(0, 10)
    };
  }

  deleteAdvance(expId: number) {
    if (confirm('Are you sure you want to delete this advance payment log?')) {
      this.loader.show();
      this.http.delete(`${this.api.baseurl}Fab/Expense/${expId}`).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Advance record deleted', 'Success');
            this.fetchAdvances();
          } else {
            this.toastr.error('Failed to delete advance record', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error deleting advance record', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  resetForm() {
    this.isEditMode = false;
    this.advanceObj = {
      exp_id: null,
      user_id: null,
      exp_name: 'Advance Payment',
      exp_price: 0,
      user_advance: null,
      date: new Date().toISOString().substring(0, 10)
    };
  }
}
