import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { TejasShop } from '../models/interfaces';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Injectable({
  providedIn: 'root'
})
export class TejasShopService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private loader = inject(LoaderService);

  private shopsSubject = new BehaviorSubject<TejasShop[]>([]);
  public shops$ = this.shopsSubject.asObservable();

  private selectedShopSubject = new BehaviorSubject<TejasShop | null>(null);
  public selectedShop$ = this.selectedShopSubject.asObservable();

  private readonly STORAGE_KEY = 'Tejas_selected_shop';

  constructor() {
    this.initSelectedShop();
    this.loadShops();
  }

  public get currentShopId(): number {
    const selected = this.selectedShopSubject.getValue();
    if (selected && selected.tejaS_SHOPES_ID) {
      return Number(selected.tejaS_SHOPES_ID);
    }
    // Fallback: check stored user
    const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('Tejas_user') : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.tejas_shopes_id || user.tejasShopesId) {
          return Number(user.tejas_shopes_id || user.tejasShopesId);
        }
      } catch {}
    }
    return 1; // Default main branch
  }

  public get currentShop(): TejasShop | null {
    return this.selectedShopSubject.getValue();
  }

  public get selectedShop(): TejasShop | null {
    return this.selectedShopSubject.getValue();
  }

  public get isAdmin(): boolean {
    const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('Tejas_user') : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = (user.role || '').toLowerCase().trim();
        return role === 'admin' || role === 'superadmin';
      } catch {}
    }
    return false;
  }

  public get isSuperAdmin(): boolean {
    const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('Tejas_user') : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = (user.role || '').toLowerCase().trim();
        return role === 'superadmin';
      } catch {}
    }
    return false;
  }

  private initSelectedShop(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.selectedShopSubject.next(parsed);
        return;
      }

      // Check user details
      const userStr = localStorage.getItem('Tejas_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.tejas_shopes_id || user.tejasShopesId) {
          const shopId = Number(user.tejas_shopes_id || user.tejasShopesId);
          const defaultShop: TejasShop = {
            tejaS_SHOPES_ID: shopId,
            shoP_NAME: user.shop_name || user.shopName || 'Main Branch',
            active: 'Y'
          };
          this.selectedShopSubject.next(defaultShop);
        }
      }
    } catch (e) {
      console.error('Error initializing selected shop', e);
    }
  }

  public loadShops(): Observable<TejasShop[]> {
    const url = `${this.api.baseUrl}TejasShop/GetAll`;
    return this.http.get<TejasShop[]>(url).pipe(
      tap({
        next: (shops: any) => {
          const list: TejasShop[] = Array.isArray(shops) ? shops.map(s => this.normalizeShop(s)) : [];
          this.shopsSubject.next(list);

          // If no selected shop yet or selected shop is not in list, pick the first active one or matching
          const current = this.selectedShopSubject.getValue();
          if (!current && list.length > 0) {
            this.selectShop(list[0]);
          } else if (current && list.length > 0) {
            const match = list.find(s => s.tejaS_SHOPES_ID === current.tejaS_SHOPES_ID);
            if (match) {
              this.selectedShopSubject.next(match);
            }
          }
        },
        error: (err) => {
          console.error('Failed to load shops', err);
        }
      })
    );
  }

  public selectShop(shop: TejasShop): void {
    this.selectedShopSubject.next(shop);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(shop));
    }
  }

  public selectShopById(shopId: number): void {
    const list = this.shopsSubject.getValue();
    const match = list.find(s => s.tejaS_SHOPES_ID === shopId);
    if (match) {
      this.selectShop(match);
    } else {
      const fallback: TejasShop = {
        tejaS_SHOPES_ID: shopId,
        shoP_NAME: `Shop #${shopId}`,
        active: 'Y'
      };
      this.selectShop(fallback);
    }
  }

  public addShop(shop: Partial<TejasShop>): Observable<any> {
    const url = `${this.api.baseUrl}TejasShop/Insert`;
    const payload = {
      SHOP_NAME: shop.shoP_NAME,
      SHOP_CODE: shop.shoP_CODE,
      ADDRESS: shop.address,
      CONTACT: shop.contact,
      EMAIL: shop.email,
      GST_NO: shop.gsT_NO,
      LOGO_URL: shop.logO_URL,
      ACTIVE: shop.active || 'Y'
    };
    return this.loader.withLoader(this.http.post(url, payload)).pipe(
      tap(() => this.loadShops().subscribe())
    );
  }

  public updateShop(shop: TejasShop): Observable<any> {
    const url = `${this.api.baseUrl}TejasShop/Update`;
    const payload = {
      TEJAS_SHOPES_ID: shop.tejaS_SHOPES_ID,
      SHOP_NAME: shop.shoP_NAME,
      SHOP_CODE: shop.shoP_CODE,
      ADDRESS: shop.address,
      CONTACT: shop.contact,
      EMAIL: shop.email,
      GST_NO: shop.gsT_NO,
      LOGO_URL: shop.logO_URL,
      ACTIVE: shop.active || 'Y'
    };
    return this.loader.withLoader(this.http.put(url, payload)).pipe(
      tap(() => this.loadShops().subscribe())
    );
  }

  public deleteShop(shopId: number): Observable<any> {
    const url = `${this.api.baseUrl}TejasShop/Delete?shopId=${shopId}`;
    return this.loader.withLoader(this.http.delete(url)).pipe(
      tap(() => this.loadShops().subscribe())
    );
  }

  public normalizeShop(data: any): TejasShop {
    return {
      tejaS_SHOPES_ID: data.tejaS_SHOPES_ID ?? data.tejaS_Shopes_ID ?? data.TEJAS_SHOPES_ID ?? data.shopId ?? 0,
      shoP_NAME: data.shoP_NAME ?? data.shoP_Name ?? data.SHOP_NAME ?? data.shopName ?? '',
      shoP_CODE: data.shoP_CODE ?? data.shoP_Code ?? data.SHOP_CODE ?? data.shopCode ?? '',
      address: data.address ?? data.ADDRESS ?? '',
      contact: data.contact ?? data.CONTACT ?? '',
      email: data.email ?? data.EMAIL ?? '',
      gsT_NO: data.gsT_NO ?? data.GST_NO ?? data.gstNo ?? '',
      logO_URL: data.logO_URL ?? data.LOGO_URL ?? data.logoUrl ?? '',
      active: data.active ?? data.ACTIVE ?? 'Y',
      createD_AT: data.createD_AT ?? data.CREATED_AT,
      updateD_AT: data.updateD_AT ?? data.UPDATED_AT
    };
  }
}
