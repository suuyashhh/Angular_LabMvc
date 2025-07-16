import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-electricity-bill',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './electricity-bill.component.html',
  styleUrl: './electricity-bill.component.css'
})
export class ElectricityBillComponent {

  elebill:any;
  data: any;
  ELC_TRN_ID: any = 0;
  ComId: number = 0;
  btn: any = '';
  submitted = false;
  Reason: any = '';

  constructor(private api: ApiService) { }


  ngOnInit(): void {
    // this.clearData();
    this.load();
  }

  load() {
    this.data = new FormGroup({
      ELC_PRICE: new FormControl('', Validators.required),
    });

    this.api.get('ElectricityBill/ElectricityBills').subscribe((res: any) => {
      this.elebill = res;
      console.log(this.elebill)
    })

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

  clearData() {
    this.ELC_TRN_ID = 0;
    this.btn = '';
    this.data.patchValue({
      ELC_PRICE: ''
    })
  }

  submit(ElcBill: any) {
    this.submitted = false;
    if (!this.data.valid) {
      this.submitted = true;
      return;
    }
    if (this.ELC_TRN_ID == 0 && this.btn == '') {
      ElcBill.COM_ID = this.ComId
        this.api.post('ElectricityBill/SaveElectricityBill', ElcBill).subscribe((res: any) => {
          this.api.modalClose('ElcBillFormModal');
          this.load();
       });
    } else if (this.ELC_TRN_ID != 0 && this.btn == 'E') {
      console.log(this.ELC_TRN_ID);
      this.api.post('ElectricityBill/EditElectricityBill/' + this.ELC_TRN_ID, ElcBill).subscribe((res: any) => {
        this.load();
        console.log(res);

      });
    }
    else if (this.ELC_TRN_ID != 0 && this.btn == 'D') {
      console.log(this.Reason);

      if (this.Reason != '') {
        this.api.delete('ElectricityBill/DeleteElectricityBill/' + this.ELC_TRN_ID).subscribe((res: any) => {
          this.load();
        })
      }
      else {
        alert("Fill the reason");
      }
    }
  }

  getDataById(ElcCode: number, btn: any) {
    this.btn = btn;
    this.api.get('ElectricityBill/ElectricityBill/' + ElcCode).subscribe((res: any) => {
      console.log(res);

      this.ELC_TRN_ID = res.elC_TRN_ID;
      this.data.patchValue({
        ELC_PRICE: res.elC_PRICE
      })
    })
  }

}
