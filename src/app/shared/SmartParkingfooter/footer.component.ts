import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../sidebar.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  sidebarService = inject(SidebarService);
  authService = inject(AuthService);

  toggleMenu() {
    this.sidebarService.toggle();
  }

  get navItems() {
    const isLoggedIn = this.authService.isParkingLoggedIn();
    
    return [
      { icon: 'home', label: 'Home', active: true, link: '/Parking/dashboard' },
      isLoggedIn 
        ? { icon: 'local_parking', label: 'Provide', active: false, link: '/Parking/parking-provider' }
        : { icon: 'search', label: 'Search', active: false, link: '/Parking/parking-seeker' },
      { icon: 'menu', label: 'Menu', active: false, action: true },
    ];
  }
}
