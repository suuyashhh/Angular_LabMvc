import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  QueryList,
  ViewChildren,
  ElementRef,
} from '@angular/core';
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
import { NgSelectModule, NgOption } from '@ng-select/ng-select';
import { log } from 'console';
import { ServicesService } from '../../shared/services.service';
import { FormattedDatePipe } from '../../shared/pipes/formatted-date.pipe';

interface CasePaper {
  trN_NO: number;
  patienT_NAME: string;
  coN_NUMBER: string;
  date: string;
  statuS_CODE: number;
  paymenT_STATUS?: string;
  crT_BY: string;
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
    FormattedDatePipe
  ],
  templateUrl: './casepaper.component.html',
  styleUrl: './casepaper.component.css',
})
export class CasepaperComponent implements OnInit {
   @ViewChildren('formField') formFields!: QueryList<ElementRef>;
  @ViewChild('patientNameField') patientNameField!: ElementRef;
  @ViewChild('genderField') genderField!: ElementRef;
  @ViewChild('phoneField') phoneField!: ElementRef;
  @ViewChild('addressField') addressField!: ElementRef;
  @ViewChild('dateField') dateField!: ElementRef;
  @ViewChild('doctorField') doctorField!: ElementRef;

  isCreatingNew: boolean = false; // ✅ Added
  isInvoiceNew: boolean = false; // ✅ Added

  btn: string = '';
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
  Reason: any;

  searchTerm: string = '';
  page: number = 1;
  readonly pageSize: number = 15;

  startDate: string = '';
  endDate: string = '';
  filtered: CasePaper[] = [];
  isDateFiltered = false;
  loadingMaterials = false;


  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private service: ServicesService
  ) { }

  ngOnInit(): void {
    this.data = new FormGroup({
      TRN_NO: new FormControl(0),
      collectioN_TYPE: new FormControl(0),
      patienT_NAME: new FormControl('', Validators.required),
      gender: new FormControl('', Validators.required),
      coN_NUMBER: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{10}$'),
      ]),
      address: new FormControl('', Validators.required),
      doctoR_CODE: new FormControl('', Validators.required),
      totaL_AMOUNT: new FormControl(0),
      totaL_PROFIT: new FormControl(0),
      discount: new FormControl(0),
      paymenT_AMOUNT: new FormControl(0, Validators.required),
      paymenT_METHOD: new FormControl(0),
      date: new FormControl(this.service.getFormattedDate(new Date(), 8), Validators.required),
      coM_ID: new FormControl(101),
      paymenT_STATUS: new FormControl(''),
    });

    this.load();
    this.data.get('paymenT_AMOUNT')?.valueChanges.subscribe(() => {
      this.onPaymentAmountChange();
    });
  }

  // ✅ Checkbox toggle logic
  onCollectionChange(event: any): void {
    const checked = event.target.checked;
    this.data.get('collectioN_TYPE')?.setValue(checked ? 1 : 0);
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
  if (!Entertest) return;

  const filteredTests = this.tests.filter(
    (test: any) => test.tesT_NAME?.toLowerCase() === Entertest?.toLowerCase()
  );

  filteredTests.forEach((test: any) => {
    const testName = test.tesT_NAME?.toLowerCase();
    if (!testName) return;

    const alreadyExists = this.matIs.some(
      (item: any) => item?.tesT_NAME?.toLowerCase() === testName
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
  this.discount(); // Add this line to recalculate discount after adding test
  this.total();
}



 removeTest(srno: number) {
  this.matIs = this.matIs.filter((item: any) => item.sR_NO !== Number(srno));

  this.matIs = this.matIs.map((item: any, index: number) => ({
    ...item,
    sR_NO: index + 1,
  }));

  this.testAmount();
  this.discount(); // Add this line to recalculate discount after removing test
}

  load() {
const { start, end } = this.service.getCurrentMonthRange();
    this.startDate = start;
    this.endDate = end;
    this.loadMaterials();

    // this.api.get('CasePaper/CasePapers').subscribe((res: any) => {
    //   this.cases = res;
    //   console.log(this.cases);
    // });

    this.api.get('Test/Tests').subscribe((res: any) => {
      this.tests = res;
      console.log(this.tests);
    });

    this.api.get('Doctor/Doctors').subscribe((res: any) => {
      this.doctor = res;
      console.log(this.doctor);
    });
  }


  onDateChange() {
    if (this.startDate && this.endDate) this.loadMaterials();
  }


  loadMaterials() {
    const startDate = this.service.formatDate(this.startDate, 1);   // yyyyMMdd
    const endDate = this.service.formatDate(this.endDate, 1);     // yyyyMMdd
    this.loadingMaterials = true;
    this.api.get(`CasePaper/GetDateWiseCasePaper/${startDate},${endDate}`).subscribe({
      next: (res: any) => {
        this.cases = res;
        console.log(res);
      },
      error: () => this.toastr.error('Failed to load materials'),
      complete: () => this.loadingMaterials = false
    });
  }

  onPaymentAmountChange(): void {
  const totalAmount = +this.data.get('totaL_AMOUNT')?.value || 0;
  let paymentAmount = this.data.get('paymenT_AMOUNT')?.value;

  // If paymentAmount is null/empty/undefined, treat it as 0
  if (paymentAmount === null || paymentAmount === undefined || paymentAmount === '') {
    paymentAmount = 0;
    this.data.get('paymenT_AMOUNT')?.setValue(0);
  }

  // Convert to number
  paymentAmount = +paymentAmount;

  // Allow small difference (like 0.99 → Completed if close enough)
  const tolerance = 1; // you can set 0.5 or 1 as per your business logic

  const status =
    paymentAmount === 0
      ? 'PENDING'
      : paymentAmount + tolerance >= totalAmount && totalAmount > 0
        ? 'COMPLETED'
        : 'PENDING';

  this.data.get('paymenT_STATUS')?.setValue(status);
}



 submit(data: any): void {
  this.submitted = true;
  this.onPaymentAmountChange();

  if (!data.discount) data.discount = 0;
  if (!data.paymenT_AMOUNT) data.paymenT_AMOUNT = 0;
  if (!data.paymenT_STATUS) data.paymenT_STATUS = 'PENDING';

  // Format the date
  const rawDate = this.data.get('date')?.value;
  if (rawDate) {
    const parts = rawDate.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    data.DATE = this.service.getFormattedDate(formatted, 1);
  }

  // Check if at least one test is added
  if (!Array.isArray(this.matIs) || this.matIs.length === 0) {
    this.toastr.error('Please add at least one test!', 'Test Missing');
    return;
  }

  // Individual field validation
  if (this.data.get('patienT_NAME')?.invalid) {
    this.toastr.error('Please fill patient name field!', 'Patient Name');
    setTimeout(() => {
      this.patientNameField.nativeElement.focus();
      this.patientNameField.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
    return;
  }

  if (this.data.get('gender')?.invalid) {
    this.toastr.error('Please select gender!', 'Gender');
    setTimeout(() => {
      this.genderField.nativeElement.focus();
      this.genderField.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
    return;
  }

  if (this.data.get('coN_NUMBER')?.invalid) {
    if (this.data.get('coN_NUMBER')?.errors?.['required']) {
      this.toastr.error('Please fill phone number field!', 'Phone Number');
    } else if (this.data.get('coN_NUMBER')?.errors?.['pattern']) {
      this.toastr.error('Please enter a valid 10-digit phone number!', 'Phone Number');
    }
    setTimeout(() => {
      this.phoneField.nativeElement.focus();
      this.phoneField.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
    return;
  }

  if (this.data.get('address')?.invalid) {
    this.toastr.error('Please fill address field!', 'Address');
    setTimeout(() => {
      this.addressField.nativeElement.focus();
      this.addressField.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
    return;
  }

  if (this.data.get('date')?.invalid) {
    this.toastr.error('Please select date!', 'Date');
    setTimeout(() => {
      this.dateField.nativeElement.focus();
      this.dateField.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
    return;
  }

  if (this.data.get('doctoR_CODE')?.invalid) {
    this.toastr.error('Please select a doctor!', 'Doctor Reference');
    setTimeout(() => {
      this.doctorField.nativeElement.focus();
      this.doctorField.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
    return;
  }

  const payload = {
    ...data,
    matIs: this.matIs,
  };

  // Handle Add / Edit logic
  if (!this.trn_no || this.btn === '') {
    // ➕ Add CasePaper
    this.api.post('CasePaper/SaveCasePaper', payload).subscribe({
      next: () => {
        this.toastr.success('Case paper added successfully');
        setTimeout(() => {
          window.location.reload();
        }, 500);
        this.cancelCreate();
      },
      error: (err) => {
        console.error('Add error:', err);
        this.toastr.error('Failed to add case paper', 'Server Error');
      }
    });
  } else if (this.trn_no && this.btn === 'E') {
    // ✏️ Edit CasePaper
    this.data.get('TRN_NO')?.setValue(this.trn_no);
    this.api.post('CasePaper/EditCasePaper/' + this.trn_no, payload).subscribe({
      next: () => {
        this.toastr.success('Case paper updated successfully');
        setTimeout(() => {
          window.location.reload();
        }, 500);
        this.cancelCreate();
      },
      error: (err) => {
        console.error('Edit error:', err);
        this.toastr.error('Failed to update case paper', 'Server Error');
      }
    });
  } else if (this.trn_no && this.btn === 'D') {
    // 🗑️ Delete CasePaper
    if (this.Reason && this.Reason.trim() !== '') {
      this.api.delete(`CasePaper/DeleteCasePaper/${this.trn_no}`).subscribe({
        next: () => {
          this.toastr.success('Case paper deleted successfully');
          setTimeout(() => {
            window.location.reload();
          }, 500);
          this.cancelCreate();
          this.Reason = "";
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.toastr.error('Failed to delete case paper', 'Server Error');
        }
      });
    } else {
      this.toastr.warning('Please provide a reason for deletion.', 'Missing Reason');
    }
  }
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

  cancleInvoice() {
    this.isInvoiceNew = false;
  }


  filteredCases(): CasePaper[] {
    let result = this.cases || [];

    // Apply search filter if searchTerm exists
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      result = result.filter((c: CasePaper) =>
        c.patienT_NAME.toLowerCase().includes(searchTermLower) || // Name search
        (c.coN_NUMBER && c.coN_NUMBER.includes(this.searchTerm)) // Contact number search (exact match)
      );
    }

    // Apply date filter if enabled and dates exist
    if (this.isDateFiltered && this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);

      result = result.filter((c: CasePaper) => {
        const caseDate = new Date(c.date);
        return caseDate >= start && caseDate <= end;
      });
    }

    // Reset to page 1 when search term changes
    if (this.searchTerm) {
      this.page = 1;
    }

    return result;
  }

  onSearch() {
    // Reset to first page when searching
    this.page = 1;
  }

  filterByDate() {
    this.isDateFiltered = !!(this.startDate && this.endDate);
  }

  // edit(trN_NO: any): void {
  //   this.api.get(`CasePaper/CasePaper/${trN_NO}`).subscribe({
  //     next: (res: any) => {
  //       this.trn_no = res.trN_NO;
  //       this.data.patchValue(res);
  //       this.matIs = res?.matIs || [];
  //       this.testAmount();
  //       this.discount();
  //       this.isCreatingNew = true; // Show form on edit
  //     },
  //     error: (err) => {
  //       console.error('Error loading case paper:', err);
  //       alert('Failed to load case paper data.');
  //     },
  //   });
  // }

  getTestNameByCode(code: string): string {
    const match = this.tests.find((t: any) => t.tesT_CODE === code);
    return match ? match.tesT_NAME : 'N/A';
  }

  selectedDoctor: number | null = null;

  customSearchFn(term: string, item: any) {
    const search = term?.toLowerCase?.() ?? '';
    const name = item?.doctoR_NAME?.toLowerCase?.() ?? '';
    return name.includes(search);
  }

  openInlineForm(trN_NO: number, action: string) {
    this.isCreatingNew = true;
    this.isInvoiceNew = false;
    this.btn = action;
    this.getDataById(trN_NO, action);
  }

  openInvoiceForm(trN_NO: number, action: string) {
    this.isInvoiceNew = true;
    this.isCreatingNew = false;
    this.btn = action;
    this.getDataById(trN_NO, action);
  }

 testAmount() {
  this.test_Amount = 0;
  this.total_test_LabPrice = 0;

  for (let i = 0; i < this.matIs.length; i++) {
    const test = this.matIs[i];
    this.test_Amount += +test.price || 0;
    this.total_test_LabPrice += +test.laB_PRICE || 0;
  }

  // Also recalculate discount based on new test amount
  this.discount();
  this.total();
}

 discount() {
  const discountPercent = this.data.get('discount')?.value || 0;
  this.discount_Amount = (this.test_Amount * discountPercent) / 100;
  this.total();
}

 total() {
  this.total_Amount = this.test_Amount - (this.discount_Amount || 0);
  this.total_Lab_Profit = this.total_Amount - this.total_test_LabPrice;

  // Update form controls
  this.data.get('totaL_AMOUNT')?.setValue(this.total_Amount);
  this.data.get('totaL_PROFIT')?.setValue(this.total_Lab_Profit);

  // Also trigger payment amount validation
  this.onPaymentAmountChange();
}

  printInvoice() {
    window.print();
  }

  saveInvoice() {
    this.api.post('CasePaper/InvoiceSave', {
      TrnNo: this.trn_no,
      InvoiceNo: this.generateInvoiceNumber()
    }).subscribe({
      next: (res) => {
        this.toastr.success('Invoice saved successfully');
      },
      error: (err) => {
        this.toastr.error('Failed to save invoice');
      }
    });
  }

  generateInvoiceNumber(): string {
    return 'INV-' + new Date().getTime();
  }

  getDoctorName(doctorCode: string): string {
    const doc = this.doctor.find((d: any) => d.doctoR_CODE === doctorCode);
    return doc ? doc.doctoR_NAME : 'N/A';
  }



  getDataById(trN_NO: number, btn: string) {
  this.btn = btn;
  this.api.get('CasePaper/CasePaper/' + trN_NO).subscribe((res: any) => {
    this.trn_no = res.trN_NO;

    // Patch form values
    this.data.patchValue({
      patienT_NAME: res.patienT_NAME,
      gender: res.gender,
      coN_NUMBER: res.coN_NUMBER,
      address: res.address,
      totaL_AMOUNT: res.totaL_AMOUNT,
      totaL_PROFIT: res.totaL_PROFIT,
      discount: res.discount,
      paymenT_AMOUNT: res.paymenT_AMOUNT,
      collectioN_TYPE: res.collectioN_TYPE,
      paymenT_METHOD: res.paymenT_METHOD,
      paymenT_STATUS: res.paymenT_STATUS,
      date: this.service.getFormattedDate(res.date, 8),
      doctoR_CODE: res.doctoR_CODE,
      crT_BY: res.crT_BY,
    });

    // Set test items
    this.matIs = res.matIs.map((item: any) => ({
      ...item,
      TEST_NAME: this.getTestNameByCode(item.tesT_CODE)
    }));

    // Recalculate amounts - call all calculation methods
    this.testAmount();
    this.discount();
    this.total();
    this.onPaymentAmountChange();
  });
}

  resetCasepaperForm() {
    this.isCreatingNew = true; // Show the inline form
    this.btn = ''; // Clear action (E/D/etc.)
    // this.TEST_CODE = 0;              // Reset TEST_CODE
    this.trn_no = 0; // Reset transaction number (if used)
    this.searchText = ''; // Reset test search input
    this.selectedDoctor = null; // Reset ng-select
    this.discount_Amount = 0; // Reset discount calculation
    this.total_Amount = 0; // Reset total
    this.total_Lab_Profit = 0; // Reset profit
    this.matIs = []; // Reset tests list (blood tests)

    // Reset the FormGroup values
    this.data.reset({
      trN_NO: 0,
      collectioN_TYPE: 0,
      patienT_NAME: '',
      gender: '',
      coN_NUMBER: '',
      address: '',
      doctoR_CODE: '',
      totaL_AMOUNT: 0,
      totaL_PROFIT: 0,
      discount: 0,
      paymenT_AMOUNT: 0,
      paymenT_METHOD: 0,
      date: '', // optional: can use `new Date()` if needed
      coM_ID: 101, // static value you set during init
      paymenT_STATUS: '',
      crT_BY: ''
    });
  }
}
