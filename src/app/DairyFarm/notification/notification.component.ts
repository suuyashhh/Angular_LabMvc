import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  notifications: any[] = [];
  isLoading = false;
  userId = 0;
  lastUpdated = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.auth.isDairyLoggedIn()) {
      this.router.navigate(['/dairyfarm']);
      return;
    }

    const dairy = this.auth.getDairyCredentialsFromCookie();
    this.userId = dairy?.user_id || 0;

    if (this.userId > 0) {
      this.loadNotifications();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.isLoading = true;

    // Show skeleton loader immediately
    this.notifications = Array(3).fill({}).map((_, i) => ({
      id: i,
      skeleton: true
    }));

    this.api.get(`Notification/Breeding/${this.userId}`)
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300) // Prevent rapid calls
      )
      .subscribe({
        next: (res: any) => {
          if (Array.isArray(res)) {
            this.notifications = res;
            this.lastUpdated = new Date().toLocaleTimeString();
          } else {
            this.notifications = [];
          }
          this.isLoading = false;
        },
        error: () => {
          this.notifications = [];
          this.isLoading = false;
        }
      });
  }

  markChecked(id: number): void {
    if (!id) return;

    // Optimistic update
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      const checkedItem = this.notifications[index];
      this.notifications = this.notifications.filter(n => n.id !== id);

      this.api.post(`Notification/Check/${id}`, {}).subscribe({
        error: () => {
          // Re-add if error
          this.notifications.splice(index, 0, checkedItem);
        }
      });
    }
  }

  refreshNotifications(): void {
    this.loadNotifications();
  }
}