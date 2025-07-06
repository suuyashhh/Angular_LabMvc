import { Component, OnInit } from '@angular/core';
import { FooterComponent } from "../../shared/footer/footer.component";
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { ApiService } from '../../shared/api.service';
import { log } from 'console';
import { HttpClientModule } from '@angular/common/http';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-add-test',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './add-test.component.html',
  styleUrl: './add-test.component.css'
})
export class AddTestComponent implements OnInit {

  tests: any;
  data: any;
  TEST_CODE: any = 0;
  ComId: number = 0;
  btn: any = '';
  submitted = false;
  Reason: any = '';

  constructor(private api: ApiService) { }


  ngOnInit(): void {
    // this.clearData();
    this.load();
  }

  load() {
    this.data = new FormGroup({
      TEST_NAME: new FormControl('', Validators.required),
      PRICE: new FormControl('', Validators.required),
      LAB_PRICE: new FormControl(''),
      COM_ID: new FormControl()
    });

    this.api.get('Test/Test').subscribe((res: any) => {
      this.tests = res;
      console.log(this.tests)
    })

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

  clearData() {
    this.TEST_CODE = 0;
    this.btn = '';
    this.data.patchValue({
      TEST_NAME: '',
      PRICE: '',
      LAB_PRICE: ''
    })
  }

  submit(test: any) {
    this.submitted = false;
    if (!this.data.valid) {
      this.submitted = true;
      return;
    }
    if (this.TEST_CODE == 0 && this.btn == '') {
      test.COM_ID = this.ComId
        this.api.post('Test/SaveTest', test).subscribe((res: any) => {
          this.api.modalClose();
          this.load();
       }); 
    } else if (this.TEST_CODE != 0 && this.btn == 'E') {
      console.log(this.TEST_CODE);
      this.api.post('Test/EditTest/' + this.TEST_CODE, test).subscribe((res: any) => {
        this.load();
        console.log(res);
        
      });
    }
    else if (this.TEST_CODE != 0 && this.btn == 'D') {
      console.log(this.Reason);

      if (this.Reason != '') {
        this.api.delete('Test/DeleteTest/' + this.TEST_CODE).subscribe((res: any) => {
          this.load();
        })
      }
      else {
        alert("Fill the reason");
      }
    }
  }

  getDataById(testCode: number, btn: any) {
    this.btn = btn;
    this.api.get('Test/Test/' + testCode).subscribe((res: any) => {
      console.log(res);

      this.TEST_CODE = res.tesT_CODE;
      this.data.patchValue({
        TEST_NAME: res.tesT_NAME,
        PRICE: res.price,
        LAB_PRICE: res.laB_PRICE
      })
    })
  }

  // edit(testCode: any) {
  //   this.api.get('Test/Test/' + testCode).subscribe((res: any) => {
  //     console.log(res);

  //     this.TEST_CODE = res.tesT_CODE;
  //     this.data.patchValue({
  //       TEST_NAME: res.tesT_NAME,
  //       PRICE: res.price,
  //       LAB_PRICE: res.laB_PRICE
  //     })
  //   })
  // }

  // deleteTest(testCode:any){
  //   this.api.get('Test/Test/' + testCode).subscribe((res: any) => {
  //     console.log(res);

  //     this.TEST_CODE = res.tesT_CODE;
  //     this.data.patchValue({
  //       TEST_NAME: res.tesT_NAME,
  //       PRICE: res.price,
  //       LAB_PRICE: res.laB_PRICE
  //     })
  //   })
  //     this.api.delete('Test/DeleteTest/' + testCode).subscribe((res: any) => {
  //      this.load();
  //     })
  // }

}

// submit(test:any){
//   console.log(test);
//   this.api.post('Test/SaveTest',test).subscribe((res:any)=>{
//     console.log(res);
//     this.load();

//     const modalElement = document.getElementById('myModal');
//   if (modalElement) {
//     const modal = Modal.getInstance(modalElement);
//     modal?.hide();
//   }
//   })
// }


// ngOnInit(): void {
//   this.data = new FormGroup({
//     TEST_NAME: new FormControl('', Validators.compose([Validators.required])),
//     PRICE: new FormControl(),
//     LAB_PRICE: new FormControl()
//   });