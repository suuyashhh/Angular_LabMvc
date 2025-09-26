import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar-port',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar-port.component.html',
  styleUrls: ['./navbar-port.component.css']
})
export class NavbarPortComponent {
  mobileMenuOpen = false;

  constructor(private router: Router) {}

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  isActive(path: string): boolean {
    return this.router.url.includes(`/portfolio/${path}`) || 
           (path === 'home' && this.router.url === '/portfolio');
  }
}