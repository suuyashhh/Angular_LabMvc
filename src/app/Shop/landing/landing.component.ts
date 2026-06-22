import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { SmartParkingSidebarComponent } from '../../shared/SmartParkingsidebar/sidebar.component';
import { SmartParkingFooterComponent } from '../../shared/SmartParkingfooter/footer.component';
import { SidebarService } from '../../shared/sidebar.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { catchError, EMPTY, exhaustMap, filter, interval, startWith, Subscription } from 'rxjs';
import { ShopfooterComponent } from "../../shared/shopfooter/shopfooter.component";

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ShopfooterComponent, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class ShopLandingComponent implements OnInit, OnDestroy {
  public auth = inject(AuthService);
  private router = inject(Router);

  private readonly onWindowFocus = () => this.validateShopSession();
  private routeSub: Subscription | null = null;
  private sessionCheckSub: Subscription | null = null;

  get user() {
    return this.auth.getShopCredentialsFromCookie();
  }

  get isLoggedIn() {
    return this.auth.isShopLoggedIn();
  }

  ngOnInit() {
    this.startSessionPolling();

    this.routeSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.validateShopSession());

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.onWindowFocus);
    }
  }

  ngOnDestroy() {
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

  logout() {
    this.auth.shopLogout();
  }

  login() {
    this.router.navigate(['/shop/login']);
  }

  private validateShopSession() {
    if (!this.auth.isShopLoggedIn()) {
      return;
    }

    this.auth.validateShopSession(true).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  private startSessionPolling() {
    this.sessionCheckSub = interval(3000).pipe(
      startWith(0),
      filter(() => this.auth.isShopLoggedIn()),
      exhaustMap(() =>
        this.auth.validateShopSession(true).pipe(
          catchError(() => EMPTY)
        )
      )
    ).subscribe();
  }
}

