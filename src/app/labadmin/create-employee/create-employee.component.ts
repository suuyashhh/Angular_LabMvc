import { Component, OnInit } from '@angular/core';
import { FooterComponent } from "../../shared/footer/footer.component";
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';

@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,HttpClientModule],
  templateUrl: './create-employee.component.html',
  styleUrl: './create-employee.component.css'
})
export class CreateEmployeeComponent implements OnInit {
  
  data:any;
  employee:any;
  btn :any = '';  
  EMP_ID: any = 0;
  ComId: number = 0;
  submitted = false;
  Reason: any = '';

  constructor(private api:ApiService){}

   ngOnInit(): void {
    this.load();
  }

  load() {
      this.data = new FormGroup({
        EMP_NAME: new FormControl('', Validators.required),        
        EMP_PASSWORD: new FormControl('', Validators.required),
        EMP_CONTACT: new FormControl('', Validators.required),
        COM_ID: new FormControl()
      });
  this.api.get('Employee/Employees').subscribe((res: any) => {
      this.employee = res;
      console.log(this.employee)
    })

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

   clearData() {
    this.EMP_ID = 0;
    this.btn = '';
    this.data.patchValue({
      EMP_NAME: '',
      EMP_PASSWORD: '',
      EMP_CONTACT: ''
    })
  }

  
  submit(employee: any) {
    this.submitted = false;
    if (!this.data.valid) {
      this.submitted = true;
      return;
    }
    if (this.EMP_ID == 0 && this.btn == '') {
      employee.COM_ID = this.ComId
        this.api.post('Employee/SaveEmployee', employee).subscribe((res: any) => {
          this.api.modalClose();
          this.load();
       }); 
    } else if (this.EMP_ID != 0 && this.btn == 'E') {
      console.log(this.EMP_ID);
      this.api.post('Employee/EditEmployee/' + this.EMP_ID, employee).subscribe((res: any) => {
        this.load();
        console.log(res);
        
      });
    }
    else if (this.EMP_ID != 0 && this.btn == 'D') {
      console.log(this.Reason);

      if (this.Reason != '') {
        this.api.delete('Employee/DeleteEmployee/' + this.EMP_ID).subscribe((res: any) => {
          this.load();
        })
      }
      else {
        alert("Fill the reason");
      }
    }
  }

  getDataById(empCode: number, btn: any) {
    this.btn = btn;
    this.api.get('Employee/Employee/' + empCode).subscribe((res: any) => {
      console.log(res);

      this.EMP_ID = res.emP_ID;
      this.data.patchValue({
        EMP_NAME: res.emP_NAME,
        EMP_PASSWORD: res.emP_PASSWORD,
        EMP_CONTACT: res.emP_CONTACT
      })
    })
  }

}
