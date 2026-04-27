import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-provider-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './provider-login.component.html',
  styleUrls: ['./provider-login.component.css']
})
export class ProviderLoginComponent {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private loader = inject(LoaderService);
  hidePassword = true;
  isEmailFocused = false;
  isPasswordFocused = false;
  isLoading = false;
  errorMessage = '';

  loginData = {
    phone: '',
    password: '',
    remember: true
  };

  currentYear = new Date().getFullYear();

  onLogin() {
    if (!this.loginData.phone || !this.loginData.password) {
      this.toastr.warning('Please enter both phone and password.');
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const body = { PHONE: this.loginData.phone, PASS: this.loginData.password };

    this.loader.withLoader(
      this.apiService.post('ParkingLogin/login', body)
    ).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
        this.toastr.success('Login successful!', 'Welcome');
        this.isLoading = false;

        if (response) {
          this.authService.setCurrentUser(response);
        }

        // Premium touch: small delay for visual feedback
        setTimeout(() => {
          this.router.navigate(['/Parking/dashboard']);
        }, 800);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.apiService.extractErrorMessage(err);
        this.toastr.error(this.errorMessage, 'Login Failed');
        console.error('Auth error:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/Parking']);
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}

