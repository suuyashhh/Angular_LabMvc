import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const parkingAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Allow access to public pages without authentication
  const publicPages = ['provider-login', 'provider-registration', 'dashboard'];
  if (publicPages.some(page => state.url.includes(page))) {
    return true;
  }

  // Check if user is logged in (has 'parking_user' in session)
  if (auth.isParkingLoggedIn()) {
    return true;
  } else {
    // If not logged in and trying to access private page, redirect to login
    router.navigate(['/Parking/provider-login']);
    return false;
  }
};
