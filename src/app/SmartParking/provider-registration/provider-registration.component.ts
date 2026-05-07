import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-provider-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './provider-registration.component.html',
  styleUrls: ['./provider-registration.component.css']
})
export class ProviderRegistrationComponent {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private toastr = inject(ToastrService);
  private loader = inject(LoaderService);

  hidePassword = true;
  isLoading = false;
  errorMessage = '';

  regData = {
    NAME: '',
    EMAIL: '',
    PHONE: '',
    PASS: '',
    confirmPass: ''
  };

  currentYear = new Date().getFullYear();

  onRegister() {
    if (!this.regData.NAME || !this.regData.EMAIL || !this.regData.PHONE || !this.regData.PASS) {
      this.toastr.warning('Please fill in all required fields.');
      return;
    }

    if (this.regData.PASS !== this.regData.confirmPass) {
      this.toastr.error('Passwords do not match.');
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const body = {
      NAME: this.regData.NAME,
      EMAIL: this.regData.EMAIL,
      PHONE: this.regData.PHONE,
      PASS: this.regData.PASS
    };

    this.loader.withLoader(
      this.apiService.post('ParkingRegistration/Register', body)
    ).subscribe({
      next: (response: any) => {
        this.toastr.success('Registration successful!', 'Success');
        this.isLoading = false;
        setTimeout(() => {
        this.router.navigate(['/parking/provider-login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.apiService.extractErrorMessage(err);
        this.toastr.error(this.errorMessage, 'Registration Failed');
      }
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
