import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/SmartParkingsidebar/sidebar.component';
import { FooterComponent } from '../../shared/SmartParkingfooter/footer.component';
import { SidebarService } from '../../shared/sidebar.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { catchError, EMPTY, exhaustMap, filter, interval, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FooterComponent, CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, OnDestroy {
  sidebarService = inject(SidebarService);
  authService = inject(AuthService);
  private router = inject(Router);
  private readonly onWindowFocus = () => this.validateParkingSession();

  user: any = null;
  private userSub: Subscription | null = null;
  private routeSub: Subscription | null = null;
  private sessionCheckSub: Subscription | null = null;

  ngOnInit() {
    // Reactive subscription ensures UI updates immediately on login/logout
    this.userSub = this.authService.parkingUser$.subscribe(userData => {
      this.user = userData;
      // Also check for user credentials in local storage as per specific request
      if (typeof window !== 'undefined' && window.localStorage) {
        const extraCreds = localStorage.getItem('smartparking usercredentials');
        if (extraCreds) {
          try {
            const parsed = JSON.parse(extraCreds);
            this.user = { ...this.user, ...parsed };
          } catch {
            this.user = { ...this.user, userName: extraCreds };
          }
        }
      }

      if (!this.user) {
        this.user = { userName: 'Guest' };
      }
    });

    this.startSessionPolling();

    this.routeSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.validateParkingSession());

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.onWindowFocus);
    }
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.sessionCheckSub) {
      this.sessionCheckSub.unsubscribe();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.onWindowFocus);
    }
  }

  get isSidebarOpen() {
    return this.sidebarService.isOpen;
  }

  logout() {
    this.authService.parkingLogout();
  }

  login() {
    this.router.navigate(['/Parking/provider-login']);
  }

  private validateParkingSession() {
    if (!this.authService.isParkingLoggedIn()) {
      return;
    }

    this.authService.validateParkingSession(true).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  private startSessionPolling() {
    this.sessionCheckSub = interval(3000).pipe(
      startWith(0),
      filter(() => this.authService.isParkingLoggedIn()),
      exhaustMap(() =>
        this.authService.validateParkingSession(true).pipe(
          catchError(() => EMPTY)
        )
      )
    ).subscribe();
  }
}
