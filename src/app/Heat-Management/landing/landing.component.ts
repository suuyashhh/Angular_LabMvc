import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { SideMenuBarComponent } from '../shared/side-menu-bar/side-menu-bar.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SideMenuBarComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  isLoginPage = false;
  private routerSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkIsLoginPage(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkIsLoginPage(event.urlAfterRedirects || event.url);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private checkIsLoginPage(url: string): void {
    this.isLoginPage = url.includes('/login') && !url.includes('/data-server') && !url.includes('/dashboard');
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
