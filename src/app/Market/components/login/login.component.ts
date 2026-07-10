import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="container-fluid h-100 p-0">
        <div class="row g-0 h-100">
          <!-- Left side brand panel -->
          <div class="col-lg-6 d-none d-lg-flex brand-panel align-items-center justify-content-center text-center">
            <div class="brand-content">
              <div class="brand-logo-container mb-4">
                <i class="bi bi-egg-fried brand-logo-icon"></i>
              </div>
              <h1 class="brand-title text-white mb-2">VegBook</h1>
              <p class="brand-subtitle text-white-50">PURCHASE LEDGER</p>
              <div class="divider my-4"></div>
              <p class="brand-description">
                A premium, modern, and mobile-friendly purchase management tool designed specifically for tracking vegetable supplies to top hotels.
              </p>
            </div>
          </div>
          
          <!-- Right side form panel -->
          <div class="col-lg-6 d-flex align-items-center justify-content-center bg-light">
            <div class="login-card-container">
              <div class="login-card">
                <!-- Mobile Logo -->
                <div class="d-lg-none text-center mb-4">
                  <div class="mobile-logo-circle mb-2">
                    <i class="bi bi-egg-fried text-white"></i>
                  </div>
                  <h3 class="mb-0 fw-bold" style="color: var(--primary-color);">VegBook</h3>
                  <span class="text-muted small">PURCHASE LEDGER</span>
                </div>

                <div class="text-start mb-4 d-none d-lg-block">
                  <h2 class="fw-bold mb-1" style="color: var(--text-main);">Welcome Back</h2>
                  <p class="text-muted small">Enter your credentials to access the ledger.</p>
                </div>

                <div *ngIf="errorMessage" class="alert alert-danger mb-4 d-flex align-items-center" role="alert">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{{ errorMessage }}</div>
                </div>

                <form (ngSubmit)="onLogin()">
                  <div class="mb-3">
                    <label for="username" class="form-label text-uppercase fw-semibold" style="font-size: 11px; letter-spacing: 0.5px;">Username</label>
                    <div class="input-group">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-person text-muted"></i></span>
                      <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        class="form-control border-start-0" 
                        [(ngModel)]="username" 
                        placeholder="Enter username"
                        required
                        [disabled]="isLoading">
                    </div>
                  </div>

                  <div class="mb-4">
                    <label for="password" class="form-label text-uppercase fw-semibold" style="font-size: 11px; letter-spacing: 0.5px;">Password</label>
                    <div class="input-group">
                      <span class="input-group-text bg-white border-end-0"><i class="bi bi-lock text-muted"></i></span>
                      <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        class="form-control border-start-0" 
                        [(ngModel)]="password" 
                        placeholder="Enter password"
                        required
                        [disabled]="isLoading">
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    class="btn btn-primary-green w-100 py-3 d-flex align-items-center justify-content-center gap-2" 
                    [disabled]="isLoading">
                    <span *ngIf="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
                  </button>
                </form>

                <div class="text-center mt-4">
                  <span class="text-muted small">Default Demo Account: <strong style="color: var(--primary-color);">admin / admin</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: var(--bg-color);
    }
    .brand-panel {
      background: linear-gradient(135deg, #1b4320 0%, #2b5c2e 100%);
      height: 100%;
      position: relative;
    }
    .brand-content {
      max-width: 460px;
      padding: 40px;
      color: #ffffff;
    }
    .brand-logo-container {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    .brand-logo-icon {
      font-size: 38px;
      color: #ffffff;
    }
    .brand-title {
      font-size: 3.2rem;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
    }
    .brand-description {
      font-size: 16px;
      line-height: 1.6;
      color: #c9dfca;
      font-weight: 300;
    }
    
    .login-card-container {
      width: 100%;
      max-width: 440px;
      padding: 24px;
    }
    .login-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
    }
    .mobile-logo-circle {
      width: 60px;
      height: 60px;
      background: var(--primary-color);
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    .input-group-text {
      border: 1px solid var(--border-color);
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/market/dashboard']);
    }
  }

  onLogin() {
    if (!this.username || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Pass password as either raw or simple SHA256 hashed. Our auth controller takes raw and hashes it!
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/market/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check credentials.';
      }
    });
  }
}
