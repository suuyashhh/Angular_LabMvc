import { Component, OnInit } from '@angular/core';
import { FooterComponent } from "../../shared/footer/footer.component";
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { ApiService } from '../../shared/api.service';
import { log } from 'console';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-add-test',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './add-test.component.html',
  styleUrl: './add-test.component.css'
})
export class AddTestComponent implements OnInit {

    data!: FormGroup;
  tests: any[] = [];
  reqHeader!: HttpHeaders;
  TEST_CODE:any;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    });

    this.data = new FormGroup({
      COM_ID:new FormControl(0),
      TEST_NAME: new FormControl('', Validators.required),
      PRICE: new FormControl(),
      LAB_PRICE: new FormControl(),
      STATUS_CODE: new FormControl(0),
    });

    this.load();
  }

  load(): void {
  this.api.get('Test/Tests').subscribe({
    next: (res: any) => {
      this.tests = res;
      console.log(this.tests);
    },
    error: (err) => {
      console.error('Failed to load tests:', err);
    }
  });
}

  submit(test: any) {
    console.log(test);
    if(this.TEST_CODE == null){
      this.api.post('Test/SaveTest', test).subscribe((res: any) => {
        this.load();

        const modalElement = document.getElementById('myModal');
        if (modalElement) {
          const modal = Modal.getInstance(modalElement);
          modal?.hide();
        }

      });
    }else{
       this.api.post('Test/EditTest/'+ this.TEST_CODE,test).subscribe((res: any) => {
        console.log(res);
        this.load();

      });
    }
  }

  edit(testCode: any) {
    this.api.get('Test/Test/' + testCode).subscribe((res: any) => {
      this.TEST_CODE = res.tesT_CODE;
      this.data.patchValue({
        TEST_NAME: res.tesT_NAME,
        PRICE: res.price,
        LAB_PRICE: res.laB_PRICE
      })
    })
  }

  deleteTest(testCode:any){
    if(confirm("Are You Delete?")){
      this.api.delete('Test/DeleteTest/' + testCode).subscribe((res: any) => {
       this.load();
      })
    }
  }

}
