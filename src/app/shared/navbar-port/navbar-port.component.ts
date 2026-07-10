import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar-port',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar-port.component.html',
  styleUrls: ['./navbar-port.component.css']
})
export class NavbarPortComponent implements OnInit {
  mobileMenuOpen = false;
  isDarkMode = false;

  activeClass = 'bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 text-zinc-950 dark:text-zinc-50 font-semibold px-4 py-2 rounded-full shadow-sm text-sm transition-all duration-200';
  inactiveClass = 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 px-4 py-2 text-sm font-medium transition-all duration-200';

  mobileActiveClass = 'bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 text-zinc-950 dark:text-zinc-50 font-semibold w-full py-2.5 rounded-2xl shadow-sm text-sm text-center block';
  mobileInactiveClass = 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 w-full py-2.5 text-sm font-medium transition-all duration-200 text-center block';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.isDarkMode = false;
    this.applyTheme();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  private applyTheme(): void {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }

  isActive(path: string): boolean {
    return this.router.url.includes(`/portfolio/${path}`) || 
           (path === 'home' && this.router.url === '/portfolio');
  }
}