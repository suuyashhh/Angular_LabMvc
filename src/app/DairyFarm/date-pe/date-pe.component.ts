// date-pe.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

// Interface for Date PE Data
export interface DatePEModel {
  displayDateRange: string;
  fromDate: string;
  toDate: string;
  totalBill: number;
  totalExpense: number;
  profit: number;
  profitColor: string;
}

@Component({
  selector: 'app-date-pe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './date-pe.component.html',
  styleUrls: ['./date-pe.component.css']
})
export class DatePEComponent implements OnInit, OnDestroy {
  @ViewChild('headerImg') headerImg!: ElementRef;
  @ViewChild('headerTitle') headerTitle!: ElementRef;

  // Form
  dateForm!: FormGroup;
  
  // Data
  datePEData: DatePEModel | null = null;
  
  // State
  dairyUserId: number = 0;
  isLoading: boolean = false;
  isSearching: boolean = false;
  isHeaderAnimated: boolean = false;
  submitted: boolean = false;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private http: ApiService,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    if (!this.auth.isDairyLoggedIn()) {
      this.router.navigate(['/dairyfarm']);
      return;
    }

    this.dairyUserId = this.getDairyUserId();
    this.initForm();
    this.loadDefaultDateRange();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private getDairyUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }

  initForm(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.dateForm = new FormGroup({
      fromDate: new FormControl(firstDay.toISOString().split('T')[0], [Validators.required]),
      toDate: new FormControl(lastDay.toISOString().split('T')[0], [Validators.required])
    });
  }

  loadDefaultDateRange(): void {
    if (!this.dairyUserId) {
      this.toastr.warning('Please login to view date range summary');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const subscription = this.http.get(`DatePE/DefaultRange/${this.dairyUserId}`)
      .pipe(
        finalize(() => {
          this.loader.hide();
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.datePEData = response;
            this.dateForm.patchValue({
              fromDate: response.fromDate,
              toDate: response.toDate
            });
            
            // Trigger animations after data is loaded
            setTimeout(() => {
              this.animateHeader();
              this.animateMonthBox();
            }, 100);
          }
        },
        error: (error: any) => {
          console.error('Failed to load default date range:', error);
          this.toastr.error('Failed to load date range summary');
          this.datePEData = null;
        }
      });

    this.subscriptions.add(subscription);
  }

  searchDateRange(): void {
    this.submitted = true;

    if (this.dateForm.invalid) {
      this.toastr.error('Please select valid dates');
      return;
    }

    const fromDate = new Date(this.dateForm.value.fromDate);
    const toDate = new Date(this.dateForm.value.toDate);

    if (fromDate > toDate) {
      this.toastr.warning('From Date cannot be later than To Date');
      return;
    }

    this.isSearching = true;
    this.loader.show();

    const payload = {
      userId: this.dairyUserId,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString()
    };

    const subscription = this.http.post('DatePE/Summary', payload)
      .pipe(
        finalize(() => {
          this.loader.hide();
          this.isSearching = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.datePEData = response;
            this.animateMonthBox();
            this.toastr.success('Date range summary loaded successfully');
          }
        },
        error: (error: any) => {
          console.error('Failed to search date range:', error);
          this.toastr.error('Failed to load date range summary');
        }
      });

    this.subscriptions.add(subscription);
  }

  animateHeader(): void {
    if (this.isHeaderAnimated) return;
    
    this.isHeaderAnimated = true;
    
    setTimeout(() => {
      const img = this.headerImg?.nativeElement;
      const title = this.headerTitle?.nativeElement;
      
      if (img) {
        img.style.transition = 'transform 1s ease-in-out';
        img.style.transform = 'translateX(0)';
      }
      
      if (title) {
        title.style.transition = 'transform 1s ease-in-out 0.2s';
        title.style.transform = 'translateX(0)';
      }
    }, 300);
  }

  animateMonthBox(): void {
    // Reset animation first
    const monthBox = document.querySelector('.month-box');
    if (monthBox) {
      monthBox.classList.remove('active');
      
      setTimeout(() => {
        monthBox.classList.add('active');
      }, 100);
    }
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '₹ 0';
    
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
    
    return `₹ ${formatted}`;
  }

  navigateBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/dairyfarm/webpage']);
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: any): void {
    this.router.navigate(['/dairyfarm/webpage']);
  }
}