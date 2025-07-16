import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule],
  templateUrl: './doctor.component.html',
  styleUrl: './doctor.component.css',
})
export class DoctorComponent implements OnInit {
  data!: FormGroup;
  doctor: any;
  btn: string = '';
  DOCTOR_CODE: number = 0;
  ComId: number = 0;
  submitted: boolean = false;
  loadingDoctors = false;


  constructor(private api: ApiService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');
    this.initForm();
    this.getDoctors();
  }

  initForm() {
    this.data = new FormGroup({
      DOCTOR_NAME: new FormControl('', Validators.required),
      DOCTOR_ADDRESS: new FormControl(),
      DOCTOR_NUMBER: new FormControl(),
      COM_ID: new FormControl(this.ComId)
    });
  }

  getDoctors() {
    if (this.doctor == null) {
      this.loadingDoctors = true;
    }
    this.api.get('Doctor/Doctors').subscribe({
      next: (res: any) => {
        this.doctor = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load doctor list');
        console.error(err);
        this.doctor = [];
      },
      complete: () => {
        this.loadingDoctors = false;
      }
    });
  }


  clearData() {
    this.DOCTOR_CODE = 0;
    this.btn = '';
    this.data.reset();
    this.initForm(); // re-set COM_ID
  }

  submit(doctors: any) {
    this.submitted = true;
    this.data.patchValue({ COM_ID: this.ComId });

    if (this.DOCTOR_CODE == 0 && this.btn == '') {
      // Add Doctor
      this.api.post('Doctor/SaveDoctor', this.data.value).subscribe({
        next: () => {
          this.getDoctors();
          setTimeout(() => {
            this.toastr.success('Doctor added successfully');
            this.api.modalClose('doctorFormModal');
            this.getDoctors();

            this.initForm(); // this includes COM_ID
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add doctor');
          console.error(err);
        }
      });

    } else if (this.DOCTOR_CODE != 0 && this.btn == 'E') {
      // Edit Doctor
      this.api.post('Doctor/EditDoctor/' + this.DOCTOR_CODE, this.data.value).subscribe({
        next: () => {
          this.getDoctors();
          setTimeout(() => {
            this.toastr.success('Doctor updated successfully');
            this.getDoctors();
            this.data.reset();
            this.initForm();
            this.api.modalClose('doctorFormModal');
            this.clearData();
          }, 200);

        },
        error: (err) => {
          this.toastr.error('Failed to update doctor');
          console.error(err);
        }
      });

    } else if (this.DOCTOR_CODE != 0 && this.btn == 'D') {
      // Delete Doctor
      this.api.delete('Doctor/DeleteDoctor/' + this.DOCTOR_CODE).subscribe({
        next: () => {
          this.getDoctors();
          setTimeout(() => {
            this.toastr.success('Doctor deleted successfully');
            this.getDoctors();
            this.clearData();
            this.api.modalClose('doctorFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to delete doctor');
          console.error(err);
        }
      });

    }
  }

  getDataById(doctorCode: number, btn: string) {
    this.btn = btn;
    this.api.get('Doctor/Doctor/' + doctorCode).subscribe((res: any) => {
      this.DOCTOR_CODE = res.doctoR_CODE;
      this.data.patchValue({
        DOCTOR_NAME: res.doctoR_NAME,
        DOCTOR_ADDRESS: res.doctoR_ADDRESS,
        DOCTOR_NUMBER: res.doctoR_NUMBER
      });
    });
  }
}
