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
  const isSmartParkingProtectedRequest =
    req.url.includes('/ParkingProvider/') ||
    req.url.includes('/ParkingLogin/validate') ||
    req.url.includes('/ParkingLogin/logout');

  const clonedRequest = req.headers.has('Authorization')
    ? req
    : token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
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

    if (err.status === 401 || err.status === 403 || err.status === 0) {
      authService.logout();
      router.navigate(['/']);
    }

    return throwError(() => err);
  })
);

};

