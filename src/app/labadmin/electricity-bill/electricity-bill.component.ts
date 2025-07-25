import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ServicesService } from '../../shared/services.service';
import { FormattedDatePipe } from '../../shared/pipes/formatted-date.pipe';

@Component({
  selector: 'app-electricity-bill',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule, FormattedDatePipe],
  templateUrl: './electricity-bill.component.html',
  styleUrl: './electricity-bill.component.css'
})
export class ElectricityBillComponent implements OnInit {

  data!: FormGroup;
  elebill: any;
  ELC_TRN_ID: number = 0;
  ComId: number = 0;
  btn: string = '';
  submitted: boolean = false;
  loadingEleBills = false;
  Reason: string = '';

  constructor(private api: ApiService, private toastr: ToastrService, private service: ServicesService) { }

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem('COM_ID') || '0');
    this.initForm();
    this.getElecBills();
  }

  initForm() {
    
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];

    this.data = new FormGroup({
      DATE: new FormControl(formattedDate, Validators.required),
      ELC_PRICE: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      COM_ID: new FormControl()
    });
  }

  getElecBills() {
    this.loadingEleBills = true;
    this.api.get('ElectricityBill/ElectricityBills').subscribe({
      next: (res: any) => {
        this.elebill = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load electricity bills');
        console.error(err);
        this.elebill = [];
      },
      complete: () => this.loadingEleBills = false
    });
  }

  clearData() {
    this.ELC_TRN_ID = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }

  submit(bill: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    const rawDate = this.data.get('DATE')?.value;
    const parts = rawDate.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    bill.DATE = this.service.getFormattedDate(formatted, 1);

    if (this.ELC_TRN_ID == 0 && this.btn == '') {
      this.api.post('ElectricityBill/SaveElectricityBill', bill).subscribe({
        next: () => {
          this.getElecBills();
          setTimeout(() => {
            this.toastr.success('Electricity bill added successfully');
            this.api.modalClose('ElcBillFormModal');
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add bill');
          console.error(err);
        }
      });

    } else if (this.ELC_TRN_ID != 0 && this.btn == 'E') {
      this.api.post('ElectricityBill/EditElectricityBill/' + this.ELC_TRN_ID, bill).subscribe({
        next: () => {
          this.getElecBills();
          setTimeout(() => {
            this.toastr.success('Electricity bill updated successfully');
            this.api.modalClose('ElcBillFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update bill');
          console.error(err);
        }
      });

    } else if (this.ELC_TRN_ID != 0 && this.btn == 'D') {
      if (this.Reason.trim() !== '') {
        this.api.delete('ElectricityBill/DeleteElectricityBill/' + this.ELC_TRN_ID).subscribe({
          next: () => {
            this.getElecBills();
            setTimeout(() => {
              this.toastr.success('Electricity bill deleted successfully');
              this.api.modalClose('ElcBillFormModal');
              this.clearData();
              this.Reason = '';
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete bill');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning('Please fill in the reason before deleting.');
      }
    }
  }

  getDataById(elcCode: number, btn: string) {
    this.btn = btn;
    this.api.get('ElectricityBill/ElectricityBill/' + elcCode).subscribe((res: any) => {
      this.ELC_TRN_ID = res.elC_TRN_ID;
      this.data.patchValue({
        DATE: this.service.getFormattedDate(res.date, 8),
        ELC_PRICE: res.elC_PRICE
      });
    });
  }
}
