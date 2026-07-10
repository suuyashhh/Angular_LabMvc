import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

import { ApiService as SharedApiService } from '../../shared/api.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string;

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private sharedApi: SharedApiService
  ) {
    // Strip trailing slash if present
    const base = this.sharedApi.baseurl;
    this.baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
  }

  getHostUrl(): string {
    return this.baseUrl;
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Hotels CRUD
  getHotels(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/hotel`, { headers: this.getHeaders() });
  }

  getHotel(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/hotel/${id}`, { headers: this.getHeaders() });
  }

  createHotel(hotel: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/hotel`, hotel, { headers: this.getHeaders() });
  }

  updateHotel(id: number, hotel: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/hotel/${id}`, hotel, { headers: this.getHeaders() });
  }

  deleteHotel(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/hotel/${id}`, { headers: this.getHeaders() });
  }

  // Vegetables CRUD
  getVegetables(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vegetable`, { headers: this.getHeaders() });
  }

  getVegetable(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/vegetable/${id}`, { headers: this.getHeaders() });
  }

  createVegetable(veg: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/vegetable`, veg, { headers: this.getHeaders() });
  }

  updateVegetable(id: number, veg: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/vegetable/${id}`, veg, { headers: this.getHeaders() });
  }

  deleteVegetable(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/vegetable/${id}`, { headers: this.getHeaders() });
  }

  // Purchases CRUD
  getPurchases(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/purchase`, { headers: this.getHeaders() });
  }

  getPurchase(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/purchase/${id}`, { headers: this.getHeaders() });
  }

  createPurchase(purchase: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/purchase`, purchase, { headers: this.getHeaders() });
  }

  updatePurchase(id: number, purchase: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/purchase/${id}`, purchase, { headers: this.getHeaders() });
  }

  deletePurchase(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/purchase/${id}`, { headers: this.getHeaders() });
  }

  uploadScreenshot(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/purchase/upload`, formData, { headers: this.getHeaders() });
  }

  // Dashboard Stats
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/stats`, { headers: this.getHeaders() });
  }

  // Backup & Restore
  exportBackup(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/backup/export`, { headers: this.getHeaders() });
  }

  importBackup(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/backup/import`, data, { headers: this.getHeaders() });
  }
}
