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

  constructor(private api: ApiService) { }
  ngOnInit(): void {
    this.data = new FormGroup({
      EMP_TRN_ID: new FormControl(),
      EMP_PRICE: new FormControl(),
      DATE: new FormControl()
    });
    this.load();
  }


  load() {
    this.api.get('EmployeeSalary/EmployeeSalary').subscribe((res: any) => {
      this.employeesalary = res;
      console.log(this.employeesalary)
    });
    this.api.get('Employee/Employees').subscribe((res: any) => {
      this.employee = res;
      console.log(this.employee);
    });

  }

  submit(employeesalary: any) {
    console.log(employeesalary);
    this.api.post('EmployeeSalary/SaveEmployeeSalary', employeesalary).subscribe((res: any) => {
      console.log(res);
      this.load();

      const modalElement = document.getElementById('myModal');
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }

    })
  }
}
