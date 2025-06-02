import { Component, OnInit } from '@angular/core';
import { FooterComponent } from "../../shared/footer/footer.component";
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { ApiService } from '../../shared/api.service';
import { HttpClientModule } from '@angular/common/http';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { log } from 'node:console';
import { NgxPaginationModule } from 'ngx-pagination';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-casepaper',
  standalone: true,
  imports: [HttpClientModule,CommonModule,ReactiveFormsModule,NgxPaginationModule,FormsModule],
  templateUrl: './casepaper.component.html',
  styleUrl: './casepaper.component.css'
})
export class CasepaperComponent implements OnInit {

  case:any;
  data:any;
  matIs:any = [
    {
      "tesT_CODE": 0,
      "tesT_NAME": "string",
      "trN_NO": 0,
      "sR_NO": 0,
      "price": 0,
      "laB_PRICE": 0,
      "coM_ID": "string"
    }
  ];


  constructor(private api:ApiService){}

  ngOnInit(): void {
    this.data = new FormGroup ({
      TRN_NO : new FormControl,
      PATIENT_NAME : new FormControl,
      CON_NUMBER : new FormControl,
      DATE : new FormControl
    });
    this.load();
    this.add(1);
  }

  add(no:any){
    this.matIs.push({
      "tesT_CODE": 0,
      "tesT_NAME": "string",
      "trN_NO": 0,
      "sR_NO": 0,
      "price": 0,
      "laB_PRICE": 0,
      "coM_ID": "string"
    });
    
  }

  load(){
    this.api.get('CasePaper/CasePapers').subscribe((res:any)=>{
      this.case=res;
      console.log(this.case);
    });
  }

  page: number = 1;
  readonly pageSize: number = 7;

    submit(casepaper:any){
      console.log(casepaper);
      this.api.post('CasePaper/SaveCasePaper',casepaper).subscribe((res:any)=>{
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
