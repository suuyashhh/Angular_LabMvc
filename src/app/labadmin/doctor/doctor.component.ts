import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.data = new FormGroup({
      DOCTOR_NAME : new FormControl,
      DOCTOR_ADDRESS: new FormControl,
      DOCTOR_NUMBER : new FormControl
    });
    this.load();
  }
  load() {
    this.api.get('Doctor/Doctors').subscribe((res: any) => {
      this.doctor = res;
      console.log(this.doctor);
    });
  }
  submit(doctors:any){
      console.log(doctors);
      this.api.post('Doctor/SaveDoctor',doctors).subscribe((res:any)=>{
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
