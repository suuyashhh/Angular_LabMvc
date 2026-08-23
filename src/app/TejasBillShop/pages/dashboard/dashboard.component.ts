import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { FoodService } from '../../services/food.service';
import { TopSellingItem, FoodItem } from '../../models/interfaces';
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
  allFoods: FoodItem[] = [];

  constructor(private billing: BillingService, private foodService: FoodService) {}

  ngOnInit(): void {
    this.foodService.items$.subscribe(items => {
      this.allFoods = items;
      this.patchTopSellingImages();
    });

    this.billing.bills$.subscribe(() => {
      this.todaysSales = this.billing.getTodaysSales();
      this.todaysBillCount = this.billing.getTodaysBillCount();
      this.avgOrderValue = this.billing.getAvgOrderValue();
      this.topSelling = this.billing.getTopSelling(7);
      this.patchTopSellingImages();
    });
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
