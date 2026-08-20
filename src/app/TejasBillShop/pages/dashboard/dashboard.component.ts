import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { TopSellingItem } from '../../models/interfaces';
import { FOOD_EMOJI_MAP } from '../../models/mock-data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  todaysSales = 0;
  todaysBillCount = 0;
  avgOrderValue = 0;
  topSelling: TopSellingItem[] = [];

  constructor(private billing: BillingService) {}

  ngOnInit(): void {
    this.billing.bills$.subscribe(() => {
      this.todaysSales = this.billing.getTodaysSales();
      this.todaysBillCount = this.billing.getTodaysBillCount();
      this.avgOrderValue = this.billing.getAvgOrderValue();
      this.topSelling = this.billing.getTopSelling(7);
    });
  }

  getEmoji(name: string): string {
    return FOOD_EMOJI_MAP[name] || '🍽️';
  }
}
