import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login-heat-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login-heat-management.component.html',
  styleUrl: './login-heat-management.component.css'
})
export class LoginHeatManagementComponent {
  loginData = {
    username: '',
    password: '',
    rememberMe: true
  };

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private toastr: ToastrService
  ) {}

  /**
   * Toggle password text visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Pre-fill demo credentials for quick evaluation/testing
   */
  fillDemoCredentials(role: 'admin' | 'operator' = 'operator'): void {
    this.errorMessage = '';
    if (role === 'admin') {
      this.loginData.username = 'furnace.admin@thermal.lab';
      this.loginData.password = 'ThermalAdmin#2026';
      this.toastr.info('Filled Administrator demo credentials', 'Demo Mode');
    } else {
      this.loginData.username = 'operator.heat@thermal.lab';
      this.loginData.password = 'Operator#8820';
      this.toastr.info('Filled Operator demo credentials', 'Demo Mode');
    }
  }

  /**
   * Process user login
   */
  login(): void {
    this.errorMessage = '';

    const username = this.loginData.username.trim();
    const password = this.loginData.password.trim();

    if (!username) {
      this.errorMessage = 'Please enter your Operator ID or Username.';
      this.toastr.warning(this.errorMessage, 'Missing Username');
      return;
    }

    if (!password) {
      this.errorMessage = 'Please enter your security access password.';
      this.toastr.warning(this.errorMessage, 'Missing Password');
      return;
    }

    if (password.length < 4) {
      this.errorMessage = 'Password must be at least 4 characters long.';
      this.toastr.error(this.errorMessage, 'Invalid Password');
      return;
    }

    this.isLoading = true;

    // Simulate authenticating against thermal telemetry gateway
    setTimeout(() => {
      this.isLoading = false;
      this.toastr.success(
        `Welcome back, ${username}! Access granted to Furnace & Thermal Control.`,
        'Authentication Successful'
      );
      this.router.navigate(['/heatmanagement/dashboard']);
    }, 600);
  }

  /**
   * Forgot password helper
   */
  onForgotPassword(): void {
    this.toastr.info(
      'Please contact your Thermal Operations Facility Administrator to reset your access key.',
      'Password Recovery'
    );
  }
}

