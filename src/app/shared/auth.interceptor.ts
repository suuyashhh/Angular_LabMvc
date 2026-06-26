// src/app/auth/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  
  const isBackendApiRequest = req.url.includes('/api/');
  
  const isSmartParkingProtectedRequest =
    req.url.includes('ParkingProvider/') ||
    req.url.includes('ParkingLogin/validate') ||
    req.url.includes('ParkingLogin/logout');

  const isShopRequest = req.url.includes('LoginShop') || req.url.includes('Shop');
  const isShopLoginRequest = req.url.includes('LoginShop/Login');

  let requestToken = token;
  if (isSmartParkingProtectedRequest) {
    requestToken = localStorage.getItem('parking_token');
  } else if (isShopRequest && !isShopLoginRequest) {
    requestToken = authService.getShopToken();
  }

  const clonedRequest = req.headers.has('Authorization')
    ? req
    : requestToken
      ? req.clone({ setHeaders: { Authorization: `Bearer ${requestToken}` } })
      : req;

  return next(clonedRequest).pipe(
    catchError((err) => {
      if (isSmartParkingProtectedRequest) {
        if (err.status === 401 || err.status === 403) {
          authService.handleParkingSessionExpired(
            'the user loged in other device',
            true
          );
        }
        return throwError(() => err);
      }

      console.log('authInterceptor caught error:', {
        url: req.url,
        isShopRequest,
        isShopLoginRequest,
        status: err.status,
        error: err
      });

      if (isShopRequest && !isShopLoginRequest) {
        if (err.status === 401 || err.status === 403 || err.status === 0) {
          console.log('Detected 401/403/0 shop session expiration. Calling handleShopSessionExpired.');
          authService.handleShopSessionExpired(
            'the user loged in other device',
            true
          );
        }
        return throwError(() => err);
      }

      if (!isBackendApiRequest) {
        return throwError(() => err);
      }

      if (!isShopRequest && (err.status === 401 || err.status === 403 || err.status === 0)) {
        authService.logout();
        router.navigate(['/']);
      }

      return throwError(() => err);
    })
  );
};

