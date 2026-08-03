import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { ApiService as SharedApiService } from '../../shared/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl: string;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private sharedApi: SharedApiService) {
    const base = this.sharedApi.baseurl;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    this.apiUrl = `${cleanBase}/auth`;
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          this.currentUserSubject.next(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('currentUser');
        }
      }
    }
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue?.token;
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }));
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string {
    return this.currentUserValue?.token || '';
  }
}
