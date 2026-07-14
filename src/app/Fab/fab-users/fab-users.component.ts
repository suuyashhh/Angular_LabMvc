import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fab-users.component.html',
  styleUrls: ['./fab-users.component.css']
})
export class FabUsersComponent implements OnInit {
  helpers: any[] = [];
  helperObj: any = {
    user_id: null,
    user_name: '',
    user_contact: '',
    user_pass: '',
    user_salary: null
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
  }

  fetchHelpers() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/Helpers`).subscribe({
      next: (res) => {
        this.helpers = res || [];
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load helpers', 'Error');
        this.loader.hide();
      }
    });
  }

  onSubmit() {
    if (!this.helperObj.user_name || !this.helperObj.user_contact || !this.helperObj.user_pass || this.helperObj.user_salary == null) {
      this.toastr.warning('Please fill in all fields', 'Validation');
      return;
    }

    this.loader.show();
    if (this.isEditMode) {
      this.http.put(`${this.api.baseurl}Fab/Helper`, this.helperObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Helper details updated successfully!', 'Success');
            this.resetForm();
            this.fetchHelpers();
          } else {
            this.toastr.error('Failed to update helper details', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error occurred', 'Error');
          this.loader.hide();
        }
      });
    } else {
      this.http.post(`${this.api.baseurl}Fab/RegisterHelper`, this.helperObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Helper registered successfully!', 'Success');
            this.resetForm();
            this.fetchHelpers();
          } else {
            this.toastr.error('Failed to register helper', 'Error');
            this.loader.hide();
          }
        },
        error: (err: any) => {
          console.error(err);
          if (err.status === 499 || err.status === 409) {
            this.toastr.warning('Helper contact number is already registered!', 'Duplicate');
          } else {
            this.toastr.error('Server error occurred', 'Error');
          }
          this.loader.hide();
        }
      });
    }
  }

  editHelper(helper: any) {
    this.isEditMode = true;
    this.helperObj = {
      user_id: helper.user_id,
      user_name: helper.user_name,
      user_contact: helper.user_contact,
      user_pass: helper.user_pass,
      user_salary: helper.user_salary
    };
  }

  deleteHelper(userId: number) {
    if (confirm('Are you sure you want to delete this helper? All associated records will remain but their user profile will be removed.')) {
      this.loader.show();
      this.http.delete(`${this.api.baseurl}Fab/Helper/${userId}`).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Helper deleted successfully', 'Success');
            this.fetchHelpers();
          } else {
            this.toastr.error('Failed to delete helper', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error occurred', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  resetForm() {
    this.isEditMode = false;
    this.helperObj = {
      user_id: null,
      user_name: '',
      user_contact: '',
      user_pass: '',
      user_salary: null
    };
  }
}
