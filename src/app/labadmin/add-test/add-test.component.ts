import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-test',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule, FormsModule],
  templateUrl: './add-test.component.html',
  styleUrl: './add-test.component.css'
})
export class AddTestComponent implements OnInit {

  data!: FormGroup;
  tests: any;
  TEST_CODE: number = 0;
  ComId: number = 0;
  btn: string = '';
  submitted: boolean = false;
  Reason: string = '';
  loadingTests = false;

  constructor(private api: ApiService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');
    this.initForm();
    this.getTests();
  }

  initForm() {
    this.data = new FormGroup({
      TEST_NAME: new FormControl('', Validators.required),
      PRICE: new FormControl('', Validators.required),
      LAB_PRICE: new FormControl(),
      COM_ID: new FormControl()
    });
  }

  getTests() {
    this.loadingTests = true;
    this.api.get('Test/Tests').subscribe({
      next: (res: any) => this.tests = res,
      error: (err) => {
        this.toastr.error('Failed to load test list');
        console.error(err);
        this.tests = [];
      },
      complete: () => this.loadingTests = false
    });
  }

  clearData() {
    this.TEST_CODE = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
    this.Reason = '';
  }

  submit(test: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    if (this.TEST_CODE === 0 && this.btn === '') {
      // Add Test
      this.api.post('Test/SaveTest', test).subscribe({
        next: () => {
          this.getTests();
          setTimeout(() => {
            this.toastr.success('Test added successfully');
            this.api.modalClose('CreateFormModal');
            this.getTests();
            this.initForm();
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add test');
          console.error(err);
        }
      });

    } else if (this.TEST_CODE !== 0 && this.btn === 'E') {
      // Edit Test
      this.api.post('Test/EditTest/' + this.TEST_CODE, test).subscribe({
        next: () => {
          this.getTests();
          setTimeout(() => {
            this.toastr.success('Test updated successfully');
            this.api.modalClose('CreateFormModal');
            this.initForm();
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update test');
          console.error(err);
        }
      });

    } else if (this.TEST_CODE !== 0 && this.btn === 'D') {
      // Delete Test
      if (this.Reason !== '') {
        this.api.delete('Test/DeleteTest/' + this.TEST_CODE).subscribe({
          next: () => {
            this.getTests();
            setTimeout(() => {
              this.toastr.success('Test deleted successfully');
              this.api.modalClose('CreateFormModal');
              this.clearData();
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete test');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning("Please provide a reason for deletion.");
      }
    }
  }

  getDataById(testCode: number, btn: string) {
    this.btn = btn;
    this.api.get('Test/Test/' + testCode).subscribe((res: any) => {
      this.TEST_CODE = res.tesT_CODE;
      this.data.patchValue({
        TEST_NAME: res.tesT_NAME,
        PRICE: res.price,
        LAB_PRICE: res.laB_PRICE
      });
    });
  }

}
