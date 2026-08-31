import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodItem } from '../../models/interfaces';
import { FOOD_EMOJI_MAP } from '../../models/mock-data';
import { FoodService } from '../../services/food.service';

@Component({
  selector: 'app-food-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-master.component.html',
  styleUrls: ['./food-master.component.css']
})
export class FoodMasterComponent implements OnInit {
  foods: FoodItem[] = [];
  showSheet = false;
  editingFood: FoodItem | null = null;

  formName = '';
  formPrice = 0;
  formCategory = '';
  formActive = true;
  formImage = '';

  constructor(private foodService: FoodService) {}

  ngOnInit(): void {
    this.foodService.items$.subscribe(items => {
      this.foods = items;
    });
  }

  getEmoji(name: string): string {
    return FOOD_EMOJI_MAP[name] || '🍽️';
  }

  toggleActive(food: FoodItem): void {
    food.active = !food.active;
    this.foodService.update(food);
  }

  deleteFood(food: FoodItem): void {
    if (confirm(`Delete "${food.name}"?`)) {
      this.foodService.delete(food.id);
    }
  }

  openAddSheet(): void {
    this.editingFood = null;
    this.formName = '';
    this.formPrice = 0;
    this.formCategory = '';
    this.formActive = true;
    this.formImage = '';
    this.showSheet = true;
  }

  openEditSheet(food: FoodItem): void {
    this.editingFood = food;
    this.formName = food.name;
    this.formPrice = food.price;
    this.formCategory = food.category;
    this.formActive = food.active;
    this.formImage = food.image;
    this.showSheet = true;
  }

  closeSheet(): void {
    this.showSheet = false;
    this.editingFood = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.formImage = e.target?.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  saveForm(): void {
    if (!this.formName || !this.formCategory) return;

    if (this.editingFood) {
      // Update existing
      const updated: FoodItem = {
        ...this.editingFood,
        name: this.formName,
        price: this.formPrice,
        category: this.formCategory,
        active: this.formActive,
        image: this.formImage
      };
      this.foodService.update(updated);
    } else {
      // Add new
      this.foodService.add({
        name: this.formName,
        price: this.formPrice,
        category: this.formCategory,
        active: this.formActive,
        image: this.formImage
      });
    }

    this.closeSheet();
  }
}
