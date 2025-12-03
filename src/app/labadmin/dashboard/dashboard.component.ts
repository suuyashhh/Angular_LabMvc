import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ServicesService } from '../../shared/services.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  user: any;

  dashboardCount: any = {
    patienT_COUNT: 0,
    homE_COLLECTION: 0,
    pendinG_STATUS: 0,
    totaL_BILL: 0
  };

  startDate!: string;
  endDate!: string;
  isLoading = true;

  constructor(private api: ApiService, private service: ServicesService, private auth: AuthService, private loader: LoaderService) { }

  ngOnInit(): void {
    // Set both start and end dates to today's date
    this.setTodayAsDateRange();

    // Use setTimeout to ensure dates are properly bound before loading data
    setTimeout(() => {
      this.load();
    });

    this.user = this.auth.getUser();
  }

  // Method to set both start and end dates to today
  setTodayAsDateRange() {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    const todayFormatted = `${year}-${month}-${day}`;

    this.startDate = todayFormatted;
    this.endDate = todayFormatted;
  }

  ngAfterViewInit(): void {
    this.setupAnimations();
  }

  load() {
    if (!this.startDate || !this.endDate) {
      console.error('Start date or end date is missing');
      return;
    }

    this.isLoading = true;

    const formattedStartDate = this.service.formatDate(this.startDate, 1);
    const formattedEndDate = this.service.formatDate(this.endDate, 1);

    console.log('Loading data with dates:', {
      startDate: this.startDate,
      endDate: this.endDate,
      formattedStartDate,
      formattedEndDate
    });

    this.loader.show();

    this.api.get('Home/Home/' + formattedStartDate + ',' + formattedEndDate)
      .subscribe({
        next: (res: any) => {
          this.dashboardCount = res;
          this.isLoading = false;
          this.loader.hide();

          // Animate counters after data loads
          setTimeout(() => {
            this.animateAllCounters();
          }, 100);
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.isLoading = false;
          // hide loader on error
          this.loader.hide();
        },
        complete: () => {
          this.loader.hide();
        }
      });
  }

  onDateChange() {
    console.log('Date changed:', {
      startDate: this.startDate,
      endDate: this.endDate
    });

    if (this.startDate && this.endDate) {
      this.load();
    }
  }

  // ... rest of your methods remain the same
  setupAnimations() {
    // Card animations
    const cards = document.querySelectorAll<HTMLElement>('.stat-card, .partner-card');
    cards.forEach((card, index) => {
      card.classList.add('loading');
      card.style.animationDelay = `${index * 100}ms`;
    });

    // Hover effect
    document.querySelectorAll<HTMLElement>('.stat-card').forEach((card) => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });

    // Click effect
    document.querySelectorAll<HTMLElement>('.stat-card, .partner-card').forEach((card) => {
      card.addEventListener('click', () => {
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      });
    });
  }

  animateAllCounters() {
    const counters = document.querySelectorAll<HTMLElement>('.stat-number[data-target]');
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-target') || '0');
      if (!isNaN(target)) {
        this.animateCounter(counter, target);
      }
    });
  }

  animateCounter(element: HTMLElement, target: number, duration = 1500) {
    let start = 0;
    const increment = Math.ceil(target / (duration / 30));

    const updateCounter = () => {
      start += increment;
      if (start >= target) {
        element.innerText = target.toString();
      } else {
        element.innerText = start.toString();
        requestAnimationFrame(updateCounter);
      }
    };

    updateCounter();
  }

  refreshStats(): void {
    const counters = document.querySelectorAll<HTMLElement>('.stat-number[data-target]');
    counters.forEach((counter) => {
      const currentTarget = parseInt(counter.getAttribute('data-target') || '0');
      const newTarget = Math.floor(currentTarget * (0.8 + Math.random() * 0.4));
      counter.setAttribute('data-target', newTarget.toString());
      this.animateCounter(counter, newTarget, 1000);
    });
  }
}