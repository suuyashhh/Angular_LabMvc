import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
export class BillDetailComponent implements OnInit, OnDestroy {
  bill: Bill | null = null;
  showUpdated = false;
  showAddSheet = false;
  isPrinterConnected = false;
  printMessage = '';

  billDateTime: string = '';
  isEditMode = false;
  showDeleteModal = false;
  isDeleting = false;

  // Add Items sheet state
  allFoods: FoodItem[] = [];
  filteredAvailableItems: FoodItem[] = [];
  categories: string[] = [];
  selectedCategory = 'All';
  searchQuery = '';
  private subs: Subscription[] = [];

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
      const existing = this.billing.getBillById(id);
      if (existing) {
        // Deep clone so edits don't mutate until save
        this.bill = JSON.parse(JSON.stringify(existing));
        this.syncDateTime();
        this.recalc();
      } else {
        this.billing.fetchBillById(id).subscribe({
          next: (b) => {
            if (b) {
              this.bill = JSON.parse(JSON.stringify(b));
              this.syncDateTime();
              this.recalc();
            }
          },
          error: (err) => console.error('Error fetching bill:', err)
        });
      }
    }

    // Load food items for the "Add Items" sheet
    this.subs.push(
      this.route.queryParams.subscribe(params => {
        this.isEditMode = params['edit'] === 'true' || params['edit'] === true;
      }),
      this.foodService.items$.subscribe(items => {
        this.allFoods = items.filter(f => f.active);
        this.categories = this.foodService.getCategories();
        this.filterAvailableItems();

        // Patch images back into bill items
        if (this.bill && this.bill.items) {
          this.bill.items.forEach(bi => {
            if (!bi.image) {
              const food = items.find(f => f.id === bi.foodId);
              if (food && food.image) {
                bi.image = food.image;
              }
            }
          });
        }
      }),
      this.printer.connected$.subscribe(c => this.isPrinterConnected = c)
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
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
    if (!this.bill || !this.isEditMode) return;
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

  private syncDateTime(): void {
    if (!this.bill?.createdAt) return;
    const d = new Date(this.bill.createdAt);
    if (isNaN(d.getTime())) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    this.billDateTime = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  onDateTimeChange(val: string): void {
    if (!this.isEditMode) return;
    this.billDateTime = val;
    if (this.bill && val) {
      this.bill.createdAt = val.length === 16 ? `${val}:00` : val;
    }
  }

  updateBill(): void {
    if (!this.bill || !this.isEditMode) return;
    if (this.billDateTime) {
      this.bill.createdAt = this.billDateTime.length === 16 ? `${this.billDateTime}:00` : this.billDateTime;
    }
    this.billing.updateBill(this.bill);
    this.showUpdated = true;
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.isDeleting = false;
  }

  confirmDelete(): void {
    if (!this.bill) return;
    this.isDeleting = true;
    this.billing.deleteBill(this.bill.id);
    this.showDeleteModal = false;
    this.isDeleting = false;
    this.router.navigate(['/tejas/entries']);
  }

  deleteBill(): void {
    this.openDeleteModal();
  }

  goBack(): void {
    this.router.navigate(['/tejas/entries']);
  }

  async printBill(): Promise<void> {
    if (!this.bill) return;
    this.printMessage = 'Connecting & Printing...';
    try {
      const result = await this.printer.printBill(this.bill);
      if (result === 'not_connected') {
        this.printMessage = '⚠ Bluetooth printer scan cancelled or unavailable';
      } else if (result === 'success') {
        this.printMessage = '✓ Sent to printer!';
      } else {
        this.printMessage = '✗ Print failed — try again';
      }
    } catch (err) {
      this.printMessage = '✗ Print failed';
    }
    setTimeout(() => this.printMessage = '', 4000);
  }

  // ── Add Items Sheet ──

  openAddItemsSheet(): void {
    if (!this.isEditMode) return;
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
    if (!this.bill || !this.isEditMode) return;

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
