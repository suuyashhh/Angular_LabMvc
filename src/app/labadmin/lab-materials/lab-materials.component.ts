import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-lab-materials',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './lab-materials.component.html',
  styleUrl: './lab-materials.component.css'
})
export class LabMaterialsComponent implements OnInit {
  
  
    tests:any;
    data:any;
  
    constructor(private api:ApiService){}
    ngOnInit(): void {
      this.data = new FormGroup({
        TEST_NAME: new FormControl('',Validators.compose([Validators.required])),
        PRICE : new FormControl(),
        LAB_PRICE: new FormControl()
      });
      this.load();
    }
  
  
  
    load(){
      this.api.get('Test/Test').subscribe((res:any)=>{
        this.tests=res;
        console.log(this.tests)
      })
  
    }
  
    submit(test:any){
      console.log(test);
      this.api.post('Test/SaveTest',test).subscribe((res:any)=>{
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
