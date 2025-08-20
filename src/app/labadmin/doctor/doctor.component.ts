import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './doctor.component.html',
  styleUrls: ['./doctor.component.css']
})
export class DoctorComponent implements OnInit {
  data!: FormGroup;
  doctor: any;
  btn: string = '';
  DOCTOR_CODE: number = 0;
  ComId: number = 0;
  submitted: boolean = false;
  Reason: string = '';
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
      DOCTOR_ADDRESS: new FormControl('', Validators.required),
      DOCTOR_NUMBER: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
      COM_ID: new FormControl(this.ComId)
    });
  }

  getDoctors() {
    this.loadingDoctors = true;
    this.api.get('Doctor/Doctors').subscribe({
      next: (res: any) => this.doctor = res,
      error: (err) => {
        this.toastr.error('Failed to load doctor list');
        console.error(err);
        this.doctor = [];
      },
      complete: () => this.loadingDoctors = false
    });
  }

  clearData() {
    this.DOCTOR_CODE = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }

  searchTerm: string = '';
  page: number = 1;
  readonly pageSize: number = 10;

  submit(doctor: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    if (this.DOCTOR_CODE === 0 && this.btn === '') {
      // Add Doctor
      this.api.post('Doctor/SaveDoctor', doctor).subscribe({
        next: () => {
          this.getDoctors();
          setTimeout(() => {
            this.toastr.success('Doctor added successfully');
            this.api.modalClose('doctorFormModal');
            this.getDoctors();
            this.initForm();
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add doctor');
          console.error(err);
        }
      });

    } else if (this.DOCTOR_CODE !== 0 && this.btn === 'E') {
      // Edit Doctor
      this.api.post('Doctor/EditDoctor/' + this.DOCTOR_CODE, doctor).subscribe({
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

    } else if (this.DOCTOR_CODE !== 0 && this.btn === 'D') {
      // Delete Doctor
      if (this.Reason !== '') {
        this.api.delete('Doctor/DeleteDoctor/' + this.DOCTOR_CODE).subscribe({
          next: () => {
            this.getDoctors();
            setTimeout(() => {
              this.toastr.success('Doctor deleted successfully');
              this.getDoctors();
              this.api.modalClose('doctorFormModal');
              this.clearData();
              this.Reason = "";
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete doctor');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning("Please provide a reason for deletion.");
      }
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


  filteredDoctors(): any[] {
    let result = this.doctor || [];

    // Apply search filter if searchTerm exists
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      result = result.filter((doctor: any) =>
        doctor.doctoR_NAME?.toLowerCase().includes(searchTermLower)
      );
    }

    // Reset to page 1 when search term changes
    if (this.searchTerm) {
      this.page = 1;
    }

    return result;
  }

  onSearch() {
    // Reset to first page when searching
    this.page = 1;
  }

}
