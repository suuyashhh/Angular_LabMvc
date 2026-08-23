import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CartItem, Bill, BillItem, FoodItem, TopSellingItem } from '../models/interfaces';
import { StorageService } from './storage.service';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

const COUNTER_KEY = 'bc_bill_counter';
const COUNTER_DATE_KEY = 'bc_bill_counter_date';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  private billsSubject = new BehaviorSubject<Bill[]>([]);
  bills$ = this.billsSubject.asObservable();
  private apiUrl: string;

  constructor(private storage: StorageService, private http: HttpClient, private apiService: ApiService, private loader: LoaderService) {
    this.apiUrl = this.apiService.baseUrl + 'TejasBilling';
    this.loadBills();
  }

  // ── Cart ──

  getCart(): CartItem[] {
    return this.cartSubject.getValue();
  }

  addToCart(food: FoodItem): void {
    const cart = this.getCart();
    const existing = cart.find(c => c.food.id === food.id);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ food, quantity: 1 });
    }
    this.cartSubject.next([...cart]);
  }

  updateQuantity(foodId: string, delta: number): void {
    let cart = this.getCart();
    const item = cart.find(c => c.food.id === foodId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        cart = cart.filter(c => c.food.id !== foodId);
      }
    }
    this.cartSubject.next([...cart]);
  }

  setQuantity(foodId: string, qty: number): void {
    let cart = this.getCart();
    if (qty <= 0) {
      cart = cart.filter(c => c.food.id !== foodId);
    } else {
      const item = cart.find(c => c.food.id === foodId);
      if (item) item.quantity = qty;
    }
    this.cartSubject.next([...cart]);
  }

  clearCart(): void {
    this.cartSubject.next([]);
  }

  getCartTotal(): number {
    return this.getCart().reduce((sum, c) => sum + c.food.price * c.quantity, 0);
  }

  getCartCount(): number {
    return this.getCart().reduce((sum, c) => sum + c.quantity, 0);
  }

  // ── Bills ──

  private loadBills(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    this.loader.withLoader(this.http.get<Bill[]>(`${this.apiUrl}?startDate=${today.toISOString()}&endDate=${end.toISOString()}`)).subscribe(bills => {
      this.billsSubject.next(bills);
    });
  }

  fetchBillsByDateRange(startDate: string, endDate: string): Observable<Bill[]> {
    return this.loader.withLoader(this.http.get<Bill[]>(`${this.apiUrl}?startDate=${startDate}&endDate=${endDate}`));
  }

  getAllBills(): Bill[] {
    return this.billsSubject.getValue();
  }

  getBillById(id: string): Bill | undefined {
    return this.getAllBills().find(b => b.id === id);
  }

  generateBillNumber(): string {
    let counter = (this.storage.get<number>(COUNTER_KEY) || 0) + 1;
    this.storage.set(COUNTER_KEY, counter);
    return 'BR' + counter;
  }

  saveBill(): Promise<Bill> {
    const cart = this.getCart();
    const items: BillItem[] = cart.map(c => ({
      foodId: c.food.id,
      name: c.food.name,
      price: c.food.price,
      quantity: c.quantity,
      image: '' // Empty string to prevent SQL truncation error if DB column is too small for base64
    }));

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const now = new Date().toISOString();

    const bill: Bill = {
      id: '',
      billNumber: this.generateBillNumber(),
      items,
      subtotal,
      grandTotal: subtotal,
      createdAt: now,
      updatedAt: now
    };

    const bills = this.getAllBills();
    
    return new Promise((resolve, reject) => {
      this.loader.withLoader(this.http.post<Bill>(this.apiUrl, bill)).subscribe({
        next: (savedBill) => {
          bills.unshift(savedBill);
          this.billsSubject.next([...bills]);
          this.clearCart();
          resolve(savedBill);
        },
        error: (err) => {
          console.error('Failed to save bill to DB', err);
          alert('Failed to save bill to database! Error: ' + (err.error?.title || err.error || err.message));
          reject(err);
        }
      });
    });
  }

  updateBill(updated: Bill): void {
    const toSave = JSON.parse(JSON.stringify(updated)) as Bill;
    toSave.items.forEach(i => i.image = '');
    
    toSave.subtotal = toSave.items.reduce((s, i) => s + i.price * i.quantity, 0);
    toSave.grandTotal = toSave.subtotal;
    toSave.updatedAt = new Date().toISOString();
    
    this.loader.withLoader(this.http.put<Bill>(`${this.apiUrl}/${toSave.id}`, toSave)).subscribe(() => {
      // Update local object so UI reflects totals/dates if needed
      updated.subtotal = toSave.subtotal;
      updated.grandTotal = toSave.grandTotal;
      updated.updatedAt = toSave.updatedAt;
      
      const bills = this.getAllBills().map(b => b.id === updated.id ? updated : b);
      this.billsSubject.next([...bills]);
    });
  }

  deleteBill(id: string): void {
    this.loader.withLoader(this.http.delete(`${this.apiUrl}/${id}`)).subscribe(() => {
      const bills = this.getAllBills().filter(b => b.id !== id);
      this.billsSubject.next([...bills]);
    });
  }

  // ── Dashboard Stats ──

  getTodaysBills(): Bill[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.getAllBills().filter(b => new Date(b.createdAt) >= today);
  }

  getTodaysSales(): number {
    return this.getTodaysBills().reduce((s, b) => s + b.grandTotal, 0);
  }

  getTodaysBillCount(): number {
    return this.getTodaysBills().length;
  }

  getAvgOrderValue(): number {
    const bills = this.getTodaysBills();
    if (bills.length === 0) return 0;
    return this.getTodaysSales() / bills.length;
  }

  getTopSellingFromBills(bills: Bill[]): TopSellingItem[] {
    const map = new Map<string, TopSellingItem>();
    for (const bill of bills) {
      if (!bill.items) continue; // safety check
      for (const item of bill.items) {
        const existing = map.get(item.name);
        if (existing) {
          existing.sold += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          map.set(item.name, {
            name: item.name,
            image: item.image,
            sold: item.quantity,
            revenue: item.price * item.quantity
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.sold - a.sold);
  }

  getTopSelling(days: number = 7): TopSellingItem[] {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const bills = this.getAllBills().filter(b => new Date(b.createdAt) >= since);
    return this.getTopSellingFromBills(bills);
  }

  // ── Load bill into cart for editing ──
  loadBillIntoCart(bill: Bill, foodItems: FoodItem[]): void {
    if (!bill.items) return;
    const cart: CartItem[] = bill.items.map(bi => {
      const food = foodItems.find(f => f.id === bi.foodId) || {
        id: bi.foodId,
        name: bi.name,
        price: bi.price,
        category: '',
        image: bi.image,
        active: true
      };
      return { food, quantity: bi.quantity };
    });
    this.cartSubject.next(cart);
  }
}
