import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-fab-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fab-dashboard.component.html',
  styleUrls: ['./fab-dashboard.component.css']
})
export class FabDashboardComponent implements OnInit {
  user: any = null;
  isAdmin = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getFabCredentialsFromCookie();
    if (!this.user) {
      this.router.navigate(['/fab/login']);
      return;
    }
    this.isAdmin = this.user.type === 'Admin';
  }

  logout() {
    this.auth.fabLogout();
  }
}
