import { Component, EventEmitter, OnInit, OnDestroy, Output, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentTime: string = '';
  isOnline = true;
  isDarkMode = true;
  private timeInterval: any;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateTime();
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.timeInterval = setInterval(() => {
          this.updateTime();
          this.cdr.detectChanges();
        }, 1000);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private updateTime(): void {
    const now = new Date();
    // Format: "8 Oct 2026 12:43 PM"
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' should be '12'
    this.currentTime = `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
  }

  onToggleMenu(): void {
    this.toggleSidebar.emit();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  logout(): void {
    this.router.navigate(['/heatmanagement/login']);
  }
}
