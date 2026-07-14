import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-admin-transport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fab-admin-transport.component.html',
  styleUrls: ['./fab-admin-transport.component.css']
})
export class FabAdminTransportComponent implements OnInit {
  trips: any[] = [];
  
  // Date Range Search
  searchFrom: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  searchTo: string = new Date().toISOString().substring(0, 10);

  tripObj: any = {
    exp_id: null,
    user_id: 20203, // Hardcoded user_id representing driver/transportation
    exp_name: '',
    exp_price: null,
    user_advance: 0,
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
    this.fetchTrips();
  }

  fetchTrips() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/Transport/History?fromDate=${this.searchFrom}&toDate=${this.searchTo}`).subscribe({
      next: (res) => {
        this.trips = res || [];
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load transportation records', 'Error');
        this.loader.hide();
      }
    });
  }

  onSubmit() {
    if (!this.tripObj.exp_name || this.tripObj.exp_price == null || !this.tripObj.date) {
      this.toastr.warning('Please fill in all fields', 'Validation');
      return;
    }

    this.loader.show();
    if (this.isEditMode) {
      this.http.put(`${this.api.baseurl}Fab/Expense`, this.tripObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Transportation record updated!', 'Success');
            this.resetForm();
            this.fetchTrips();
          } else {
            this.toastr.error('Failed to update record', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error updating record', 'Error');
          this.loader.hide();
        }
      });
    } else {
      this.http.post(`${this.api.baseurl}Fab/Expense`, this.tripObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Transportation trip logged successfully!', 'Success');
            this.resetForm();
            this.fetchTrips();
          } else {
            this.toastr.error('Failed to record trip', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error recording trip', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  editTrip(record: any) {
    this.isEditMode = true;
    this.tripObj = {
      exp_id: record.exp_id,
      user_id: 20203,
      exp_name: record.exp_name,
      exp_price: record.exp_price,
      user_advance: 0,
      date: new Date(record.date).toISOString().substring(0, 10)
    };
  }

  deleteTrip(expId: number) {
    if (confirm('Are you sure you want to delete this transport trip log?')) {
      this.loader.show();
      this.http.delete(`${this.api.baseurl}Fab/Expense/${expId}`).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Transport record deleted', 'Success');
            this.fetchTrips();
          } else {
            this.toastr.error('Failed to delete transport record', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error deleting transport record', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  resetForm() {
    this.isEditMode = false;
    this.tripObj = {
      exp_id: null,
      user_id: 20203,
      exp_name: '',
      exp_price: null,
      user_advance: 0,
      date: new Date().toISOString().substring(0, 10)
    };
  }
}
