import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as CryptoJS from 'crypto-js';
import { AuthService } from '../shared/auth.service';
import { ToastrService } from 'ngx-toastr';


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

  constructor(private router: Router, private auth: AuthService,
      private toastr: ToastrService,) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      var user = this.auth.getUser();
      console.log(user);

      // this.router.navigate([user.useR_LOGIN]);
      if(user.useR_LOGIN == "LABADMIN" || user.useR_LOGIN == "EMPLOYEE"){
            this.router.navigate(["LABADMIN"]);
          }else if(user.useR_LOGIN == "ADMIN"){
            this.router.navigate(["ADMIN"]);
          }
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
          if(res.userDetails.useR_LOGIN == "LABADMIN" || res.userDetails.useR_LOGIN == "EMPLOYEE" ){
            this.router.navigate(["LABADMIN"]);
          }else if(res.userDetails.useR_LOGIN == "ADMIN"){
            this.router.navigate(["ADMIN"]);
          }
        } else {
          alert('Login failed');
        }
      },
      error: (err: any) => {
        this.isLoading = false; // ✅ Hide loader
        console.error('Login error:', err);
       this.toastr.error('Invalid User', 'Invalid');
       this.router.navigate(["lab"]);
      }
    });
  }
}

