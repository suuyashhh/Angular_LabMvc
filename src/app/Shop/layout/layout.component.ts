import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  isSidebarOpen = false;
  isMastersDropdownOpen = false;
  isProfileDropdownOpen = false;
  userName = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.router.events.subscribe(() => {
      if (this.router.url.includes('/shop/ex-entrytype') || this.router.url.includes('/shop/shop-users')) {
        this.isMastersDropdownOpen = true;
      }
    });
  }

  get user() {
    return this.authService.getShopCredentialsFromCookie();
  }

  get isLoggedIn() {
    return this.authService.isShopLoggedIn();
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const shopUserStr = localStorage.getItem('shop_user');
      if (shopUserStr) {
        try {
          const shopUser = JSON.parse(shopUserStr);
          this.userName = shopUser.useR_NAME || shopUser.username || 'User';
        } catch(e) {}
      }
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleMastersDropdown(event: Event) {
    event.preventDefault();
    this.isMastersDropdownOpen = !this.isMastersDropdownOpen;
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  onLogout() {
    this.authService.shopLogout();
  }
}
