import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private platformId = inject(PLATFORM_ID);

  constructor(
    private router: Router,
    private http: HttpClient,
    private api: ApiService
  ) {}

  // Generate UUID (optional utility)
  generateUUIDToken(): string {
    return uuidv4();
  }

  // Set token and user data in localStorage and cookie
  setToken(res: any): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('userDetails', JSON.stringify(res.userDetails));
    document.cookie = `authToken=${res.token}; path=/`;
  }

  // Get current user object
  getUser(): any {
    const userJson = localStorage.getItem('userDetails');
    return userJson ? JSON.parse(userJson) : null;
  }

  // Get JWT token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get token from cookies
  getTokenFromCookies(): string | null {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'authToken') {
        return value;
      }
    }
    return null;
  }

  // Check if token in localStorage matches cookie
  isTokenValid(): boolean {
  const token = this.getToken();
  return !!token; // only rely on localStorage
}

  // Return true if logged in
  isLoggedIn(): boolean {
    return isPlatformBrowser(this.platformId) && this.isTokenValid();
  }

  // API: Login
  login(credentials: any) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.api.baseurl}Login/Login`, credentials, { headers });
  }

  // API: Logout
  logout(): void {
    const token = this.getToken();

    if (!token) {
      this.clearLocalSession();
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`${this.api.baseurl}Login/Logout`, {}, { headers }).subscribe({
      next: () => this.clearLocalSession(),
      error: () => this.clearLocalSession()
    });
  }

  // Clear session from browser
  private clearLocalSession(): void {
    localStorage.clear();
    document.cookie = 'authToken=; path=/; max-age=0';
    this.router.navigate(['/']);
  }
}
