import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/SmartParkingsidebar/sidebar.component';
import { FooterComponent } from '../../shared/SmartParkingfooter/footer.component';
import { SidebarService } from '../../shared/sidebar.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { Subscription } from 'rxjs';

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

  user: any = null;
  private userSub: Subscription | null = null;

  ngOnInit() {
    // Reactive subscription ensures UI updates immediately on login/logout
    this.userSub = this.authService.parkingUser$.subscribe(userData => {
      this.user = userData;

      // Also check for user credentials in session storage as per specific request
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const extraCreds = sessionStorage.getItem('smartparking usercredentials');
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
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
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
}
