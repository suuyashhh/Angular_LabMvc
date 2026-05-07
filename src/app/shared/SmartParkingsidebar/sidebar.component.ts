import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../sidebar.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-parking-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SmartParkingSidebarComponent {
  sidebarService = inject(SidebarService);
  authService = inject(AuthService);

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.name || user?.NAME || 'Guest User';
  }

  get isLoggedIn(): boolean {
    return this.authService.isParkingLoggedIn();
  }

  get isOpen() {
    return this.sidebarService.isOpen;
  }

  closeSidebar() {
    this.sidebarService.close();
  }

  onLogout() {
    this.authService.parkingLogout();
    this.sidebarService.close();
  }

  activeTab: string = 'categories';

  categories = [
    { name: 'Dashboard', icon: 'dashboard', link: '/parking/dashboard', hasSub: false },
    { name: 'Provide Parking', icon: 'local_parking', link: '/parking/parking-provider', hasSub: false },
    { name: 'Parking History', icon: 'history', hasSub: false },
    { name: 'Support', icon: 'help_outline', hasSub: false },
    { name: 'Login', icon: 'login', link: '/parking/provider-login', hasSub: false }
  ];

}
