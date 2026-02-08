import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { ApiService } from './api.service';
import { LoaderService } from '../services/loader.service';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private platformId = inject(PLATFORM_ID);

  constructor(
    private router: Router,
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toaster: ToastrService
  ) { }

  // Generate UUID (optional utility)
  generateUUIDToken(): string {
    return uuidv4();
  }

  // Set token and user data in localStorage and cookie
  setToken(res: any): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('userDetails', JSON.stringify(res.userDetails));
    document.cookie = `authToken=${res.token}; path=/`;
  }

  // Get current user object
  getUser(): any {
    const userJson = localStorage.getItem('userDetails');
    return userJson ? JSON.parse(userJson) : null;
  }

  // Get JWT token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get token from cookies
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

  // Check if token in localStorage matches cookie
  // isTokenValid(): boolean {
  //   const localStorageToken = this.getToken();
  //   const cookieToken = this.getTokenFromCookies();
  //   return !!localStorageToken && localStorageToken === cookieToken;
  // }

  isTokenValid(): boolean {
    const token = this.getToken();
    return !!token; // only rely on localStorage
  }

  // Return true if logged in
  isLoggedIn(): boolean {
    return isPlatformBrowser(this.platformId) && this.isTokenValid();
  }

  // API: Login
  login(credentials: any) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.api.baseurl}Login/Login`, credentials, { headers });
  }

  // API: Logout
  logout(): void {
    const token = this.getToken();

    if (!token) {
      this.clearLocalSession();
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    this.loader.show();

    this.http.post(`${this.api.baseurl}Login/Logout`, {}, { headers })
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.loader.hide();
            this.toaster.success('Logout Successful!', 'Logout'); // ✅ show after loader hide
          }, 300);
        })
      )
      .subscribe({
        next: () => this.clearLocalSession(),
        error: () => this.clearLocalSession()
      });
  }


  // Clear session from browser
  private clearLocalSession(): void {
    localStorage.clear();
    document.cookie = 'authToken=; path=/; max-age=0';
    this.router.navigate(['/lab']);
  }











/**
 * Set a dairy-login cookie (JSON value). Encodes value and sets expiry days (default 7).
 * NOTE: for real security use server-set HttpOnly cookie instead.
 */
isDairyLoggedIn(): boolean {
  // keep same platform check as isLoggedIn
  if (!isPlatformBrowser(this.platformId)) return false;

  const dairy = this.getDairyCredentialsFromCookie();
  // You can add stronger checks here (e.g. required fields)
  return !!dairy && typeof dairy === 'object';
}

setDairyCredentialsCookie(value: any, days: number = 7): void {
  try {
  const json = JSON.stringify(value);
  const encoded = encodeURIComponent(json);
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `dairyCredentials=${encoded}; path=/; expires=${expires.toUTCString()};`;
   } catch (e) {
    console.error('Failed to set dairy cookie', e);
  }
}

/** Get the dairy credentials cookie and parse it (returns object or null) */
getDairyCredentialsFromCookie(): any | null {
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'dairyCredentials' && value) {
        const decoded = decodeURIComponent(value);
        return JSON.parse(decoded);
      }
    }
  } catch (e) {
    console.error('Failed to read dairy cookie', e);
  }
  return null;
}

/** Log out dairy user: clear dairy cookie/local info and navigate to dairy login */
dairyLogout(): void {
  try {
    this.clearDairyCredentialsCookie();

    try {
      this.toaster.success('Logged out from Dairy Farm', 'Logout');
    } catch (e) {
      console.warn('toaster unavailable', e);
    }

    // Navigate to dairy login page
    this.router.navigate(['/dairyfarm']);
  } catch (err) {
    console.error('dairyLogout error', err);
    // ensure navigation happens even on error
    this.router.navigate(['/dairyfarm']);
  }
}


/** Remove the dairy credentials cookie */
clearDairyCredentialsCookie(): void {
  // set cookie expiry to past
  document.cookie = 'dairyCredentials=; path=/; max-age=0';
}






/**Farm Credentials
 */
isFarmUserLoggedIn(): boolean {
  if (!isPlatformBrowser(this.platformId)) return false;

  const farm = this.getFarmUserDetailsFromCookie();
  return !!farm && typeof farm === 'object';
}

setFarmUserDetailsCookie(value: any, days: number = 7): void {
  try {
  const json = JSON.stringify(value);
  const encoded = encodeURIComponent(json);
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `FarmCredentials=${encoded}; path=/; expires=${expires.toUTCString()};`;
   } catch (e) {
    console.error('Failed to set Farm cookie', e);
  }
}

getFarmUserDetailsFromCookie(): any | null {
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'FarmCredentials' && value) {
        const decoded = decodeURIComponent(value);
        return JSON.parse(decoded);
      }
    }
  } catch (e) {
    console.error('Failed to read Farm cookie', e);
  }
  return null;
}

farmLogout(): void {
  try {
    this.clearFarmUserDetailsCookie();

    try {
      this.toaster.success('Logged out from Farm', 'Logout');
    } catch (e) {
      console.warn('toaster unavailable', e);
    }

    // Navigate to login page
    this.router.navigate(['/farm']);
  } catch (err) {
    console.error('Logout error', err);
    this.router.navigate(['/farm']);
  }
}


clearFarmUserDetailsCookie(): void {
  document.cookie = 'FarmCredentials=; path=/; max-age=0';
}

}
