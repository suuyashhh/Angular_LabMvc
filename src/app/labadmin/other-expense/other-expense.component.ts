import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormattedDatePipe } from '../../shared/pipes/formatted-date.pipe';
import { ServicesService } from '../../shared/services.service';

@Component({
  selector: 'app-other-expense',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormattedDatePipe, FormsModule],
  templateUrl: './other-expense.component.html',
  styleUrl: './other-expense.component.css'
})
export class OtherExpenseComponent implements OnInit {
  data!: FormGroup;
  otherexpense: any;
  OTHER_ID: number = 0;
  ComId: number = 0;
  btn: string = '';
  submitted: boolean = false;
  loadingExpenses = false;
  Reason: string = '';

  constructor(private api: ApiService, private toastr: ToastrService, private service:ServicesService) {}

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem('COM_ID') || '0');
    this.initForm();
    this.getExpenses();
  }

  initForm() {
    this.data = new FormGroup({
      DATE: new FormControl('', Validators.required),
      OTHER_NAME: new FormControl('', Validators.required),
      OTHER_PRICE: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      COM_ID: new FormControl(this.ComId)
    });
  }

  getExpenses() {
    this.loadingExpenses = true;
    this.api.get('OtherExpense/OtherExpenses').subscribe({
      next: (res: any) => {
        this.otherexpense = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load expenses list');
        console.error(err);
        this.otherexpense = [];
      },
      complete: () => this.loadingExpenses = false
    });
  }

  clearData() {
    this.OTHER_ID = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }

  submit(expense: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    const rawDate = this.data.get('DATE')?.value;
    const parts = rawDate.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    expense.DATE = this.service.getFormattedDate(formatted, 1);

    if (this.OTHER_ID == 0 && this.btn == '') {
      this.api.post('OtherExpense/SaveOtherExpense', expense).subscribe({
        next: () => {
          this.getExpenses();
          setTimeout(() => {
            this.toastr.success('Expense added successfully');
            this.api.modalClose('OEFormModal');
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add expense');
          console.error(err);
        }
      });

    } else if (this.OTHER_ID != 0 && this.btn == 'E') {
      this.api.post('OtherExpense/EditOtherExpense/' + this.OTHER_ID, expense).subscribe({
        next: () => {
          this.getExpenses();
          setTimeout(() => {
            this.toastr.success('Expense updated successfully');
            this.api.modalClose('OEFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update expense');
          console.error(err);
        }
      });

    } else if (this.OTHER_ID != 0 && this.btn == 'D') {
      if (this.Reason.trim() !== '') {
        this.api.delete('OtherExpense/DeleteOtherExpense/' + this.OTHER_ID).subscribe({
          next: () => {
            this.getExpenses();
            setTimeout(() => {
              this.toastr.success('Expense deleted successfully');
              this.api.modalClose('OEFormModal');
              this.clearData();
              this.Reason = "";
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete expense');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning('Please fill in the reason before deleting.');
      }
    }
  }

  getDataById(OECode: number, btn: string) {
    this.btn = btn;
    this.api.get('OtherExpense/OtherExpense/' + OECode).subscribe((res: any) => {
      this.OTHER_ID = res.otheR_ID;
      this.data.patchValue({
        DATE: this.service.getFormattedDate(res.date, 8),
        OTHER_NAME: res.otheR_NAME,
        OTHER_PRICE: res.otheR_PRICE
      });
    });
  }
}
