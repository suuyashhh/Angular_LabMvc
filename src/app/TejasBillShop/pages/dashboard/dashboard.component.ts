import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BillingService } from '../../services/billing.service';
import { FoodService } from '../../services/food.service';
import { AuthService } from '../../../shared/auth.service';
import { ApiService } from '../../../shared/api.service';
import { TopSellingItem, FoodItem } from '../../models/interfaces';
import { FOOD_EMOJI_MAP } from '../../models/mock-data';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  todaysSales = 0;
  todaysBillCount = 0;
  avgOrderValue = 0;
  totalExpenses = 0;
  topSelling: TopSellingItem[] = [];
  allFoods: FoodItem[] = [];
  isAdmin = false;
  userImage: string | null = null;

  showFilterModal = false;
  startDate: string = '';
  endDate: string = '';
  dateRangeText = '7 days';

  private subs: Subscription[] = [];

  constructor(private billing: BillingService, private foodService: FoodService, private auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    const today = new Date();
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    this.startDate = fmt(today);
    this.endDate = fmt(today);

    const user = this.auth.getTejasCredentialsFromCookie();
    this.isAdmin = user && user.role && user.role.toLowerCase() === 'admin';
    this.userImage = user?.user_img || null;

    this.subs.push(
      this.foodService.items$.subscribe(items => {
        this.allFoods = items;
        this.patchTopSellingImages();
      }),
      this.billing.bills$.subscribe(() => {
        // Re-apply filter if bills change (e.g. new bill created)
        if (this.dateRangeText === 'Today') {
          this.applyDashboardFilter();
        }
      })
    );

    this.applyDashboardFilter();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  applyDashboardFilter(): void {
    const startStr = `${this.startDate}T00:00:00`;
    const endStr = `${this.endDate}T23:59:59`;

    const todayStr = new Date().toISOString().split('T')[0];
    if (this.startDate === todayStr && this.endDate === todayStr) {
      this.dateRangeText = 'Today';
    } else if (this.startDate === this.endDate) {
      this.dateRangeText = 'Selected Date';
    } else {
      this.dateRangeText = 'Custom Range';
    }

    this.billing.fetchBillsByDateRange(startStr, endStr).subscribe(bills => {
      this.todaysBillCount = bills.length;
      this.todaysSales = bills.reduce((sum, b) => sum + b.grandTotal, 0);
      this.avgOrderValue = bills.length > 0 ? this.todaysSales / bills.length : 0;
      
      this.topSelling = this.billing.getTopSellingFromBills(bills);
      this.patchTopSellingImages();
      this.showFilterModal = false;
    });

    // Fetch expenses for the same date range
    const tejasUser = this.auth.getTejasCredentialsFromCookie();
    if (tejasUser && tejasUser.userId) {
      this.api.get('TejasEntry/GetAllTypesEntrys', { 
        userId: tejasUser.userId,
        fromDate: this.startDate,
        toDate: this.endDate
      }).subscribe({
        next: (res: any) => {
          const entries = Array.isArray(res) ? res : [];
          this.totalExpenses = entries.reduce((sum, entry) => sum + (entry.price || 0), 0);
        },
        error: (err: any) => {
          console.error('Error fetching expenses for dashboard:', err);
          this.totalExpenses = 0;
        }
      });
    }
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  patchTopSellingImages() {
    if (this.allFoods.length && this.topSelling.length) {
      this.topSelling.forEach(item => {
        if (!item.image) {
          const food = this.allFoods.find(f => f.name === item.name);
          if (food && food.image) {
            item.image = food.image;
          }
        }
      });
    }
  }

  getEmoji(name: string): string {
    return FOOD_EMOJI_MAP[name] || '🍽️';
  }

  logout() {
    this.auth.tejasLogout();
  }
}
