import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-other-expense',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './other-expense.component.html',
  styleUrl: './other-expense.component.css'
})
export class OtherExpenseComponent {
  otherexpense:any;
  data: any;
  OTHER_ID: any = 0;
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
      OTHER_NAME: new FormControl('', Validators.required),
      OTHER_PRICE: new FormControl('', Validators.required),
      COM_ID: new FormControl()
    });

    this.api.get('OtherExpense/OtherExpense').subscribe((res: any) => {
      this.otherexpense = res;
      console.log(this.otherexpense)
    })

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

  clearData() {
    this.OTHER_ID = 0;
    this.btn = '';
    this.data.patchValue({
      OTHER_NAME: '',
      OTHER_PRICE: '',
    })
  }

  submit(OtherEx: any) {
    this.submitted = false;
    if (!this.data.valid) {
      this.submitted = true;
      return;
    }
    if (this.OTHER_ID == 0 && this.btn == '') {
      OtherEx.COM_ID = this.ComId
        this.api.post('OtherExpense/SaveOtherExpense', OtherEx).subscribe((res: any) => {
          this.api.modalClose();
          this.load();
       }); 
    } else if (this.OTHER_ID != 0 && this.btn == 'E') {
      console.log(this.OTHER_ID);
      this.api.post('OtherExpense/EditOtherExpense/' + this.OTHER_ID, OtherEx).subscribe((res: any) => {
        this.load();
        console.log(res);
        
      });
    }
    else if (this.OTHER_ID != 0 && this.btn == 'D') {
      console.log(this.Reason);

      if (this.Reason != '') {
        this.api.delete('OtherExpense/DeleteOtherExpense/' + this.OTHER_ID).subscribe((res: any) => {
          this.load();
        })
      }
      else {
        alert("Fill the reason");
      }
    }
  }

  getDataById(OECode: number, btn: any) {
    this.btn = btn;
    this.api.get('OtherExpense/OtherExpense/' + OECode).subscribe((res: any) => {
      console.log(res);

      this.OTHER_ID = res.otheR_ID;
      this.data.patchValue({
        OTHER_NAME: res.otheR_NAME,
        OTHER_PRICE: res.otheR_PRICE,
      })
    })
  }
}
