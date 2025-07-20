import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { ServicesService } from '../../shared/services.service';
import { FormattedDatePipe } from '../../shared/pipes/formatted-date.pipe';

@Component({
  selector: 'app-employee-salary',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule,FormattedDatePipe],
  templateUrl: './employee-salary.component.html',
  styleUrl: './employee-salary.component.css'
})
export class EmployeeSalaryComponent implements OnInit {
  employeesalary: any;
  data!: FormGroup;
  employee: any;
  EMP_TRN_ID: number = 0;
  ComId: number = 0;
  btn: string = '';
  submitted: boolean = false;
  Reason: string = '';
  loadingSalary = false;

  constructor(private api: ApiService, private toastr: ToastrService, private service: ServicesService) {}

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');
    this.initForm();
    this.load();
  }

  initForm() {
    this.data = new FormGroup({
      EMP_ID: new FormControl('',Validators.required),
      EMP_PRICE: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      DATE: new FormControl('', Validators.required),
      COM_ID: new FormControl()
    });
  }

  load() {
    this.loadingSalary = true;
    this.api.get('EmployeeSalary/EmployeeSalarys').subscribe({
      next: (res: any) => {
        this.employeesalary = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load salary list');
        console.error(err);
        this.employeesalary = [];
      },
      complete: () => this.loadingSalary = false
    });

    this.api.get('Employee/Employees').subscribe((res: any) => {
      this.employee = res;
    });
  }

  clearData() {
    this.EMP_TRN_ID = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }

  submit(employeesalary: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    const rawDate = this.data.get('DATE')?.value;
    const parts = rawDate.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    employeesalary.DATE = this.service.getFormattedDate(formatted, 1);

    if (this.EMP_TRN_ID == 0 && this.btn == '') {
      employeesalary.COM_ID = this.ComId;
      this.api.post('EmployeeSalary/SaveEmployeeSalary', employeesalary).subscribe({
        next: () => {
          this.load();
          setTimeout(() => {
            this.toastr.success('Salary added successfully');
            this.api.modalClose('EmpSalFormModal');
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add salary');
          console.error(err);
        }
      });

    } else if (this.EMP_TRN_ID != 0 && this.btn == 'E') {
      this.api.post('EmployeeSalary/EditEmployeeSalary/' + this.EMP_TRN_ID, employeesalary).subscribe({
        next: () => {
          this.load();
          setTimeout(() => {
            this.toastr.success('Salary updated successfully');
            this.api.modalClose('EmpSalFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update salary');
          console.error(err);
        }
      });

    } else if (this.EMP_TRN_ID != 0 && this.btn == 'D') {
      if (this.Reason.trim() !== '') {
        this.api.delete('EmployeeSalary/DeleteEmployeeSalary/' + this.EMP_TRN_ID).subscribe({
          next: () => {
            this.load();
            setTimeout(() => {
              this.toastr.success('Salary deleted successfully');
              this.api.modalClose('EmpSalFormModal');
              this.clearData();
              this.Reason = "";
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete salary');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning('Please fill in the reason before deleting.');
      }
    }
  }

  getDataById(EmpSalCode: number, btn: string) {
    this.btn = btn;
    this.api.get('EmployeeSalary/EmployeeSalary/' + EmpSalCode).subscribe((res: any) => {
      this.EMP_TRN_ID = res.emP_TRN_ID;
      this.data.patchValue({
        EMP_ID: res.emP_ID,
        EMP_PRICE: res.emP_PRICE,
        DATE: this.service.getFormattedDate(res.date, 8)
      });
    });
  }

  getEmployeeName(id: number): string {
  const emp = this.employee.find((e:any) => e.emP_ID == id);
  return emp ? emp.emP_NAME : 'Unknown';
}
}
