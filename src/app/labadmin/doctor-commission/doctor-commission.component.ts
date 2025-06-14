import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-doctor-commission',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './doctor-commission.component.html',
  styleUrl: './doctor-commission.component.css'
})
export class DoctorCommissionComponent {
doctorcommission:any;
    data:any;
  
    constructor(private api:ApiService){}
    ngOnInit(): void {
      this.data = new FormGroup({
        DOCTOR_ID: new FormControl(),
        DOC_COM_PRICE : new FormControl(),
        DATE: new FormControl()
      });
      this.load();
    }
  
    load(){
      this.api.get('DoctorCommission/DoctorCommission').subscribe((res:any)=>{
        this.doctorcommission=res;
        console.log(this.doctorcommission)
      })
  
    }
  
    submit(doctorcommission:any){
      console.log(doctorcommission);
      this.api.post('DoctorCommission/SaveDoctorCommission',doctorcommission).subscribe((res:any)=>{
        console.log(res);
        this.load();
  
        const modalElement = document.getElementById('myModal');
      if(modalElement){
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
      
      })
    }
}
