import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-doctor-commission',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './doctor-commission.component.html',
  styleUrl: './doctor-commission.component.css'
})
export class DoctorCommissionComponent {
  doctorcommission: any;
  data: any;
  doctor: any;
  tests: any;
  DOC_COM_ID: any = 0;
  ComId: number = 0;
  btn: any = '';
  submitted = false;
  Reason: any = '';

  constructor(private api: ApiService) { }
  ngOnInit(): void {
    this.load();
  }

  load() {

    this.data = new FormGroup({
      DOCTOR_ID: new FormControl(),
      DOC_COM_PRICE: new FormControl(),
      DATE: new FormControl(),
      COM_ID: new FormControl()
    });

    this.api.get('DoctorCommission/DoctorCommissions').subscribe((res: any) => {
      this.doctorcommission = res;
      console.log(this.doctorcommission)
    });

    this.api.get('Doctor/Doctor').subscribe((res: any) => {
      this.doctor = res;
      console.log(this.doctor);
    });

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

  clearData() {
    this.DOC_COM_ID = 0;
    this.btn = '';
    this.data.patchValue({
      DOCTOR_ID: '',
      DOC_COM_PRICE: '',
    })
  }

  submit(DocCom: any) {
    this.submitted = false;
    if (!this.data.valid) {
      this.submitted = true;
      return;
    }
    if (this.DOC_COM_ID == 0 && this.btn == '') {
      DocCom.COM_ID = this.ComId
        this.api.post('DoctorCommission/SaveDoctorCommission', DocCom).subscribe((res: any) => {
          this.api.modalClose('doctorComFormModal');
          this.load();
       });
    } else if (this.DOC_COM_ID != 0 && this.btn == 'E') {
      console.log(this.DOC_COM_ID);
      this.api.post('DoctorCommission/EditDoctorCommission/' + this.DOC_COM_ID, DocCom).subscribe((res: any) => {
        this.load();
        console.log(res);

      });
    }
    else if (this.DOC_COM_ID != 0 && this.btn == 'D') {
      console.log(this.Reason);

      if (this.Reason != '') {
        this.api.delete('DoctorCommission/DeleteDoctorCommission/' + this.DOC_COM_ID).subscribe((res: any) => {
          this.load();
        })
      }
      else {
        alert("Fill the reason");
      }
    }
  }

   getDataById(DocComCode: number, btn: any) {
    this.btn = btn;
    this.api.get('DoctorCommission/DoctorCommission/' + DocComCode).subscribe((res: any) => {
      console.log(res);

      this.DOC_COM_ID = res.doC_COM_ID;
      this.data.patchValue({
        DOCTOR_ID: res.doctoR_ID,
        DOC_COM_PRICE: res.doC_COM_PRICE,
      })
    })
  }

}
