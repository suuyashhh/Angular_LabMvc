import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-login-heat-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login-heat-management.component.html',
  styleUrl: './login-heat-management.component.css'
})
export class LoginHeatManagementComponent implements OnInit {
  isLoginMode = true;

  loginData: any = {
    username: '',
    email: '',
    user_name: '',
    contact: '',
    password: '',
    role: 'Operator',
    rememberMe: true
  };

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService,
    private loader: LoaderService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.auth.isWasteHeatLoggedIn()) {
      this.router.navigate(['/heatmanagement/data-server']);
    }

    this.route.queryParams.subscribe(params => {
      if (params['autoLogin'] === 'true') {
        this.loginData.username = params['u'] || '';
        this.loginData.password = params['p'] || '';
        if (this.loginData.username && this.loginData.password) {
          setTimeout(() => {
            this.login();
          }, 150);
        }
      }
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.loginData = {
      username: '',
      email: '',
      user_name: '',
      contact: '',
      password: '',
      role: 'Operator',
      rememberMe: true
    };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  fillDemoCredentials(role: 'admin' | 'operator' = 'operator'): void {
    this.errorMessage = '';
    this.isLoginMode = true;
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

  login(): void {
    this.errorMessage = '';

    const usernameOrEmail = (this.loginData.username || '').trim();
    const password = (this.loginData.password || '').trim();

    if (!usernameOrEmail || !password) {
      this.errorMessage = 'Please enter your username/email and password.';
      this.toastr.warning(this.errorMessage, 'Validation');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const payload = {
      user_name: usernameOrEmail,
      email: usernameOrEmail,
      contact: usernameOrEmail,
      password: password
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.api.baseurl}LoginWastHeat/Login`;

    this.http.post(url, payload, { headers })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loader.hide();
        })
      )
      .subscribe({
        next: (res: any) => {
          if (res && (res.user_id || res.user_name)) {
            // Save details to localStorage & cookie like DairyFarm
            const expiryDays = this.loginData.rememberMe ? 30 : 1;
            this.auth.setWasteHeatCredentials(res, expiryDays);

            const displayName = res.user_name || res.email || 'Operator';
            this.toastr.success(`Welcome back, ${displayName}! Login Successful.`, 'Waste Heat Access');
            this.router.navigate(['/heatmanagement/data-server']);
          } else {
            this.errorMessage = 'Invalid username or password.';
            this.toastr.error(this.errorMessage, 'Login Failed');
          }
        },
        error: (err: any) => {
          console.error('Waste Heat Login error', err);
          const serverMsg = typeof err?.error === 'string' 
            ? err.error 
            : (err?.error?.message || 'Invalid username or password. Please try again.');
          this.errorMessage = serverMsg;
          this.toastr.error(serverMsg, 'Authentication Failed');
        }
      });
  }

  register(): void {
    this.errorMessage = '';

    const userName = (this.loginData.user_name || '').trim();
    const email = (this.loginData.email || '').trim();
    const contact = (this.loginData.contact || '').trim();
    const password = (this.loginData.password || '').trim();

    if (!userName || !email || !password) {
      this.errorMessage = 'Please fill in Name, Work Email, and Password.';
      this.toastr.warning(this.errorMessage, 'Validation');
      return;
    }

    if (password.length < 4) {
      this.errorMessage = 'Password must be at least 4 characters.';
      this.toastr.warning(this.errorMessage, 'Validation');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const payload = {
      user_name: userName,
      email: email,
      contact: contact,
      password: password,
      role: this.loginData.role || 'Operator'
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.api.baseurl}LoginWastHeat/Register`;

    this.http.post(url, payload, { headers })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loader.hide();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.toastr.success('Registration Successful! You can now sign in.', 'Success');
          this.toggleMode();
          this.loginData.username = email || userName;
        },
        error: (err: any) => {
          console.error('Waste Heat Registration error', err);
          const serverMsg = typeof err?.error === 'string'
            ? err.error
            : (err?.error?.message || 'User with this email/username already exists or registration failed.');
          this.errorMessage = serverMsg;
          this.toastr.error(serverMsg, 'Registration Error');
        }
      });
  }

  onForgotPassword(): void {
    this.toastr.info(
      'Please contact your Facility Administrator to reset your access key.',
      'Password Recovery'
    );
  }
}
