import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as CryptoJS from 'crypto-js';
import { AuthService } from '../shared/auth.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginObj: any = {
    contact: '',
    password: ''
  };
  res: any;
  isLoading = false; // ✅ Add this line

  private secretKey: string = 'mySecretKey123';

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['labadmin']);
    }
  }

  login() {
    this.isLoading = true; // ✅ Show loader
    this.auth.login(this.loginObj).subscribe({
      next: (res: any) => {
        this.isLoading = false; // ✅ Hide loader
        console.log('Login response:', res);
        if (res.token) {
          this.auth.setToken(res);
          this.router.navigate(['labadmin']);
        } else {
          alert('Login failed');
        }
      },
      error: (err: any) => {
        this.isLoading = false; // ✅ Hide loader
        console.error('Login error:', err);
        alert('Invalid credentials or server error');
      }
    });
  }
}

