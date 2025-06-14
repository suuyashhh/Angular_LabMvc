import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-electricity-bill',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './electricity-bill.component.html',
  styleUrl: './electricity-bill.component.css'
})
export class ElectricityBillComponent {

    elebill:any;
    data:any;
  
    constructor(private api:ApiService){}
    ngOnInit(): void {
      this.data = new FormGroup({
        ELC_PRICE : new FormControl(),
        DATE: new FormControl()
      });
      this.load();
    }
  
    load(){
      this.api.get('ElectricityBill/ElectricityBill').subscribe((res:any)=>{
        this.elebill=res;
        console.log(this.elebill)
      })
  
    }
  
    submit(elebill:any){
      console.log(elebill);
      this.api.post('ElectricityBill/SaveElectricityBill',elebill).subscribe((res:any)=>{
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
