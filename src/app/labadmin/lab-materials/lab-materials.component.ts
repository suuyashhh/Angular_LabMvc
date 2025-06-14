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
  
  
    materials:any;
    data:any;
  
    constructor(private api:ApiService){}
    ngOnInit(): void {
      this.data = new FormGroup({
        MAT_ID : new FormControl(),
        MAT_NAME: new FormControl('',Validators.compose([Validators.required])),
        MAT_PRICE : new FormControl(),
        DATE: new FormControl()
      });
      this.load();
    }
  
  
  
    load(){
      this.api.get('LabMaterials/LabMaterials').subscribe((res:any)=>{
        this.materials=res;
        console.log(this.materials)
      })
  
    }
  
    submit(materials:any){
      console.log(materials);
      this.api.post('LabMaterials/SaveLabMaterials',materials).subscribe((res:any)=>{
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
