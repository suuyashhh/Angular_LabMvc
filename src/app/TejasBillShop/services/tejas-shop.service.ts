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

  public getShopIdFromStorage(): number | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      // 1. Direct saved shop object or raw ID
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const id = Number(parsed?.tejaS_SHOPES_ID ?? parsed?.TEJAS_SHOPES_ID ?? parsed?.tejas_shopes_id ?? parsed?.tejasShopesId ?? parsed?.shopId ?? parsed?.shop_id ?? parsed?.id);
          if (id && !isNaN(id) && id > 0) return id;
        } catch {
          const num = Number(saved);
          if (!isNaN(num) && num > 0) return num;
        }
      }

      // 2. Direct keys in localStorage
      const directKeys = ['tejas_shopes_id', 'TEJAS_SHOPES_ID', 'tejaS_SHOPES_ID', 'tejasShopesId', 'shopId', 'shop_id', 'tejas_shop_id', 'selected_shop_id'];
      for (const k of directKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          const num = Number(val);
          if (!isNaN(num) && num > 0) return num;
        }
      }

      // 3. User objects in localStorage
      const userKeys = ['Tejas_user', 'userDetails', 'user', 'currentUser'];
      for (const k of userKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const user = JSON.parse(val);
            const id = Number(user?.tejas_shopes_id ?? user?.tejaS_SHOPES_ID ?? user?.TEJAS_SHOPES_ID ?? user?.tejasShopesId ?? user?.shopId ?? user?.shop_id);
            if (id && !isNaN(id) && id > 0) return id;
          } catch {}
        }
      }

      // 4. Check cookies
      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split('; ');
        for (const c of cookies) {
          const [name, value] = c.split('=');
          if (name === 'TejasCredentials' && value) {
            try {
              const user = JSON.parse(decodeURIComponent(value));
              const id = Number(user?.tejas_shopes_id ?? user?.tejaS_SHOPES_ID ?? user?.TEJAS_SHOPES_ID ?? user?.shopId);
              if (id && !isNaN(id) && id > 0) return id;
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error('Error reading shop id from storage:', e);
    }
    return null;
  }

  public get currentShopId(): number {
    const selected = this.selectedShopSubject.getValue();
    const selectedId = Number(selected?.tejaS_SHOPES_ID ?? (selected as any)?.TEJAS_SHOPES_ID ?? (selected as any)?.tejas_shopes_id ?? (selected as any)?.shopId);
    if (selectedId && !isNaN(selectedId) && selectedId > 0) {
      return selectedId;
    }

    const fromStorage = this.getShopIdFromStorage();
    if (fromStorage && !isNaN(fromStorage) && fromStorage > 0) {
      return fromStorage;
    }

    const loadedShops = this.shopsSubject.getValue();
    if (loadedShops && loadedShops.length > 0 && loadedShops[0].tejaS_SHOPES_ID) {
      return loadedShops[0].tejaS_SHOPES_ID;
    }

    return 0;
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
        try {
          const parsed = JSON.parse(saved);
          const normalized = this.normalizeShop(parsed);
          if (normalized.tejaS_SHOPES_ID > 0) {
            this.selectedShopSubject.next(normalized);
            return;
          }
        } catch {}
      }

      const shopId = this.getShopIdFromStorage();
      if (shopId && shopId > 0) {
        // Check if user object has a shop name
        let shopName = `Branch #${shopId}`;
        const uStr = localStorage.getItem('Tejas_user') || localStorage.getItem('userDetails');
        if (uStr) {
          try {
            const u = JSON.parse(uStr);
            shopName = u.shop_name || u.shoP_NAME || u.shopName || shopName;
          } catch {}
        }
        const defaultShop: TejasShop = {
          tejaS_SHOPES_ID: shopId,
          shoP_NAME: shopName,
          active: 'Y'
        };
        this.selectedShopSubject.next(defaultShop);
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
          const targetId = current?.tejaS_SHOPES_ID || this.currentShopId;

          if (list.length > 0) {
            const match = list.find(s => s.tejaS_SHOPES_ID === targetId);
            if (match) {
              this.selectedShopSubject.next(match);
            } else if (!current) {
              this.selectShop(list[0]);
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
    const normalized = this.normalizeShop(shop);
    this.selectedShopSubject.next(normalized);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem('tejas_shopes_id', normalized.tejaS_SHOPES_ID.toString());
      localStorage.setItem('shopId', normalized.tejaS_SHOPES_ID.toString());
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
        shoP_NAME: `Branch #${shopId}`,
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
