import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-employee-salary',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './employee-salary.component.html',
  styleUrl: './employee-salary.component.css'
})
export class EmployeeSalaryComponent {
  employeesalary: any;
  data: any;
  employee: any;
  EMP_TRN_ID : any =0;
  ComId: number = 0;
  btn: any = '';
  submitted = false;
  Reason: any = '';


  constructor(private api: ApiService) { }
  ngOnInit(): void {
    // this.data = new FormGroup({
    //   EMP_TRN_ID: new FormControl(),
    //   EMP_PRICE: new FormControl(),
    //   DATE: new FormControl()
    // });
    this.load();
  }


  load() {

  this.data = new FormGroup({
      EMP_ID: new FormControl(),
      EMP_PRICE: new FormControl(),
      DATE: new FormControl(),
      COM_ID: new FormControl()
    });

    this.api.get('EmployeeSalary/EmployeeSalarys').subscribe((res: any) => {
      this.employeesalary = res;
      console.log(this.employeesalary)
    });
    this.api.get('Employee/Employees').subscribe((res: any) => {
      this.employee = res;
      console.log(this.employee);
    });

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

    clearData() {
    this.EMP_TRN_ID = 0;
    this.btn = '';
    this.data.patchValue({
      EMP_ID: '',
      EMP_PRICE: ''
    })
  }

   submit(employeesalary: any) {
    this.submitted = false;
    if (!this.data.valid) {
      this.submitted = true;
      return;
    }
    if (this.EMP_TRN_ID == 0 && this.btn == '') {
      employeesalary.COM_ID = this.ComId
        this.api.post('EmployeeSalary/SaveEmployeeSalary', employeesalary).subscribe((res: any) => {
          this.api.modalClose('EmpSalFormModal');
          this.load();
       });
    } else if (this.EMP_TRN_ID != 0 && this.btn == 'E') {
      console.log(this.EMP_TRN_ID);
      this.api.post('EmployeeSalary/EditEmployeeSalary/' + this.EMP_TRN_ID, employeesalary).subscribe((res: any) => {
        this.load();
        console.log(res);

      });
    }
    else if (this.EMP_TRN_ID != 0 && this.btn == 'D') {
      console.log(this.Reason);

      if (this.Reason != '') {
        this.api.delete('EmployeeSalary/DeleteEmployeeSalary/' + this.EMP_TRN_ID).subscribe((res: any) => {
          this.load();
        })
      }
      else {
        alert("Fill the reason");
      }
    }
  }

   getDataById(EmpSalCode: number, btn: any) {
    this.btn = btn;
    this.api.get('EmployeeSalary/EmployeeSalary/' + EmpSalCode).subscribe((res: any) => {
      console.log(res);

      this.EMP_TRN_ID = res.emP_TRN_ID;
      this.data.patchValue({
        EMP_ID: res.emP_ID,
        EMP_PRICE: res.emP_PRICE,
      })
    })
  }

}
