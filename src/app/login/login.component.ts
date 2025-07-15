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
  res:any;

  private secretKey: string = 'mySecretKey123'; // Consider securing this

  constructor(private router: Router,private auth:AuthService) {}

  ngOnInit() {
    if(this.auth.isLoggedIn()){
      this.router.navigate(['labadmin']);
    }
    // if (this.isLocalStorageAvailable()) {
    //   if (!localStorage.getItem('username')) {
    //     localStorage.setItem('username', 'Atharv');
    //     localStorage.setItem('password', this.encryptPassword('Atharv123'));
    //   }
    // }
  }

  // isLocalStorageAvailable(): boolean {
  //   try {
  //     const testKey = '__test__';
  //     localStorage.setItem(testKey, 'test');
  //     localStorage.removeItem(testKey);
  //     return true;
  //   } catch (e) {
  //     return false;
  //   }
  // }

  // encryptPassword(password: string): string {
  //   return CryptoJS.AES.encrypt(password, this.secretKey).toString();
  // }

  // decryptPassword(encryptedPassword: string): string {
  //   const bytes = CryptoJS.AES.decrypt(encryptedPassword, this.secretKey);
  //   return bytes.toString(CryptoJS.enc.Utf8);
  // }

  // login() {
  //   if (!this.isLocalStorageAvailable()) {
  //     alert('Local storage is not available. Please enable it or use another browser.');
  //     return;
  //   }

  //   const storedUsername = localStorage.getItem('username');
  //   const storedEncryptedPassword = localStorage.getItem('password');

  //   if (!storedUsername || !storedEncryptedPassword) {
  //     alert('No user found!');
  //     return;
  //   }

  //   const decryptedPassword = this.decryptPassword(storedEncryptedPassword);

  //   if (
  //     this.loginObj.username === storedUsername &&
  //     this.loginObj.password === decryptedPassword
  //   ) {
  //     this.router.navigate(['labadmin']);
  //   } else {
  //     alert('Invalid Credentials');
  //   }
  // }
  login(){
    // this.res = this.auth.login(this.loginObj);

    // if(this.res.status == "success"){
    //   this.router.navigate(['labadmin']);
    // }
    // else
    // {
    //   alert("User Not Found");

    // }
    this.auth.login(this.loginObj).subscribe({
      next: (result: any) => {
        console.log('Login success:', result);
        this.auth.setToken(result);
        alert('Login successful!');
        this.router.navigate(['labadmin']);
        // Navigate to dashboard or other page here
      },
      error: (error:any) => {
        console.error('Login failed:', error);
        alert('Invalid credentials or server error.');
      }
    });

  }
}
