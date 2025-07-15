import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private platformId = inject(PLATFORM_ID);

  constructor(private router:Router,private http:HttpClient) { }

  generateUUIDToken(): string {
    return uuidv4();
  }


  setToken(token:any){
    localStorage.setItem('token', token.token);
    localStorage.setItem('token_expiration', token.expiration);
    localStorage.setItem('userDetails', JSON.stringify(token.userDetails));

    document.cookie = `authToken=${token.token}; path=/; max-age=${60 * 60 * 24}`;
  }

  getToken(){
    return localStorage.getItem("token");
  }

  getTokenFromCookies(): string | null {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'authToken') {
        return value;
      }
    }
    return null;
  }

  isTokenValid(): boolean {
    const localStorageToken = this.getToken();
    const cookieToken = this.getTokenFromCookies();

    return localStorageToken !== null && cookieToken !== null && localStorageToken === cookieToken;
  }

  isLoggedIn(): boolean {
    if (this.isTokenValid()) { // Check if running in the browser
      return true; // Now safe to access localStorage
    }
    return false; // Return false if running on the server
  }
  logout(){
    localStorage.clear();
    this.router.navigate(['/'])
  }
  login(data:any):any{
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post("https://localhost:7193/api/Login/Login", data, { headers });
  }
}
