import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  QueryList,
  ViewChildren,
  ElementRef,
}
from '@angular/core';
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
import { NgxPaginationModule } from 'ngx-pagination';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';

interface CasePaper {
  trN_NO: number;
  patienT_NAME: string;
  coN_NUMBER: string;
  date: string;
  statuS_CODE: number;
}

@Component({
  selector: 'app-casepaper',
  standalone: true,
  imports: [
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    NgSelectModule,
  ],
  templateUrl: './casepaper.component.html',
  styleUrl: './casepaper.component.css',
})

export class CasepaperComponent implements OnInit {
  @ViewChildren('formField') formFields!: QueryList<ElementRef>;


  isCreatingNew: boolean = false; // ✅ Added

  cases: any;
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
  dateRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };
  today: Date = new Date();
  trn_no: number = 0;

  constructor(private api: ApiService,private toastr : ToastrService) {}

  ngOnInit(): void {
    this.data = new FormGroup({
      trN_NO: new FormControl(0),
      patienT_NAME: new FormControl('', Validators.required),
      gender: new FormControl('', Validators.required),
      coN_NUMBER: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{10}$'),
      ]),
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
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  add(Entertest: string) {
    const filteredTests = this.tests.filter(
      (test: any) => test.tesT_NAME.toLowerCase() === Entertest.toLowerCase()
    );

    filteredTests.forEach((test: any) => {
      const alreadyExists = this.matIs.some(
        (item: any) =>
          item.tesT_NAME.toLowerCase() === test.tesT_NAME.toLowerCase()
      );
      if (alreadyExists) return;

      const srNo = this.matIs.length + 1;
      const newTest = {
        ...test,
        sR_NO: srNo,
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

    this.matIs = this.matIs.map((item: any, index: number) => ({
      ...item,
      sR_NO: index + 1,
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
      this.cases = res;
      console.log(this.cases);
    });

    this.api.get('Test/Test').subscribe((res: any) => {
      this.tests = res;
      console.log(this.tests);
    });

    this.api.get('Doctor/Doctor').subscribe((res: any) => {
      this.doctor = res;
      console.log(this.doctor);
    });
  }

  searchTerm: string = '';
  page: number = 1;
  readonly pageSize: number = 6;

  submit(data: any): void {
  this.submitted = true;

  if (!this.data.valid) {
    // Scroll to first invalid field
    setTimeout(() => {
      const firstInvalid = this.formFields.find((el) => {
        const controlName = el.nativeElement.getAttribute('formControlName');
        return controlName && this.data.get(controlName)?.invalid;
      });
      if (firstInvalid) {
        firstInvalid.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        firstInvalid.nativeElement.focus();
      }
    }, 0);

    // Toastr error toast instead of Swal
    this.toastr.error('Please fill all required fields!', 'Validation Error');
    return;
  }

  if (!Array.isArray(this.matIs) || this.matIs.length === 0) {
    this.toastr.error('Please add at least one test!', 'Test Missing');
    return;
  }

  const payload = {
    ...data,
    matIs: this.matIs,
  };

  console.log('Submitting:', payload);

  this.api.post('CasePaper/SaveCasePaper', payload).subscribe({
    next: (res: any) => {
      console.log('Response:', res);
      this.load();
      this.cancelCreate();
    },
    error: (err: any) => {
      console.error('Error occurred:', err);
      this.toastr.error('An error occurred while saving. Please try again.', 'Server Error');
    },
  });
}

  cancelCreate() {
    this.isCreatingNew = false; // ✅ Hide form
    this.data.reset(); // ✅ Reset form data
    this.matIs = []; // ✅ Clear tests
    this.test_Amount = 0;
    this.total_Amount = 0;
    this.total_test_LabPrice = 0;
    this.total_Lab_Profit = 0;
  }

  startDate: string = '';
  endDate: string = '';
  filtered: CasePaper[] = [];
  isDateFiltered = false;

  filteredCases(): CasePaper[] {
    let result = this.cases;

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
    this.isDateFiltered = !!(this.startDate && this.endDate);
  }

  edit(trN_NO: any): void {
    this.api.get(`CasePaper/CasePaper/${trN_NO}`).subscribe({
      next: (res: any) => {
        this.trn_no = res.trN_NO;
        this.data.patchValue(res);
        this.matIs = res?.matIs || [];
        this.testAmount();
        this.discount();
        this.isCreatingNew = true; // Show form on edit
      },
      error: (err) => {
        console.error('Error loading case paper:', err);
        alert('Failed to load case paper data.');
      },
    });
  }

  getTestNameByCode(code: string): string {
    const match = this.tests.find((t: any) => t.tesT_CODE === code);
    return match ? match.tesT_NAME : 'N/A';
  }

  selectedProduct: any | null = null;

  products: any[] = [
    {
      id: 1,
      name: 'Air Jordan',
      description: 'Air Jordan is a line of basketball shoes produced by Nike',
      image: 'assets/img/ecommerce-images/product-9.png',
      category: 'Shoes',
      categoryIcon: 'ri-home-6-line',
      stock: true,
      sku: '31063',
      price: '$125',
      qty: 942,
      status: 'Inactive',
    },
    {
      id: 2,
      name: 'Amazon Fire TV',
      description: '4K UHD smart TV, stream live TV without cable',
      image: 'assets/img/ecommerce-images/product-13.png',
      category: 'Electronics',
      categoryIcon: 'ri-computer-line',
      stock: false,
      sku: '5829',
      price: '$263.49',
      qty: 587,
      status: 'Scheduled',
    },
  ];
}
