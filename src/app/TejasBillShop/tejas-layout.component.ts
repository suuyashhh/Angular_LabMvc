import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TejasShopService } from './services/tejas-shop.service';
import { AuthService } from '../shared/auth.service';
import { TejasShop } from './models/interfaces';

@Component({
  selector: 'app-tejas-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tejas-layout.component.html'
})
export class TejasLayoutComponent implements OnInit {
  isExpenseModule = false;
  isAdmin = false;
  currentUser: any = null;
  showShopDropdown = false;

  public shopService = inject(TejasShopService);
  public auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.checkRoute(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.urlAfterRedirects);
      this.showShopDropdown = false;
    });
  }

  ngOnInit(): void {
    this.checkUserRole();
  }

  /**
   * Evaluates if current user has role 'superadmin' from localStorage or cookie.
   * Accurately matches "role":"superadmin" from stored JSON objects or storage keys.
   */
  get isSuperAdmin(): boolean {
    return this.getRoleFromStorage() === 'superadmin';
  }

  public getRoleFromStorage(): string {
    if (typeof localStorage !== 'undefined') {
      try {
        // 1. Check known primary user keys in localStorage
        const keys = ['Tejas_user', 'userDetails', 'user', 'currentUser'];
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const role = (parsed?.role || parsed?.ROLE || '').toString().toLowerCase().trim();
              if (role) return role;
            } catch {}
          }
        }

        // 2. Check direct 'role' key
        const directRole = localStorage.getItem('role');
        if (directRole) {
          return directRole.toLowerCase().trim();
        }

        // 3. Fallback: scan all localStorage items for "role":"superadmin"
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey) {
            const itemVal = localStorage.getItem(storageKey);
            if (itemVal) {
              const lowerVal = itemVal.toLowerCase();
              if (lowerVal.includes('"role":"superadmin"') || lowerVal.includes('"role": "superadmin"')) {
                return 'superadmin';
              }
            }
          }
        }
      } catch (e) {
        console.error('Error reading role from localStorage:', e);
      }
    }

    // 4. Fallback: check cookie credentials
    const cookieUser = this.auth.getTejasCredentialsFromCookie();
    return (cookieUser?.role || cookieUser?.ROLE || '').toString().toLowerCase().trim();
  }

  private checkUserRole(): void {
    const role = this.getRoleFromStorage();
    this.currentUser = this.getCurrentUser();
    this.isAdmin = role === 'admin' || role === 'superadmin';
  }

  private getCurrentUser(): any {
    if (typeof localStorage !== 'undefined') {
      try {
        const tejasUserStr = localStorage.getItem('Tejas_user');
        if (tejasUserStr) return JSON.parse(tejasUserStr);

        const userDetailsStr = localStorage.getItem('userDetails');
        if (userDetailsStr) return JSON.parse(userDetailsStr);

        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
    return this.auth.getTejasCredentialsFromCookie();
  }

  toggleShopDropdown(): void {
    if (!this.isAdmin && !this.isSuperAdmin) return;
    this.showShopDropdown = !this.showShopDropdown;
  }

  selectShop(shop: TejasShop): void {
    this.shopService.selectShop(shop);
    this.showShopDropdown = false;
  }

  private checkRoute(url: string) {
    const expenseRoutes = ['/tejas/expenses', '/tejas/history', '/tejas/ex-entrytype', '/tejas/tejas-users'];
    this.isExpenseModule = expenseRoutes.some(route => url.includes(route));
  }
}
