import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-admin-expense',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fab-admin-expense.component.html',
  styleUrls: ['./fab-admin-expense.component.css']
})
export class FabAdminExpenseComponent implements OnInit {
  expenses: any[] = [];
  
  // Date Range Search
  searchFrom: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  searchTo: string = new Date().toISOString().substring(0, 10);

  expenseObj: any = {
    exp_id: null,
    user_id: null, // Always null for general workshop expense
    exp_name: '',
    exp_price: null,
    user_advance: 0,
    date: new Date().toISOString().substring(0, 10)
  };
  isEditMode = false;
  isDrawerOpen = false;
  isDeleteModalOpen = false;
  deleteItemId: number | null = null;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchExpenses();
  }

  openAddDrawer() {
    this.isEditMode = false;
    this.resetForm();
    this.isDrawerOpen = true;
  }

  openEditDrawer(record: any) {
    this.isEditMode = true;
    this.expenseObj = {
      exp_id: record.exp_id,
      user_id: null,
      exp_name: record.exp_name,
      exp_price: record.exp_price,
      user_advance: 0,
      date: record.date ? record.date.split('T')[0] : ''
    };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  fetchExpenses() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/Expenses/Range?fromDate=${this.searchFrom}&toDate=${this.searchTo}&onlyGeneral=true`).subscribe({
      next: (res) => {
        const data = res || [];
        this.expenses = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load expenses', 'Error');
        this.loader.hide();
      }
    });
  }

  onSubmit() {
    if (!this.expenseObj.exp_name || this.expenseObj.exp_price == null || !this.expenseObj.date) {
      this.toastr.warning('Please fill in all fields', 'Validation');
      return;
    }

    this.loader.show();
    if (this.isEditMode) {
      this.http.put(`${this.api.baseurl}Fab/Expense`, this.expenseObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Expense updated successfully!', 'Success');
            this.resetForm();
            this.closeDrawer();
            this.fetchExpenses();
          } else {
            this.toastr.error('Failed to update expense', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error updating expense', 'Error');
          this.loader.hide();
        }
      });
    } else {
      this.http.post(`${this.api.baseurl}Fab/Expense`, this.expenseObj).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Expense recorded successfully!', 'Success');
            this.resetForm();
            this.closeDrawer();
            this.fetchExpenses();
          } else {
            this.toastr.error('Failed to record expense', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Server error recording expense', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  editExpense(record: any) {
    this.openEditDrawer(record);
  }

  deleteExpense(expId: number) {
    this.deleteItemId = expId;
    this.isDeleteModalOpen = true;
  }

  confirmDeleteAction() {
    if (this.deleteItemId !== null) {
      this.loader.show();
      this.http.delete(`${this.api.baseurl}Fab/Expense/${this.deleteItemId}`).subscribe({
        next: (res: any) => {
          this.closeDeleteModal();
          if (res.success) {
            this.toastr.success('Expense deleted successfully', 'Success');
            this.fetchExpenses();
          } else {
            this.toastr.error('Failed to delete expense record', 'Error');
            this.loader.hide();
          }
        },
        error: (err) => {
          this.closeDeleteModal();
          console.error(err);
          this.toastr.error('Server error deleting expense record', 'Error');
          this.loader.hide();
        }
      });
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.deleteItemId = null;
  }

  resetForm() {
    this.isEditMode = false;
    this.expenseObj = {
      exp_id: null,
      user_id: null,
      exp_name: '',
      exp_price: null,
      user_advance: 0,
      date: new Date().toISOString().substring(0, 10)
    };
  }
}
