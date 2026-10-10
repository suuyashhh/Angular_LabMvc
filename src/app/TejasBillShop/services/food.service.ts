import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { FoodItem } from '../models/interfaces';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';
import { TejasShopService } from './tejas-shop.service';

@Injectable({ providedIn: 'root' })
export class FoodService {
  private itemsSubject = new BehaviorSubject<FoodItem[]>([]);
  items$ = this.itemsSubject.asObservable();
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private loader: LoaderService,
    private shopService: TejasShopService
  ) {
    this.apiUrl = this.apiService.baseUrl + 'TejasFood';
    this.load();

    this.shopService.selectedShop$.subscribe(() => {
      this.load();
    });
  }

  public load(shopId?: number): void {
    const sId = shopId !== undefined ? shopId : this.shopService.currentShopId;
    const url = sId ? `${this.apiUrl}?shopId=${sId}` : this.apiUrl;

    this.loader.withLoader(this.http.get<any[]>(url)).subscribe({
      next: (items) => {
        const normalized = (items || []).map((f: any) => ({
          ...f,
          tejasShopesId: f.tejasShopesId ?? f.tejaS_SHOPES_ID ?? f.TEJAS_SHOPES_ID ?? sId,
          tejaS_SHOPES_ID: f.tejaS_SHOPES_ID ?? f.TEJAS_SHOPES_ID ?? f.tejasShopesId ?? sId,
          TEJAS_SHOPES_ID: f.TEJAS_SHOPES_ID ?? f.tejaS_SHOPES_ID ?? f.tejasShopesId ?? sId
        }));
        this.itemsSubject.next(normalized);
      },
      error: (err) => {
        console.error('Error loading foods:', err);
        this.itemsSubject.next([]);
      }
    });
  }

  getAll(): FoodItem[] {
    return this.itemsSubject.getValue();
  }

  getActive(): FoodItem[] {
    return this.getAll().filter(f => f.active);
  }

  getById(id: string): FoodItem | undefined {
    return this.getAll().find(f => f.id === id);
  }

  add(item: Omit<FoodItem, 'id'>): FoodItem {
    const sId = item.tejasShopesId || this.shopService.currentShopId || 1;
    const newItem: FoodItem = {
      ...item,
      id: '',
      tejasShopesId: sId,
      tejaS_SHOPES_ID: sId,
      TEJAS_SHOPES_ID: sId
    };
    
    this.loader.withLoader(this.http.post<FoodItem>(`${this.apiUrl}?shopId=${sId}`, newItem)).subscribe(savedItem => {
      const items = this.getAll();
      items.push(savedItem);
      this.itemsSubject.next([...items]);
    });
    
    return newItem;
  }

  update(updated: FoodItem): void {
    const sId = updated.tejasShopesId || updated.tejaS_SHOPES_ID || updated.TEJAS_SHOPES_ID || this.shopService.currentShopId || 1;
    updated.tejasShopesId = sId;
    updated.tejaS_SHOPES_ID = sId;
    updated.TEJAS_SHOPES_ID = sId;
    
    this.loader.withLoader(this.http.put<FoodItem>(`${this.apiUrl}/${updated.id}?shopId=${sId}`, updated)).subscribe(() => {
      const items = this.getAll().map(f => f.id === updated.id ? updated : f);
      this.itemsSubject.next([...items]);
    });
  }

  delete(id: string): void {
    this.loader.withLoader(this.http.delete(`${this.apiUrl}/${id}`)).subscribe(() => {
      const items = this.getAll().filter(f => f.id !== id);
      this.itemsSubject.next([...items]);
    });
  }

  getCategories(): string[] {
    const cats = new Set(this.getAll().map(f => f.category));
    return ['All', ...Array.from(cats)];
  }
}
