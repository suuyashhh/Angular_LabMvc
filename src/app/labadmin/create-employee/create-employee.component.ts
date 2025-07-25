import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule,FormsModule],
  templateUrl: './create-employee.component.html',
  styleUrl: './create-employee.component.css'
})
export class CreateEmployeeComponent implements OnInit {

  data!: FormGroup;
  employee: any;
  btn: string = '';
  EMP_ID: number = 0;
  ComId: number = 0;
  submitted: boolean = false;
  Reason: string = '';
  loadingEmployees = false;

  constructor(private api: ApiService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');
    this.initForm();
    this.getEmployees();
  }

  initForm() {
    this.data = new FormGroup({
      EMP_NAME: new FormControl('', Validators.required),
      EMP_PASSWORD: new FormControl('', Validators.required),
      EMP_CONTACT: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
      COM_ID: new FormControl(this.ComId)
    });
  }

  getEmployees() {
    this.loadingEmployees = true;
    this.api.get('Employee/Employees').subscribe({
      next: (res: any) => this.employee = res,
      error: (err) => {
        this.toastr.error('Failed to load employee list');
        console.error(err);
        this.employee = [];
      },
      complete: () => this.loadingEmployees = false
    });
  }

  clearData() {
    this.EMP_ID = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }

  submit(employee: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    if (this.EMP_ID === 0 && this.btn === '') {
      // Add Employee
      this.api.post('Employee/SaveEmployee', employee).subscribe({
        next: () => {
          this.getEmployees();
          setTimeout(() => {
            this.toastr.success('Employee added successfully');
            this.api.modalClose('CreateEmployeeFormModal');
            this.getEmployees();
            this.initForm();
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add employee');
          console.error(err);
        }
      });

    } else if (this.EMP_ID !== 0 && this.btn === 'E') {
      // Edit Employee
      this.api.post('Employee/EditEmployee/' + this.EMP_ID, employee).subscribe({
        next: () => {
          this.getEmployees();
          setTimeout(() => {
            this.toastr.success('Employee updated successfully');
            this.getEmployees();
            this.data.reset();
            this.initForm();
            this.api.modalClose('CreateEmployeeFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update employee');
          console.error(err);
        }
      });

    } else if (this.EMP_ID !== 0 && this.btn === 'D') {
      // Delete Employee
      if (this.Reason !== '') {
        this.api.delete('Employee/DeleteEmployee/' + this.EMP_ID).subscribe({
          next: () => {
            this.getEmployees();
            setTimeout(() => {
              this.toastr.success('Employee deleted successfully');
              this.getEmployees();
              this.api.modalClose('CreateEmployeeFormModal');
              this.clearData();
              this.Reason = "";
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete employee');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning("Please provide a reason for deletion.");
      }
    }
  }

  getDataById(empCode: number, btn: string) {
    this.btn = btn;
    this.api.get('Employee/Employee/' + empCode).subscribe((res: any) => {
      this.EMP_ID = res.emP_ID;
      this.data.patchValue({
        EMP_NAME: res.emP_NAME,
        EMP_PASSWORD: res.emP_PASSWORD,
        EMP_CONTACT: res.emP_CONTACT
      });
    });
  }

}
