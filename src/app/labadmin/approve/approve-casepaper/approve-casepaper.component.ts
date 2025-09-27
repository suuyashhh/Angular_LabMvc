import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  QueryList,
  ViewChildren,
  ElementRef,
} from '@angular/core';
import { ApiService } from '../../../shared/api.service';
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
import { ServicesService } from '../../../shared/services.service';
import { FormattedDatePipe } from '../../../shared/pipes/formatted-date.pipe';
import { AuthService } from '../../../shared/auth.service';

interface CasePaper {
  trN_NO: number;
  patienT_NAME: string;
  coN_NUMBER: string;
  date: string;
  statuS_CODE: number;
  paymenT_STATUS?: string;
  crT_BY: string;
  totaL_AMOUNT?: number;
}
@Component({
  selector: 'app-approve-casepaper',
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
  templateUrl: './approve-casepaper.component.html',
  styleUrl: './approve-casepaper.component.css'
})
export class ApproveCasepaperComponent implements OnInit {
  @ViewChildren('formField') formFields!: QueryList<ElementRef>;
  @ViewChild('patientNameField') patientNameField!: ElementRef;
  @ViewChild('genderField') genderField!: ElementRef;
  @ViewChild('phoneField') phoneField!: ElementRef;
  @ViewChild('addressField') addressField!: ElementRef;
  @ViewChild('dateField') dateField!: ElementRef;
  @ViewChild('doctorField') doctorField!: ElementRef;

  isCreatingNew: boolean = false;
  btn: string = '';
  cases: CasePaper[] = [];
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
  user: any;

  // Selection management
  selectedCases: number[] = []; // Store TRN_NO of selected cases
  isAllSelected: boolean = false;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private service: ServicesService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.user = this.auth.getUser();
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

  // Selection management methods
  toggleSelection(trnNo: number, event: any): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      if (!this.selectedCases.includes(trnNo)) {
        this.selectedCases.push(trnNo);
      }
    } else {
      this.selectedCases = this.selectedCases.filter(id => id !== trnNo);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.isAllSelected = isChecked;
    
    if (isChecked) {
      // Select all visible cases on current page
      const currentPageCases = this.filteredCases().slice(
        (this.page - 1) * this.pageSize, 
        this.page * this.pageSize
      );
      this.selectedCases = [...new Set([...this.selectedCases, ...currentPageCases.map(c => c.trN_NO)])];
    } else {
      // Deselect all visible cases on current page
      const currentPageCaseIds = this.filteredCases()
        .slice((this.page - 1) * this.pageSize, this.page * this.pageSize)
        .map(c => c.trN_NO);
      this.selectedCases = this.selectedCases.filter(id => !currentPageCaseIds.includes(id));
    }
  }

  isSelected(trnNo: number): boolean {
    return this.selectedCases.includes(trnNo);
  }

  updateSelectAllState(): void {
    const currentPageCases = this.filteredCases().slice(
      (this.page - 1) * this.pageSize, 
      this.page * this.pageSize
    );
    this.isAllSelected = currentPageCases.length > 0 && 
      currentPageCases.every(casePaper => this.selectedCases.includes(casePaper.trN_NO));
  }

  // Bulk actions
  approveSelected(): void {
    if (this.selectedCases.length === 0) {
      this.toastr.warning('Please select at least one case paper to approve');
      return;
    }

    if (confirm(`Are you sure you want to approve ${this.selectedCases.length} case paper(s)?`)) {
      this.loadingMaterials = true;
      
      // Simulate API call - replace with your actual approval endpoint
      this.api.post('CasePaper/ApproveCasePapers', { trnNumbers: this.selectedCases }).subscribe({
        next: (res: any) => {
          this.toastr.success(`Successfully approved ${this.selectedCases.length} case paper(s)`);
          this.selectedCases = [];
          this.loadMaterials();
        },
        error: (err) => {
          console.error('Approval error:', err);
          this.toastr.error('Failed to approve case papers');
          this.loadingMaterials = false;
        }
      });
    }
  }

  rejectSelected(): void {
    if (this.selectedCases.length === 0) {
      this.toastr.warning('Please select at least one case paper to reject');
      return;
    }

    const reason = prompt('Please enter reason for rejection:');
    if (reason === null) return; // User cancelled

    if (reason && reason.trim().length > 0) {
      if (confirm(`Are you sure you want to reject ${this.selectedCases.length} case paper(s)?`)) {
        this.loadingMaterials = true;
        
        // Simulate API call - replace with your actual rejection endpoint
        this.api.post('CasePaper/RejectCasePapers', { 
          trnNumbers: this.selectedCases, 
          reason: reason.trim() 
        }).subscribe({
          next: (res: any) => {
            this.toastr.success(`Successfully rejected ${this.selectedCases.length} case paper(s)`);
            this.selectedCases = [];
            this.loadMaterials();
          },
          error: (err) => {
            console.error('Rejection error:', err);
            this.toastr.error('Failed to reject case papers');
            this.loadingMaterials = false;
          }
        });
      }
    } else {
      this.toastr.warning('Please provide a reason for rejection');
    }
  }

  // View case paper details
  viewCasePaper(trnNo: number): void {
    this.openInlineForm(trnNo, 'V'); // 'V' for view mode
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
    this.discount();
  }

  removeTest(srno: number) {
    this.matIs = this.matIs.filter((item: any) => item.sR_NO !== Number(srno));

    this.matIs = this.matIs.map((item: any, index: number) => ({
      ...item,
      sR_NO: index + 1,
    }));

    this.testAmount();
    this.discount();
  }

  load() {
    const { start, end } = this.service.getCurrentMonthRange();
    this.startDate = start;
    this.endDate = end;
    this.loadMaterials();

    this.api.get('Test/Tests').subscribe((res: any) => {
      this.tests = res;
    });

    this.api.get('Doctor/Doctors').subscribe((res: any) => {
      this.doctor = res;
    });
  }

  loadMaterials() {
    const startDate = 20200101;   // yyyyMMdd
    const endDate = 20500101;     // yyyyMMdd
    this.loadingMaterials = true;
    this.api.get(`CasePaper/GetDateWiseCasePaper/${startDate},${endDate}`).subscribe({
      next: (res: any) => {
        console.log(res);
        this.cases = res;
        // Filter to show only pending cases (adjust condition as needed)
        this.filtered = this.cases.filter((casePaper: CasePaper) => 
          casePaper.paymenT_STATUS !== 'COMPLETED' || !casePaper.paymenT_STATUS
        );
      },
      error: () => this.toastr.error('Failed to load materials'),
      complete: () => this.loadingMaterials = false
    });
  }

  filteredCases(): CasePaper[] {
    if (!this.cases) return [];
    
    let filtered = this.cases;
    
    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(casePaper =>
        casePaper.patienT_NAME.toLowerCase().includes(term) ||
        casePaper.coN_NUMBER.includes(term) ||
        casePaper.crT_BY.toLowerCase().includes(term)
      );
    }
    
    // Filter by date range if applicable
    if (this.isDateFiltered && this.startDate && this.endDate) {
      filtered = filtered.filter(casePaper => {
        const caseDate = new Date(casePaper.date);
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        return caseDate >= start && caseDate <= end;
      });
    }
    
    return filtered;
  }

  onPaymentAmountChange(): void {
    const totalAmount = +this.data.get('totaL_AMOUNT')?.value || 0;
    let paymentAmount = this.data.get('paymenT_AMOUNT')?.value;

    if (paymentAmount === null || paymentAmount === undefined || paymentAmount === '') {
      paymentAmount = 0;
      this.data.get('paymenT_AMOUNT')?.setValue(0);
    }

    paymentAmount = +paymentAmount;
    const tolerance = 1;

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

    if (this.trn_no && this.btn === 'E') {
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
    }
  }

  cancelCreate() {
    this.isCreatingNew = false;
    this.data.reset();
    this.matIs = [];
    this.test_Amount = 0;
    this.total_Amount = 0;
    this.total_test_LabPrice = 0;
    this.total_Lab_Profit = 0;
    this.selectedCases = []; // Clear selection when closing form
  }

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

    this.data.get('totaL_AMOUNT')?.setValue(this.total_Amount);
    this.data.get('totaL_PROFIT')?.setValue(this.total_Lab_Profit);

    this.onPaymentAmountChange();
  }

  getDoctorName(doctorCode: string): string {
    const doc = this.doctor.find((d: any) => d.doctoR_CODE === doctorCode);
    return doc ? doc.doctoR_NAME : 'N/A';
  }

  getDataById(trN_NO: number, btn: string) {
    this.btn = btn;
    this.api.get('CasePaper/CasePaper/' + trN_NO).subscribe((res: any) => {
      this.trn_no = res.trN_NO;

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

      this.matIs = res.matIs.map((item: any) => ({
        ...item,
        TEST_NAME: this.getTestNameByCode(item.tesT_CODE)
      }));

      this.testAmount();
      this.discount();
      this.total();
      this.onPaymentAmountChange();
    });
  }

  resetCasepaperForm() {
    this.isCreatingNew = true;
    this.btn = '';
    this.trn_no = 0;
    this.searchText = '';
    this.selectedDoctor = null;
    this.discount_Amount = 0;
    this.total_Amount = 0;
    this.total_Lab_Profit = 0;
    this.matIs = [];
    this.selectedCases = [];

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
      date: '',
      coM_ID: 101,
      paymenT_STATUS: '',
      crT_BY: ''
    });
  }
}