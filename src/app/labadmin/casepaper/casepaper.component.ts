import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../../shared/footer/footer.component';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { ApiService } from '../../shared/api.service';
import { HttpClientModule } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { log } from 'node:console';
import { NgxPaginationModule } from 'ngx-pagination';
import { Modal } from 'bootstrap';

interface CasePaper {
  trN_NO: number;
  patienT_NAME: string;
  coN_NUMBER: string;
  date: string;

}

@Component({
  selector: 'app-casepaper',
  standalone: true,
  imports: [
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    FormsModule
  ],
  templateUrl: './casepaper.component.html',
  styleUrl: './casepaper.component.css',
})
export class CasepaperComponent implements OnInit {
  case: any;
  data: any;
  tests: any;
  doctor: any;
  searchText: string = '';
  filteredTests: any[] = [];
  showSuggestions: boolean = false;
  matIs: any = [];
  test_Amount: any = 0;
  dis: any = 0;
  discount_Amount: any = 0;
  total_Amount: any = 0;
  total_Lab_Profit: any = 0;
  total_test_LabPrice: any = 0;
  submitted = false;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.data = new FormGroup({
      trN_NO: new FormControl(0),
      patienT_NAME: new FormControl('', Validators.required),
      gender: new FormControl('', Validators.required),
      coN_NUMBER: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
      address: new FormControl('', Validators.required),
      doctoR_CODE: new FormControl(0, Validators.required),
      totaL_AMOUNT: new FormControl(0),
      totaL_PROFIT: new FormControl(0),
      discount: new FormControl(0),
      paymenT_AMOUNT: new FormControl(0),
      paymenT_METHOD: new FormControl(0),
      date: new FormControl(''),
      coM_ID: new FormControl(101),
      paymenT_STATUS: new FormControl(''),

    });
    this.load();
  }

  onSearchChange() {
    const query = this.searchText.trim().toLowerCase();
    if (query) {
      this.filteredTests = this.tests.filter((test: any) =>
        test.tesT_NAME.toLowerCase().includes(query)
      );
      this.showSuggestions = this.filteredTests.length > 0;
    } else {
      this.filteredTests = [];
      this.showSuggestions = false;
    }
  }

  selectTest(testName: string) {
    this.searchText = testName;
    this.showSuggestions = false;
  }

  hideSuggestions() {
    // Give time for click to register before hiding
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  add(Entertest: string) {
    const filteredTests = this.tests.filter((test: any) =>
      test.tesT_NAME.toLowerCase() === Entertest.toLowerCase()
    );

    // Optional: Avoid duplicates
    filteredTests.forEach((test: any) => {
      const alreadyExists = this.matIs.some(
        (item: any) => item.tesT_NAME.toLowerCase() === test.tesT_NAME.toLowerCase()
      );
      if (alreadyExists) return;

      const srNo = this.matIs.length + 1;

      const newTest = {
        ...test,
        sR_NO: srNo
      };

      this.matIs.push(newTest);
    });

    this.searchText = '';
    this.testAmount();
    this.total();
  }

  testAmount() {
    this.test_Amount = 0;
    this.total_test_LabPrice = 0;

    for (let i = 0; i < this.matIs.length; i++) {
      const test = this.matIs[i];
      this.test_Amount += +test.price || 0;
      this.total_test_LabPrice += +test.laB_PRICE || 0;
    }

    this.total();
  }

  removeTest(srno: number) {
    this.matIs = this.matIs.filter((item: any) => item.sR_NO !== Number(srno));

    // Reassign serial numbers
    this.matIs = this.matIs.map((item: any, index: number) => ({
      ...item,
      sR_NO: index + 1
    }));

    this.testAmount();
  }




  discount() {
    this.discount_Amount = (this.test_Amount * (this.dis || 0)) / 100;
    this.total();
  }

  total() {
    this.total_Amount = this.test_Amount - (this.discount_Amount || 0);
    this.total_Lab_Profit = this.total_Amount - this.total_test_LabPrice;
    console.log('Total Amount:', this.total_Amount);
    console.log('Lab Profit:', this.total_Lab_Profit);
  }





  load() {
    this.api.get('CasePaper/CasePapers').subscribe((res: any) => {
      this.case = res;
      console.log(this.case);
    });

    this.api.get('Test/Test').subscribe((res: any) => {
      // this.filteredTests = res;
      this.tests = res;
      console.log(this.tests)
    });
    this.api.get('Doctor/Doctor').subscribe((res: any) => {
      this.doctor = res;
      console.log(this.doctor);
    });
  }

  searchTerm: string = '';
  page: number = 1;
  readonly pageSize: number = 7;

  submit(data: any): void {
    this.submitted = true;

    if (!this.data.valid) {
      alert('Please fill all required form fields.');
      return;
    }

    if (!Array.isArray(this.matIs) || this.matIs.length === 0) {
      alert('Please add at least one test.');
      return;
    }

    const payload = {
      ...data,
      matIs: this.matIs
    };

    console.log('Submitting:', payload);

    this.api.post('CasePaper/SaveCasePaper', payload).subscribe({
      next: (res: any) => {
        console.log('Response:', res);
        this.load();
      },
      error: (err: any) => {
        console.error('Error occurred:', err);
        alert('An error occurred while saving. Please try again.');
      }
    });
  }


  startDate: string = '';
  endDate: string = '';
  filtered: CasePaper[] = []; // Holds filtered data
  isDateFiltered = false;

  filteredCases(): CasePaper[] {
    let result = this.case;

    if (this.searchTerm) {
      result = result.filter((c: CasePaper) =>
        c.patienT_NAME.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.isDateFiltered && this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);

      result = result.filter((c: CasePaper) => {
        const caseDate = new Date(c.date);
        return caseDate >= start && caseDate <= end;
      });
    }

    return result;
  }

  filterByDate() {
    if (this.startDate && this.endDate) {
      this.isDateFiltered = true;
    } else {
      this.isDateFiltered = false;
    }
  }

  edit(trN_NO: any): void {
    this.api.get(`CasePaper/CasePaper/${trN_NO}`).subscribe({
      next: (res: any) => {
        console.log(res);

        // Patch form fields
        this.data.patchValue({
          trN_NO: res?.trN_NO,
          patienT_NAME: res?.patienT_NAME,
          gender: res?.gender,
          coN_NUMBER: res?.coN_NUMBER,
          address: res?.address,
          doctoR_CODE: res?.doctoR_CODE,
          totaL_AMOUNT: res?.totaL_AMOUNT,
          totaL_PROFIT: res?.totaL_PROFIT,
          discount: res?.discount,
          paymenT_AMOUNT: res?.paymenT_AMOUNT,
          paymenT_METHOD: res?.paymenT_METHOD,
          date: res?.date,
          coM_ID: res?.coM_ID,
          paymenT_STATUS: res?.paymenT_STATUS,
        });

        // Assign materials
        this.matIs = res?.matIs || [];

        // Recalculate totals
        this.testAmount();
        this.discount();
      },
      error: (err) => {
        console.error('Error loading case paper:', err);
        alert('Failed to load case paper data.');
      }
    });
  }
  getTestNameByCode(code: string): string {
    const match = this.tests.find((t: any) => t.tesT_CODE === code);
    return match ? match.tesT_NAME : 'N/A';
  }

}
