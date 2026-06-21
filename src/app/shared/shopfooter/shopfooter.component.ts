import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-shopfooter',
  standalone: true,
  imports: [RouterLink,CommonModule],
  templateUrl: './shopfooter.component.html',
  styleUrl: './shopfooter.component.css'
})
export class ShopfooterComponent {
  private router = inject(Router);

  isActive(link: string | undefined): boolean {
    if (!link || !this.router?.url) return false;
    // Remove query params for comparison if needed, or use router.isActive
    try {
      return this.router.url.split('?')[0] === link;
    } catch {
      return false;
    }
  }

  get navItems() {
    return [
      { icon: 'dashboard', label: 'Dashboard', active: this.isActive('/shop/dashboard'), link: '/shop/dashboard' },
      { icon: 'history', label: 'History', active: this.isActive('/shop/history'), link: '/shop/history' }
    ];
  }
}
