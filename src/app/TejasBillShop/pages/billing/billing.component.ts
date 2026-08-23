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
  isPrinterConnected = false;
  isPrinting = false;
  printMessage = '';

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
      }),
      this.printer.connected$.subscribe(c => this.isPrinterConnected = c)
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

  async printBill(): Promise<void> {
    if (!this.savedBill) return;
    this.isPrinting = true;
    this.printMessage = '';
    try {
      const result = await this.printer.printBill(this.savedBill);
      if (result === 'not_connected') {
        this.printMessage = '⚠ Printer is not connected! Go to Printer page to connect.';
      } else if (result === 'success') {
        this.printMessage = '✓ Sent to printer!';
      } else {
        this.printMessage = '✗ Print failed — try reconnecting';
      }
    } catch (err) {
      this.printMessage = '✗ Print failed';
    }
    this.isPrinting = false;
    setTimeout(() => this.printMessage = '', 4000);
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
