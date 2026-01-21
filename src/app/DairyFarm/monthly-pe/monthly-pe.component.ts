// monthly-pe.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

// Interface for Monthly PE Data
export interface MonthlyPEModel {
  displayMonth: string;
  totalBill: number;
  totalExpense: number;
  profit: number;
  profitColor: string;
}

@Component({
  selector: 'app-monthly-pe',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './monthly-pe.component.html',
  styleUrl: './monthly-pe.component.css'
})
export class MonthlyPeComponent  implements OnInit, OnDestroy {
  @ViewChild('headerImg') headerImg!: ElementRef;
  @ViewChild('headerTitle') headerTitle!: ElementRef;

  // Data
  monthlyData: MonthlyPEModel[] = [];
  
  // State
  dairyUserId: number = 0;
  isLoading: boolean = false;
  isHeaderAnimated: boolean = false;
  
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
    this.loadMonthlyData();
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

  loadMonthlyData(): void {
    if (!this.dairyUserId) {
      this.toastr.warning('Please login to view monthly summary');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const subscription = this.http.get(`MonthlyPE/Summary/${this.dairyUserId}`)
      .pipe(
        finalize(() => {
          this.loader.hide();
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.monthlyData = response;
            // Trigger animations after data is loaded
            setTimeout(() => {
              this.animateHeader();
              this.animateMonthBoxes();
            }, 100);
          } else {
            this.monthlyData = [];
            this.toastr.warning('No monthly data available');
          }
        },
        error: (error: any) => {
          console.error('Failed to load monthly summary:', error);
          this.toastr.error('Failed to load monthly summary data');
          this.monthlyData = [];
        }
      });

    this.subscriptions.add(subscription);
  }

  animateHeader(): void {
    if (this.isHeaderAnimated) return;
    
    this.isHeaderAnimated = true;
    
    // Add animation classes after a small delay
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

  animateMonthBoxes(): void {
    // Wait for DOM to render the month boxes
    setTimeout(() => {
      const monthBoxes = document.querySelectorAll('.month-box');
      monthBoxes.forEach((box, index) => {
        setTimeout(() => {
          box.classList.add('active');
        }, index * 300);
      });
    }, 500);
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '₹ 0';
    
    // Format with Indian Rupee symbol and commas
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
    
    return `₹ ${formatted}`;
  }

  navigateBack(): void {
    // Check if we can go back in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to dashboard
      this.router.navigate(['/dairyfarm/webpage']);
    }
  }

  // Handle browser back button
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any): void {
    this.router.navigate(['/dairyfarm/webpage']);
  }
}





