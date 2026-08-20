import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FoodItem, CartItem, Bill } from '../../models/interfaces';
import { FOOD_EMOJI_MAP } from '../../models/mock-data';
import { FoodService } from '../../services/food.service';
import { BillingService } from '../../services/billing.service';
import { PrinterService } from '../../services/printer.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent implements OnInit, OnDestroy {
  allFoods: FoodItem[] = [];
  filteredFoods: FoodItem[] = [];
  categories: string[] = [];
  selectedCategory = 'All';
  cart: CartItem[] = [];
  cartTotal = 0;
  cartCount = 0;

  showCartSheet = false;
  showSavedSheet = false;
  savedBill: Bill | null = null;

  private subs: Subscription[] = [];

  constructor(
    private foodService: FoodService,
    private billing: BillingService,
    private printer: PrinterService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.foodService.items$.subscribe(items => {
        this.allFoods = items.filter(f => f.active);
        this.categories = this.foodService.getCategories();
        this.filterProducts();
      }),
      this.billing.cart$.subscribe(cart => {
        this.cart = cart;
        this.cartTotal = this.billing.getCartTotal();
        this.cartCount = this.billing.getCartCount();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
    this.filterProducts();
  }

  private filterProducts(): void {
    if (this.selectedCategory === 'All') {
      this.filteredFoods = [...this.allFoods];
    } else {
      this.filteredFoods = this.allFoods.filter(f => f.category === this.selectedCategory);
    }
  }

  addToCart(food: FoodItem): void {
    this.billing.addToCart(food);
  }

  getCartQty(foodId: string): number {
    const item = this.cart.find(c => c.food.id === foodId);
    return item ? item.quantity : 0;
  }

  getEmoji(name: string): string {
    return FOOD_EMOJI_MAP[name] || '🍽️';
  }

  changeQty(foodId: string, delta: number): void {
    this.billing.updateQuantity(foodId, delta);
  }

  openCartSheet(): void {
    this.showCartSheet = true;
  }

  closeCartSheet(): void {
    this.showCartSheet = false;
  }

  saveBill(): void {
    if (this.cart.length === 0) return;
    this.savedBill = this.billing.saveBill();
    this.showCartSheet = false;
    this.showSavedSheet = true;
  }

  closeSavedSheet(): void {
    this.showSavedSheet = false;
    this.savedBill = null;
  }

  printBill(): void {
    if (this.savedBill) {
      this.printer.printBill(this.savedBill);
    }
  }

  editSavedBill(): void {
    if (this.savedBill) {
      this.billing.loadBillIntoCart(this.savedBill, this.allFoods);
      this.showSavedSheet = false;
      this.showCartSheet = true;
    }
  }

  newBill(): void {
    this.billing.clearCart();
    this.showSavedSheet = false;
    this.savedBill = null;
  }
}
