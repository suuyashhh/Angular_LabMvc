import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar" [class.mobile-open]="isSidebarOpen">
        <div class="sidebar-brand d-flex align-items-center gap-3">
          <div class="brand-logo-small">
            <i class="bi bi-egg-fried text-white"></i>
          </div>
          <div>
            <h4 class="mb-0 fw-bold brand-name">VegBook</h4>
            <span class="brand-tag">PURCHASE LEDGER</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/market/dashboard" routerLinkActive="active" class="nav-item">
            <i class="bi bi-grid-fill"></i>
            <span>Dashboard</span>
          </a>
          
          <a routerLink="/market/hotels" routerLinkActive="active" class="nav-item">
            <i class="bi bi-building"></i>
            <span>Hotels</span>
          </a>

          <a routerLink="/market/vegetables" routerLinkActive="active" class="nav-item">
            <i class="bi bi-egg-fried"></i>
            <span>Vegetables</span>
          </a>

          <div class="px-3 my-4">
            <button routerLink="/market/purchase/add" class="btn btn-accent-orange w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm">
              <i class="bi bi-plus-lg"></i>
              <span>Add Entry</span>
            </button>
          </div>
          
          <button (click)="openBackupModal()" class="nav-item mt-auto border-0 bg-transparent text-start w-100">
            <i class="bi bi-arrow-down-up"></i>
            <span>Backup Data</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <span class="small text-muted">V1.0 - ONLINE READY</span>
        </div>
      </aside>

      <!-- Sidebar Overlay for mobile -->
      <div class="sidebar-overlay" *ngIf="isSidebarOpen" (click)="toggleSidebar()"></div>

      <!-- Main Content Panel -->
      <div class="main-panel">
        <header class="main-header d-flex justify-content-between align-items-center px-4 no-print">
          <button class="btn d-lg-none p-0 border-0" (click)="toggleSidebar()">
            <i class="bi bi-list fs-3"></i>
          </button>

          <div class="ms-auto d-flex align-items-center gap-3">
            <span class="user-name d-none d-md-inline">Welcome, <strong>{{ authService.currentUserValue?.username }}</strong></span>
            <button (click)="onLogout()" class="btn btn-outline-danger btn-sm d-flex align-items-center gap-2">
              <i class="bi bi-box-arrow-right"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <!-- Main Body -->
        <main class="content-body p-4">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Backup Modal Overlay -->
      <div class="modal fade show" [class.d-block]="showBackupModal" tabindex="-1" style="background: rgba(0,0,0,0.5);" *ngIf="showBackupModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
            <div class="modal-header border-bottom-0 pb-0">
              <h5 class="modal-title fw-bold">Data Management</h5>
              <button type="button" class="btn-close" (click)="closeBackupModal()"></button>
            </div>
            
            <div class="modal-body p-4">
              <p class="text-muted small">Export system entries into a JSON file, or restore from a previous backup file.</p>
              
              <div *ngIf="notification" class="alert alert-info text-center py-2 fs-7 small mb-3">
                {{ notification }}
              </div>

              <div class="row g-3">
                <div class="col-6">
                  <button (click)="exportData()" class="btn btn-light-custom w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2" [disabled]="backupLoading">
                    <i class="bi bi-download fs-4 text-success"></i>
                    <span class="fw-bold">Export JSON</span>
                  </button>
                </div>
                <div class="col-6">
                  <label class="btn btn-light-custom w-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 cursor-pointer mb-0" [class.disabled]="backupLoading">
                    <i class="bi bi-upload fs-4 text-warning"></i>
                    <span class="fw-bold">Import JSON</span>
                    <input type="file" (change)="importData($event)" class="d-none" accept=".json" [disabled]="backupLoading">
                  </label>
                </div>
              </div>

              <div *ngIf="backupLoading" class="text-center mt-3">
                <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                <span class="ms-2 small text-muted">Processing...</span>
              </div>
            </div>

            <div class="modal-footer border-top-0 pt-0">
              <button type="button" class="btn btn-light-custom w-100" (click)="closeBackupModal()" [disabled]="backupLoading">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 250px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      height: 100%;
      z-index: 100;
      transition: transform 0.3s ease;
    }

    .sidebar-brand {
      padding: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .brand-logo-small {
      width: 40px;
      height: 40px;
      background: var(--primary-color);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .brand-name {
      font-size: 1.25rem;
      color: var(--text-main);
      letter-spacing: -0.5px;
    }

    .brand-tag {
      font-size: 9px;
      letter-spacing: 1px;
      color: var(--text-light);
      font-weight: 600;
    }

    .sidebar-nav {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 14.5px;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background-color: #f7f8f5;
      color: var(--text-main);
    }

    .nav-item.active {
      background-color: var(--primary-color);
      color: #ffffff !important;
    }

    .sidebar-footer {
      padding: 20px 24px;
      border-top: 1px solid var(--border-color);
    }

    /* Main Panel */
    .main-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .main-header {
      height: 70px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }

    .content-body {
      flex: 1;
      overflow-y: auto;
      background-color: var(--bg-color);
    }

    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.3);
      z-index: 99;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    /* Mobile Responsive */
    @media (max-width: 992px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        transform: translateX(-100%);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
    }
  `]
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
