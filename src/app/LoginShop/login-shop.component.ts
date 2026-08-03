import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';
import { LoaderService } from '../services/loader.service';

@Component({
  selector: 'app-login-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-shop.component.html',
  styleUrl: './login-shop.component.css'
})
export class LoginShopComponent implements OnInit {
  loginObj: any = {
    username: '',
    password: ''
  };
  isLoading = false;
  showPassword = false;

  private http = inject(HttpClient);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private loader = inject(LoaderService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  ngOnInit() {
    if (this.auth.isShopLoggedIn()) {
      this.router.navigate(['/shop/dashboard']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (!this.loginObj.username || !this.loginObj.password) {
      this.toastr.error('Please enter username and password', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.api.baseurl}LoginShop/Login`;

    const payload = {
      CONTACT: this.loginObj.username,
      PASS: this.loginObj.password
    };

    this.http.post(url, payload, { headers })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loader.hide();
      }))
      .subscribe({
        next: (res: any) => {
          const rawUser = res?.userDetails || res?.user || res;
          if (rawUser && (rawUser.useR_ID || rawUser.USER_ID || rawUser.userId)) {
            const userObj = {
              userId: rawUser.useR_ID || rawUser.USER_ID || rawUser.userId,
              name: rawUser.useR_NAME || rawUser.USER_NAME || rawUser.userName,
              username: rawUser.useR_NAME || rawUser.USER_NAME || rawUser.userName,
              role: 'Administrator',
              user_img: rawUser.useR_IMG || rawUser.USER_IMG || rawUser.userImg || rawUser.user_img
            };

            localStorage.setItem('shop_user', JSON.stringify(userObj));
            if (res?.token) {
              localStorage.setItem('shop_token', res.token);
            }

            this.auth.setShopCredentialsCookie(userObj, 365);
            this.toastr.success('Welcome back!', 'Login Successful');
            this.router.navigate(['/shop/dashboard']);
          } else {
            this.toastr.error('Invalid credentials. Please try again.', 'Login Failed');
            this.router.navigate(["shop"]);
          }
        },
        error: (err: any) => {
          console.error('Backend login failed:', err);
          const errorMsg = err?.error?.message || err?.error || 'Connection error or invalid credentials';
          this.toastr.error(errorMsg, 'Login Failed');
          this.router.navigate(["shop"]);
        }
      });
  }
}
