import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CartItem, Bill, BillItem, FoodItem, TopSellingItem } from '../models/interfaces';
import { StorageService } from './storage.service';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';
import { TejasShopService } from './tejas-shop.service';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  private billsSubject = new BehaviorSubject<Bill[]>([]);
  bills$ = this.billsSubject.asObservable();
  private apiUrl: string;

  constructor(
    private storage: StorageService,
    private http: HttpClient,
    private apiService: ApiService,
    private loader: LoaderService,
    private shopService: TejasShopService
  ) {
    this.apiUrl = this.apiService.baseUrl + 'TejasBilling';
    this.loadBills();

    this.shopService.selectedShop$.subscribe(() => {
      this.clearCart();
      this.loadBills();
    });
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

  public loadBills(shopId?: number): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const sId = shopId !== undefined ? shopId : this.shopService.currentShopId;
    const url = `${this.apiUrl}?startDate=${today.toISOString()}&endDate=${end.toISOString()}${sId ? `&shopId=${sId}` : ''}`;

    this.loader.withLoader(this.http.get<any[]>(url)).subscribe({
      next: (bills) => {
        const normalized: Bill[] = (bills || []).map((b: any) => ({
          ...b,
          tejasShopesId: b.tejasShopesId ?? b.tejaS_SHOPES_ID ?? b.TEJAS_SHOPES_ID ?? sId,
          tejaS_SHOPES_ID: b.tejaS_SHOPES_ID ?? b.TEJAS_SHOPES_ID ?? b.tejasShopesId ?? sId,
          TEJAS_SHOPES_ID: b.TEJAS_SHOPES_ID ?? b.tejaS_SHOPES_ID ?? b.tejasShopesId ?? sId
        }));
        this.billsSubject.next(normalized);
      },
      error: (err) => {
        console.error('Error loading bills:', err);
        this.billsSubject.next([]);
      }
    });
  }

  fetchBillsByDateRange(startDate: string, endDate: string, shopId?: number): Observable<Bill[]> {
    const sId = shopId !== undefined ? shopId : this.shopService.currentShopId;
    const url = `${this.apiUrl}?startDate=${startDate}&endDate=${endDate}${sId ? `&shopId=${sId}` : ''}`;
    return this.loader.withLoader(this.http.get<any[]>(url)).pipe(
      map((bills: any[]) => (bills || []).map((b: any) => ({
        ...b,
        tejasShopesId: b.tejasShopesId ?? b.tejaS_SHOPES_ID ?? b.TEJAS_SHOPES_ID ?? sId,
        tejaS_SHOPES_ID: b.tejaS_SHOPES_ID ?? b.TEJAS_SHOPES_ID ?? b.tejasShopesId ?? sId,
        TEJAS_SHOPES_ID: b.TEJAS_SHOPES_ID ?? b.tejaS_SHOPES_ID ?? b.tejasShopesId ?? sId
      })))
    );
  }

  getAllBills(): Bill[] {
    return this.billsSubject.getValue();
  }

  private getLocalIsoString(date: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  }

  getBillById(id: string): Bill | undefined {
    return this.getAllBills().find(b => b.id === id);
  }

  fetchBillById(id: string): Observable<Bill> {
    const sId = this.shopService.currentShopId;
    return this.loader.withLoader(this.http.get<any>(`${this.apiUrl}/${id}`)).pipe(
      map((b: any) => ({
        ...b,
        tejasShopesId: b.tejasShopesId ?? b.tejaS_SHOPES_ID ?? b.TEJAS_SHOPES_ID ?? sId,
        tejaS_SHOPES_ID: b.tejaS_SHOPES_ID ?? b.TEJAS_SHOPES_ID ?? b.tejasShopesId ?? sId,
        TEJAS_SHOPES_ID: b.TEJAS_SHOPES_ID ?? b.tejaS_SHOPES_ID ?? b.tejasShopesId ?? sId
      }))
    );
  }

  saveBill(): Promise<Bill> {
    const cart = this.getCart();
    const items: BillItem[] = cart.map(c => ({
      foodId: c.food.id,
      name: c.food.name,
      price: c.food.price,
      quantity: c.quantity,
      image: '' // Empty string to prevent SQL truncation error
    }));

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const now = this.getLocalIsoString();
    const currentShop = this.shopService.currentShop;
    const shopId = this.shopService.currentShopId;

    const bill: any = {
      id: '',
      billNumber: '',
      items,
      subtotal,
      grandTotal: subtotal,
      createdAt: now,
      updatedAt: now,
      tejasShopesId: shopId,
      tejaS_SHOPES_ID: shopId,
      TEJAS_SHOPES_ID: shopId,
      shopId: shopId,
      shopName: currentShop?.shoP_NAME || (shopId ? `Branch #${shopId}` : '')
    };

    const bills = this.getAllBills();
    
    return new Promise((resolve, reject) => {
      this.loader.withLoader(this.http.post<Bill>(`${this.apiUrl}?shopId=${shopId}`, bill)).subscribe({
        next: (savedBill: any) => {
          const normalizedBill: Bill = {
            ...savedBill,
            tejasShopesId: savedBill.tejasShopesId ?? savedBill.tejaS_SHOPES_ID ?? savedBill.TEJAS_SHOPES_ID ?? shopId,
            tejaS_SHOPES_ID: savedBill.tejaS_SHOPES_ID ?? savedBill.TEJAS_SHOPES_ID ?? savedBill.tejasShopesId ?? shopId,
            TEJAS_SHOPES_ID: savedBill.TEJAS_SHOPES_ID ?? savedBill.tejaS_SHOPES_ID ?? savedBill.tejasShopesId ?? shopId,
            shopName: savedBill.shopName || currentShop?.shoP_NAME || (shopId ? `Branch #${shopId}` : '')
          };
          bills.unshift(normalizedBill);
          this.billsSubject.next([...bills]);
          this.clearCart();
          resolve(normalizedBill);
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
    const toSave: any = JSON.parse(JSON.stringify(updated));
    toSave.items?.forEach((i: any) => i.image = '');
    
    toSave.subtotal = toSave.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    toSave.grandTotal = toSave.subtotal;
    toSave.updatedAt = this.getLocalIsoString();
    
    const shopId = toSave.tejasShopesId || toSave.tejaS_SHOPES_ID || toSave.TEJAS_SHOPES_ID || this.shopService.currentShopId;
    toSave.tejasShopesId = shopId;
    toSave.tejaS_SHOPES_ID = shopId;
    toSave.TEJAS_SHOPES_ID = shopId;
    toSave.shopId = shopId;
    
    this.loader.withLoader(this.http.put<Bill>(`${this.apiUrl}/${toSave.id}?shopId=${shopId}`, toSave)).subscribe({
      next: (res: any) => {
        updated.subtotal = toSave.subtotal;
        updated.grandTotal = toSave.grandTotal;
        updated.updatedAt = res?.updatedAt || toSave.updatedAt;
        updated.createdAt = res?.createdAt || toSave.createdAt;
        updated.tejasShopesId = shopId;
        updated.tejaS_SHOPES_ID = shopId;
        updated.TEJAS_SHOPES_ID = shopId;
        
        const bills = this.getAllBills().map(b => b.id === updated.id ? updated : b);
        this.billsSubject.next([...bills]);
      },
      error: (err) => {
        console.error('Failed to update bill', err);
      }
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
