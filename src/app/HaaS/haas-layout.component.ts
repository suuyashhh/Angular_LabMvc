import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { HaaSService } from './services/haas.service';

@Component({
  selector: 'app-haas-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './haas-layout.component.html'
})
export class HaaSLayoutComponent implements OnInit, OnDestroy {
  activeRoute = '';
  menuOpen = false;
  currentTime = new Date();
  private subs = new Subscription();
  private clockInterval: any;

  navItems = [
    { path: 'dashboard',   label: 'Dashboard',       icon: '📊' },
    { path: 'ecosystem',   label: 'Ecosystems',       icon: '🌍' },
    { path: 'forecasting', label: 'Forecasting',      icon: '📈' },
    { path: 'storage-log', label: 'Storage & Logs',   icon: '🔋' },
  ];

  constructor(private router: Router, public haasService: HaaSService) {}

  ngOnInit(): void {
    this.setActiveRoute(this.router.url);
    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => {
          this.setActiveRoute(e.urlAfterRedirects);
          this.menuOpen = false;
        })
    );
    this.clockInterval = setInterval(() => this.currentTime = new Date(), 1000);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    clearInterval(this.clockInterval);
  }

  private setActiveRoute(url: string): void {
    const seg = url.split('/').pop() ?? '';
    this.activeRoute = seg;
  }

  isActive(path: string): boolean {
    return this.router.url.includes(`/haas/${path}`);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
}
