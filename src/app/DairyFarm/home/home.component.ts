import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],   // ✅ REQUIRED FOR *ngIf
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  userName: string | null = null;
  notificationCount = 0;
  showLogoutConfirm = false;

  constructor(
    private auth: AuthService,
    private loader: LoaderService,
    private toastr: ToastrService,
    private api: ApiService
  ) { }

  ngOnInit() {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (dairy && dairy.user_name) {
      this.userName = dairy.user_name;
    }

    this.loadNotificationCount();
    this.updateBreedingNotification();
  }

  dairyLogout(): void {
    try { this.loader.show(); } catch { }

    try {
      this.auth.dairyLogout();
    } finally {
      setTimeout(() => {
        try { this.loader.hide(); } catch { }
      }, 200);
    }
  }

  loadNotificationCount() {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return;

    const userId = dairy.user_id;

    this.api.get(`Notification/Count/${userId}`).subscribe({
      next: (res: any) => {
        this.notificationCount = Number(res) || 0;

        // ✅ fire toastr only if there are notifications
        if (this.notificationCount > 0) {
          this.toastr.warning(
            `You have ${this.notificationCount} pending notification.`,
            'Check Notification'
          );

        }
      },
      error: () => {
        this.notificationCount = 0;
      }
    });
  }

  private updateBreedingNotification(): void {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    const userId = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;

    this.api.get(`Notification/Breeding/${userId}`)
      .subscribe({
        next: (res: any) => {
          if (Array.isArray(res)) {
            //this.toastr.success('Breeding Table Updated');
          }
        },
        error: () => {
          console.error('Breeding notification update failed');
        }
      });
  }


confirmLogout(): void {
  this.showLogoutConfirm = true;
}

logoutConfirmed(): void {
  this.showLogoutConfirm = false;
  this.dairyLogout();
}

}
