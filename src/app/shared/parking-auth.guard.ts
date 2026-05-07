import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const parkingAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const currentPath = ((state.url.split('?')[0] || '/parking').replace(/\/+$/, '') || '/parking').toLowerCase();
  const publicPages = new Set([
    '/parking/dashboard',
    '/parking/provider-login',
    '/parking/provider-registration',
    '/parking/parking-seeker'
  ]);

  if (currentPath === '/parking') {
    return router.createUrlTree(['/parking/dashboard']);
  }

  const isPublicPage = publicPages.has(currentPath);

  if (isPublicPage) {
    if (!auth.getCurrentUser()) {
      return true;
    }

    return auth.validateParkingSession(true).pipe(
      map(() => true),
      catchError(() => of(router.createUrlTree(['/parking/provider-login'])))
    );
  }

  if (auth.getCurrentUser() && !auth.isParkingLoggedIn()) {
    auth.handleParkingSessionExpired('the user loged in other device', true);
    return router.createUrlTree(['/parking/provider-login']);
  }

  if (!auth.isParkingLoggedIn()) {
    return router.createUrlTree(['/parking/provider-login']);
  }

  return auth.validateParkingSession(true).pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/parking/provider-login'])))
  );
};
