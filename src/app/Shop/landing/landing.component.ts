import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
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
  imports: [RouterOutlet, CommonModule, ShopfooterComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class ShopLandingComponent implements OnInit, OnDestroy {
 
  private router = inject(Router);
  ngOnInit() {
  }

  ngOnDestroy() {
  
  }

  logout() {
  }

  login() {
  }

  private validateParkingSession() {
   
  }
}

