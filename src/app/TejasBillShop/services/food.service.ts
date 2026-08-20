import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { FoodItem } from '../models/interfaces';
import { ApiService } from '../../shared/api.service';

@Injectable({ providedIn: 'root' })
export class FoodService {
  private itemsSubject = new BehaviorSubject<FoodItem[]>([]);
  items$ = this.itemsSubject.asObservable();
  private apiUrl: string;

  constructor(private http: HttpClient, private apiService: ApiService) {
    this.apiUrl = this.apiService.baseUrl + 'TejasFood';
    this.load();
  }

  private load(): void {
    this.http.get<FoodItem[]>(this.apiUrl).subscribe(items => {
      this.itemsSubject.next(items);
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
    const newItem: FoodItem = {
      ...item,
      id: ''
    };
    
    this.http.post<FoodItem>(this.apiUrl, newItem).subscribe(savedItem => {
      const items = this.getAll();
      items.push(savedItem);
      this.itemsSubject.next(items);
    });
    
    // Return optimistic item (id will be updated by server response)
    return newItem;
  }

  update(updated: FoodItem): void {
    this.http.put<FoodItem>(`${this.apiUrl}/${updated.id}`, updated).subscribe(() => {
      const items = this.getAll().map(f => f.id === updated.id ? updated : f);
      this.itemsSubject.next(items);
    });
  }

  delete(id: string): void {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
      const items = this.getAll().filter(f => f.id !== id);
      this.itemsSubject.next(items);
    });
  }

  getCategories(): string[] {
    const cats = new Set(this.getAll().map(f => f.category));
    return ['All', ...Array.from(cats)];
  }
}
