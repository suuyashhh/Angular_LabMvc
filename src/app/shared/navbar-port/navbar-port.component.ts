import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar-port',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar-port.component.html',
  styleUrls: ['./navbar-port.component.css']
})
export class NavbarPortComponent {
  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  setActiveLink(event: Event): void {
    // Remove active class from all links
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => link.classList.remove('active'));
    
    // Add active class to clicked link
    (event.target as HTMLElement).classList.add('active');
    
    // Close mobile menu if open
    this.closeMobileMenu();
  }
}