import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const parkingAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const publicPages = ['provider-login', 'provider-registration', 'dashboard'];
  const isPublicPage = publicPages.some(page => state.url.includes(page));

  if (isPublicPage) {
    if (!auth.getCurrentUser()) {
      return true;
    }

    return auth.validateParkingSession(true).pipe(
      map(() => true),
      catchError(() => of(router.createUrlTree(['/Parking/provider-login'])))
    );
  }

  if (auth.getCurrentUser() && !auth.isParkingLoggedIn()) {
    auth.handleParkingSessionExpired('the user loged in other device', true);
    return router.createUrlTree(['/Parking/provider-login']);
  }

  if (!auth.isParkingLoggedIn()) {
    return router.createUrlTree(['/Parking/provider-login']);
  }

  return auth.validateParkingSession(true).pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/Parking/provider-login'])))
  );
};
