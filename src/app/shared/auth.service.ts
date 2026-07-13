import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { ApiService } from './api.service';
import { LoaderService } from '../services/loader.service';
import { BehaviorSubject, catchError, finalize, of, tap, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private platformId = inject(PLATFORM_ID);
  private parkingUser: any = null;
  private parkingUserSubject = new BehaviorSubject<any>(null);
  public parkingUser$ = this.parkingUserSubject.asObservable();
  private readonly parkingSessionExpiredMessage = 'the user loged in other device';

  constructor(
    private router: Router,
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toaster: ToastrService
  ) {
    this.initParkingUser();
  }

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
    document.cookie = 'shopCredentials=; path=/; max-age=0';
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

/** Fabrication Credentials */
isFabLoggedIn(): boolean {
  if (!isPlatformBrowser(this.platformId)) return false;
  const fab = this.getFabCredentialsFromCookie();
  return !!fab && typeof fab === 'object';
}

setFabCredentialsCookie(value: any, days: number = 7): void {
  try {
    const json = JSON.stringify(value);
    const encoded = encodeURIComponent(json);
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `fabCredentials=${encoded}; path=/; expires=${expires.toUTCString()};`;
  } catch (e) {
    console.error('Failed to set fab cookie', e);
  }
}

getFabCredentialsFromCookie(): any | null {
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'fabCredentials' && value) {
        const decoded = decodeURIComponent(value);
        return JSON.parse(decoded);
      }
    }
  } catch (e) {
    console.error('Failed to read fab cookie', e);
  }
  return null;
}

fabLogout(): void {
  try {
    this.clearFabCredentialsCookie();
    try {
      this.toaster.success('Logged out from Fabrication Portal', 'Logout');
    } catch (e) {
      console.warn('toaster unavailable', e);
    }
    this.router.navigate(['/fab/login']);
  } catch (err) {
    console.error('fabLogout error', err);
    this.router.navigate(['/fab/login']);
  }
}

clearFabCredentialsCookie(): void {
  document.cookie = 'fabCredentials=; path=/; max-age=0';
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


// ===== Tejas SWEETS Shop Auth Methods =====

  private readonly shopSessionExpiredMessage = 'the user loged in other device';

  isShopLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const shopUser = this.getShopCredentialsFromCookie();
    const hasToken = !!this.getShopToken();
    return (!!shopUser && typeof shopUser === 'object') && hasToken;
  }

  getShopToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return localStorage.getItem('shop_token');
    } catch {
      return null;
    }
  }

  setShopCredentialsCookie(value: any, days: number = 30): void {
    try {
      // Exclude user_img from the cookie to keep it under the 4KB browser limit
      const { user_img, ...cookieValue } = value;
      const json = JSON.stringify(cookieValue);
      const encoded = encodeURIComponent(json);
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `shopCredentials=${encoded}; path=/; expires=${expires.toUTCString()};`;
    } catch (e) {
      console.error('Failed to set shop credentials', e);
    }
  }

  getShopCredentialsFromCookie(): any | null {
    try {
      const cookies = document.cookie ? document.cookie.split('; ') : [];
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'shopCredentials' && value) {
          const decoded = decodeURIComponent(value);
          const userObj = JSON.parse(decoded);

          // Restore user_img from localStorage if available in browser
          if (isPlatformBrowser(this.platformId)) {
            try {
              const localUserStr = localStorage.getItem('shop_user');
              if (localUserStr) {
                const localUser = JSON.parse(localUserStr);
                if (localUser && localUser.user_img) {
                  userObj.user_img = localUser.user_img;
                }
              }
            } catch (err) {
              console.warn('Failed to merge user_img from localStorage', err);
            }
          }
          return userObj;
        }
      }
    } catch (e) {
      console.error('Failed to read shop credentials', e);
    }
    return null;
  }

  private shopConflictSubject = new BehaviorSubject<boolean>(false);
  public shopConflict$ = this.shopConflictSubject.asObservable();

  clearShopConflictFlag(): void {
    this.shopConflictSubject.next(false);
  }

  validateShopSession(showExpiredToast: boolean = false) {
    const token = this.getShopToken();
    if (!token) {
      return of(null);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.api.baseurl}LoginShop/validate`, { headers }).pipe(
      tap((response: any) => {
        // Shop session validated successfully
      }),
      catchError((err) => {
        if (err?.status === 401 || err?.status === 403 || err?.status === 0) {
          this.handleShopSessionExpired(this.shopSessionExpiredMessage, showExpiredToast);
        }
        return throwError(() => err);
      })
    );
  }

  handleShopSessionExpired(message: string = this.shopSessionExpiredMessage, showToast: boolean = true): void {
    console.log('handleShopSessionExpired called with message:', message);
    this.shopConflictSubject.next(true);
    this.clearShopSession(showToast, false, message, 'Session Expired');
  }

  private clearShopSession(
    showToast: boolean,
    navigateToLogin: boolean,
    message: string = 'Logged out from Tejas SWEETS',
    title: string = 'Logout'
  ): void {
    document.cookie = 'shopCredentials=; path=/; max-age=0';
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('shopCredentials');
      }
    }

    if (showToast) {
      try {
        if (title === 'Session Expired') {
          this.toaster.warning(message, title);
        } else {
          this.toaster.success(message, title);
        }
      } catch (e) {
        console.warn('toaster unavailable', e);
      }
    }

    if (navigateToLogin) {
      this.router.navigate(['/shop/login']);
    }
  }

  shopLogout(): void {
    const token = this.getShopToken();
    if (!token) {
      this.clearShopSession(true, true);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`${this.api.baseurl}LoginShop/logout`, {}, { headers }).subscribe({
      next: () => this.clearShopSession(true, true),
      error: () => this.clearShopSession(true, true)
    });
  }



// ===== Smart Parking Auth Methods =====

  private initParkingUser(): void {
    if (!isPlatformBrowser(this.platformId) || this.parkingUser) return;

    try {
      const stored = localStorage.getItem('parking_user');
      if (!stored) return;

      this.parkingUser = this.normalizeParkingUser(JSON.parse(stored));
      this.parkingUserSubject.next(this.parkingUser);
    } catch (e) {
      console.warn('LocalStorage access failed or data corrupted', e);
      this.clearParkingSession(false, false);
    }
  }

  private normalizeParkingUser(source: any): any {
    const rawUser = source?.user ?? source ?? {};
    const userId = rawUser.userId ?? rawUser.userid ?? rawUser.USERID ?? null;

    return {
      userId,
      name: rawUser.name ?? rawUser.userName ?? rawUser.NAME ?? '',
      email: rawUser.email ?? rawUser.EMAIL ?? '',
      phone: rawUser.phone ?? rawUser.PHONE ?? '',
      role: rawUser.role ?? 'Parking Provider'
    };
  }

  private getParkingToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return localStorage.getItem('parking_token');
    } catch {
      return null;
    }
  }

  setCurrentUser(parkingSession: any): void {
    const normalizedUser = this.normalizeParkingUser(parkingSession);
    if (!normalizedUser.userId) {
      this.clearParkingSession(false, false);
      return;
    }

    const token = parkingSession?.token ?? this.getParkingToken();

    this.parkingUser = normalizedUser;
    this.parkingUserSubject.next(normalizedUser);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('parking_user', JSON.stringify(normalizedUser));
      if (token) {
        localStorage.setItem('parking_token', token);
      }
    }

  }

  getCurrentUser(): any {
    this.initParkingUser();
    return this.parkingUser;
  }

  isParkingLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    this.initParkingUser();
    const hasUser = !!this.parkingUser?.userId;
    const hasToken = !!this.getParkingToken();

    if (hasUser !== hasToken) {
      this.clearParkingSession(false, false);
      return false;
    }

    return hasUser && hasToken;
  }

  validateParkingSession(showExpiredToast: boolean = false) {
    const token = this.getParkingToken();
    if (!token) {
      if (this.parkingUser?.userId) {
        this.clearParkingSession(false, false);
      }
      return of(null);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.api.baseurl}ParkingLogin/validate`, { headers }).pipe(
      tap((response: any) => {
        if (response?.user) {
          this.setCurrentUser({ token, user: response.user });
        }
      }),
      catchError((err) => {
        if (err?.status === 401 || err?.status === 403) {
          const message = this.parkingSessionExpiredMessage;
          this.clearParkingSession(showExpiredToast, true, message, 'Session Expired');
        }
        return throwError(() => err);
      })
    );
  }

  handleParkingSessionExpired(message: string = this.parkingSessionExpiredMessage, showToast: boolean = true): void {
    this.clearParkingSession(showToast, true, message, 'Session Expired');
  }

  clearParkingClientSessionOnly(): void {
    this.clearParkingSession(false, false);
  }

  parkingLogout(): void {
    const token = this.getParkingToken();
    if (!token) {
      this.clearParkingSession(true, true);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`${this.api.baseurl}ParkingLogin/logout`, {}, { headers }).subscribe({
      next: () => this.clearParkingSession(true, true),
      error: () => this.clearParkingSession(true, true)
    });
  }

  private clearParkingSession(
    showToast: boolean,
    navigateToLogin: boolean,
    message: string = 'Logged out from Parking',
    title: string = 'Logout'
  ): void {
    this.parkingUser = null;
    this.parkingUserSubject.next(null);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('parking_user');
      localStorage.removeItem('parking_token');
      localStorage.removeItem('smartparking usercredentials');
    }

    if (showToast) {
      try {
        if (title === 'Session Expired') {
          this.toaster.warning(message, title);
        } else {
          this.toaster.success(message, title);
        }
      } catch (e) {
        console.warn('toaster unavailable', e);
      }
    }

    if (navigateToLogin) {
      this.router.navigateByUrl('/parking/dashboard', { replaceUrl: true });
    }
  }

}
