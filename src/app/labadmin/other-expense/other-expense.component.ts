import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-other-expense',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './other-expense.component.html',
  styleUrl: './other-expense.component.css'
})
export class OtherExpenseComponent {
    otherexpense:any;
    data:any;
  
    constructor(private api:ApiService){}
    ngOnInit(): void {
      this.data = new FormGroup({
        OTHER_NAME: new FormControl('',Validators.compose([Validators.required])),
        OTHER_PRICE : new FormControl(),
        DATE: new FormControl()
      });
      this.load();
    }
  
    load(){
      this.api.get('OtherExpense/OtherExpense').subscribe((res:any)=>{
        this.otherexpense=res;
        console.log(this.otherexpense)
      })
  
    }
  
    submit(otherexpense:any){
      console.log(otherexpense);
      this.api.post('OtherExpense/SaveOtherExpense',otherexpense).subscribe((res:any)=>{
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
