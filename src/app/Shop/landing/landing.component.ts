import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { ShopfooterComponent } from "../../shared/shopfooter/shopfooter.component";

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ShopfooterComponent, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class ShopLandingComponent implements OnInit {
  public auth = inject(AuthService);
  private router = inject(Router);

  get user() {
    return this.auth.getShopCredentialsFromCookie();
  }

  get isLoggedIn() {
    return this.auth.isShopLoggedIn();
  }

  ngOnInit() {
    // Debug shopConflict$ state
    this.auth.shopConflict$.subscribe(val => {
      console.log('ShopLandingComponent shopConflict$ value:', val);
    });
  }

  logout() {
    this.auth.shopLogout();
  }

  login() {
    this.router.navigate(['/shop/login']);
  }

  closeConflictModalAndRedirect() {
    this.auth.clearShopConflictFlag();
    this.router.navigate(['/shop/login']);
  }
}

