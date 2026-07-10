import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
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
