import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-bike-fule',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './bike-fule.component.html',
  styleUrl: './bike-fule.component.css'
})
export class BikeFuleComponent {
 bikefule:any;
    data:any;
  
    constructor(private api:ApiService){}
    ngOnInit(): void {
      this.data = new FormGroup({
        BIKE_ID : new FormControl(),
        BIKE_NAME: new FormControl('',Validators.compose([Validators.required])),
        BIKE_PRICE : new FormControl(),
        DATE: new FormControl()
      });
      this.load();
    }
  
  
  
    load(){
      this.api.get('BikeFule/BikeFule').subscribe((res:any)=>{
        this.bikefule=res;
        console.log(this.bikefule)
      })
  
    }
  
    submit(bikefule:any){
      console.log(bikefule);
      this.api.post('BikeFule/SaveBikeFule',bikefule).subscribe((res:any)=>{
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
