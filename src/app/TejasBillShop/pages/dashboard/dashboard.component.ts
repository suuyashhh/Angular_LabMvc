import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { FoodService } from '../../services/food.service';
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
export class DashboardComponent implements OnInit {
  todaysSales = 0;
  todaysBillCount = 0;
  avgOrderValue = 0;
  topSelling: TopSellingItem[] = [];
  allFoods: FoodItem[] = [];

  showFilterModal = false;
  startDate: string = '';
  endDate: string = '';
  dateRangeText = '7 days';

  constructor(private billing: BillingService, private foodService: FoodService) {}

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

    this.foodService.items$.subscribe(items => {
      this.allFoods = items;
      this.patchTopSellingImages();
    });

    this.billing.bills$.subscribe(() => {
      // Re-apply filter if bills change (e.g. new bill created)
      if (this.dateRangeText === 'Today') {
        this.applyDashboardFilter();
      }
    });

    this.applyDashboardFilter();
  }

  applyDashboardFilter(): void {
    const start = new Date(this.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);

    const todayStr = new Date().toISOString().split('T')[0];
    if (this.startDate === todayStr && this.endDate === todayStr) {
      this.dateRangeText = 'Today';
    } else if (this.startDate === this.endDate) {
      this.dateRangeText = 'Selected Date';
    } else {
      this.dateRangeText = 'Custom Range';
    }

    this.billing.fetchBillsByDateRange(start.toISOString(), end.toISOString()).subscribe(bills => {
      this.todaysBillCount = bills.length;
      this.todaysSales = bills.reduce((sum, b) => sum + b.grandTotal, 0);
      this.avgOrderValue = bills.length > 0 ? this.todaysSales / bills.length : 0;
      
      this.topSelling = this.billing.getTopSellingFromBills(bills);
      this.patchTopSellingImages();
      this.showFilterModal = false;
    });
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
}
