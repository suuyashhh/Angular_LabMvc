import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../sidebar.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-parking-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class SmartParkingFooterComponent {
  sidebarService = inject(SidebarService);
  authService = inject(AuthService);
  private router = inject(Router);

  toggleMenu() {
    this.sidebarService.toggle();
  }

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
    const isLoggedIn = this.authService.isParkingLoggedIn();
    
    return [
      { icon: 'home', label: 'Home', active: this.isActive('/parking/dashboard'), link: '/parking/dashboard' },
      isLoggedIn 
        ? { icon: 'local_parking', label: 'Provide', active: this.isActive('/parking/parking-provider'), link: '/parking/parking-provider' }
        : { icon: 'search', label: 'Search', active: this.isActive('/parking/parking-seeker'), link: '/parking/parking-seeker' },
      { icon: 'menu', label: 'Menu', active: this.sidebarService.isOpen, action: true },
    ];
  }
}
