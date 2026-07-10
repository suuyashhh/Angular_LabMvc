import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  isSidebarOpen = false;
  showBackupModal = false;
  backupLoading = false;
  notification = '';

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/market/login']);
  }

  openBackupModal() {
    this.showBackupModal = true;
    this.notification = '';
  }

  closeBackupModal() {
    if (!this.backupLoading) {
      this.showBackupModal = false;
    }
  }

  exportData() {
    this.backupLoading = true;
    this.notification = '';

    this.apiService.exportBackup().subscribe({
      next: (data) => {
        this.backupLoading = false;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `vegbook_backup_${dateStr}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notification = 'Backup file downloaded successfully!';
      },
      error: () => {
        this.backupLoading = false;
        this.notification = 'Export failed. Please try again.';
      }
    });
  }

  importData(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.hotels || !data.vegetables || !data.purchaseEntries) {
          this.notification = 'Invalid backup file structure.';
          return;
        }

        this.backupLoading = true;
        this.notification = '';

        this.apiService.importBackup(data).subscribe({
          next: (res) => {
            this.backupLoading = false;
            this.notification = 'Data restored successfully! Page will refresh.';
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          },
          error: (err) => {
            this.backupLoading = false;
            this.notification = err.error?.message || 'Restore failed. Check file compatibility.';
          }
        });
      } catch (err) {
        this.notification = 'Failed to parse JSON file.';
      }
    };
    reader.readAsText(file);
  }
}
