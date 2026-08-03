import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  isSidebarOpen = false;
  isMastersDropdownOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Keep the dropdown open if the active route is under hotels or vegetables
    this.router.events.subscribe(() => {
      if (this.router.url.includes('/market/hotels') || this.router.url.includes('/market/vegetables')) {
        this.isMastersDropdownOpen = true;
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleMastersDropdown(event: Event) {
    event.preventDefault();
    this.isMastersDropdownOpen = !this.isMastersDropdownOpen;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/market/login']);
  }
}
