import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Bill, BillItem, FoodItem } from '../../models/interfaces';
import { FOOD_EMOJI_MAP } from '../../models/mock-data';
import { BillingService } from '../../services/billing.service';
import { FoodService } from '../../services/food.service';
import { PrinterService } from '../../services/printer.service';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bill-detail.component.html',
  styleUrls: ['./bill-detail.component.css']
})
export class BillDetailComponent implements OnInit {
  bill: Bill | null = null;
  showUpdated = false;
  showAddSheet = false;
  isPrinterConnected = false;
  printMessage = '';

  // Add Items sheet state
  allFoods: FoodItem[] = [];
  filteredAvailableItems: FoodItem[] = [];
  categories: string[] = [];
  selectedCategory = 'All';
  searchQuery = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private billing: BillingService,
    private foodService: FoodService,
    private printer: PrinterService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bill = this.billing.getBillById(id) || null;
      if (this.bill) {
        // Deep clone so edits don't mutate until save
        this.bill = JSON.parse(JSON.stringify(this.bill));
        this.recalc();
      }
    }

    // Load food items for the "Add Items" sheet
    this.foodService.items$.subscribe(items => {
      this.allFoods = items.filter(f => f.active);
      this.categories = this.foodService.getCategories();
      this.filterAvailableItems();
    });

    this.printer.connected$.subscribe(c => this.isPrinterConnected = c);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  getEmoji(name: string): string {
    return FOOD_EMOJI_MAP[name] || '🍽️';
  }

  changeQty(index: number, delta: number): void {
    if (!this.bill) return;
    this.bill.items[index].quantity += delta;
    if (this.bill.items[index].quantity <= 0) {
      this.bill.items.splice(index, 1);
    }
    this.recalc();
  }

  private recalc(): void {
    if (!this.bill) return;
    this.bill.subtotal = this.bill.items.reduce((s, i) => s + i.price * i.quantity, 0);
    this.bill.grandTotal = this.bill.subtotal;
  }

  updateBill(): void {
    if (!this.bill) return;
    this.billing.updateBill(this.bill);
    this.showUpdated = true;
  }

  deleteBill(): void {
    if (!this.bill) return;
    if (confirm('Delete this bill?')) {
      this.billing.deleteBill(this.bill.id);
      this.router.navigate(['/tejas/entries']);
    }
  }

  goBack(): void {
    this.router.navigate(['/tejas/entries']);
  }

  async printBill(): Promise<void> {
    if (!this.bill) return;
    const result = await this.printer.printBill(this.bill);
    if (result === 'not_connected') {
      this.printMessage = '⚠ Printer is not connected!';
    } else if (result === 'success') {
      this.printMessage = '✓ Sent to printer!';
    } else {
      this.printMessage = '✗ Print failed';
    }
    setTimeout(() => this.printMessage = '', 4000);
  }

  // ── Add Items Sheet ──

  openAddItemsSheet(): void {
    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.filterAvailableItems();
    this.showAddSheet = true;
  }

  closeAddItemsSheet(): void {
    this.showAddSheet = false;
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
    this.filterAvailableItems();
  }

  filterAvailableItems(): void {
    let items = this.allFoods;

    // Filter by category
    if (this.selectedCategory !== 'All') {
      items = items.filter(f => f.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      items = items.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }

    this.filteredAvailableItems = items;
  }

  isInBill(foodId: string): boolean {
    return !!this.bill?.items.some(i => i.foodId === foodId);
  }

  addItemToBill(food: FoodItem): void {
    if (!this.bill) return;

    // Check if already exists (shouldn't, but safety)
    const existing = this.bill.items.find(i => i.foodId === food.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.bill.items.push({
        foodId: food.id,
        name: food.name,
        price: food.price,
        quantity: 1,
        image: food.image
      });
    }

    this.recalc();
  }
}
