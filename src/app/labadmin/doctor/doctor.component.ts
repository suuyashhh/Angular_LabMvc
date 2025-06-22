import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule,Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule],
  templateUrl: './doctor.component.html',
  styleUrl: './doctor.component.css',
})
export class DoctorComponent implements OnInit {
  data: any;
  doctor: any;
  btn: any = '';
  DOCTOR_CODE: any = 0;
  ComId: number = 0;
  submitted = false;

  constructor(private api: ApiService) { }

  // ngOnInit(): void {
  //   this.data = new FormGroup({
  //     DOCTOR_NAME : new FormControl,
  //     DOCTOR_ADDRESS: new FormControl,
  //     DOCTOR_NUMBER : new FormControl
  //   });
  //   this.load();
  // }

  ngOnInit(): void {
    this.load();

  }

  load() {
    this.data = new FormGroup({
      DOCTOR_NAME: new FormControl('', Validators.compose([Validators.required])),
      DOCTOR_ADDRESS: new FormControl(),
      DOCTOR_NUMBER: new FormControl(),
      COM_ID: new FormControl()
    });

    this.api.get('Doctor/Doctor').subscribe((res: any) => {
      this.doctor = res;
      console.log(this.doctor);
    });

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

  clearData() {
    this.DOCTOR_CODE = 0;
    this.btn = '';
    this.data.patchValue({
      DOCTOR_NAME: '',
      DOCTOR_ADDRESS: '',
      DOCTOR_NUMBER: ''
    })
  }

  submit(doctors: any) {
     this.submitted = true;
    
    if(this.DOCTOR_CODE == 0 && this.btn == ''){
      doctors.COM_ID = this.ComId
    this.api.post('Doctor/SaveDoctor', doctors).subscribe((res: any) => {
      this.load();

      // const modalElement = document.getElementById('myModal');
      // if (modalElement) {
      //   const modal = Modal.getInstance(modalElement);
      //   modal?.hide();
      // }

    });
  }else if(this.DOCTOR_CODE != 0 && this.btn == 'E'){
       this.api.post('Doctor/EditDoctor/'+ this.DOCTOR_CODE,doctors).subscribe((res: any) => {
         this.load();
      });
    }
    else if(this.DOCTOR_CODE != 0 && this.btn == 'D'){
      this.api.delete('Doctor/DeleteDoctor/' + this.DOCTOR_CODE).subscribe((res: any) => {
       this.load();
      })
    }
  }

  getDataById(doctorCode: number, btn: any) {
    // alert('Hii');
    this.btn = btn;
    this.api.get('Doctor/Doctor/' + doctorCode).subscribe((res: any) => {
      console.log(res);

      this.DOCTOR_CODE = res.doctoR_CODE;
      this.data.patchValue({
        DOCTOR_NAME: res.doctoR_NAME,
        DOCTOR_ADDRESS: res.doctoR_ADDRESS,
        DOCTOR_NUMBER: res.doctoR_NUMBER
      })
    })
  }

}
