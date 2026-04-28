import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const parkingAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Allow access to the login page and dashboard without authentication
  if (state.url.includes('provider-login') || state.url.includes('dashboard')) {
    return true;
  }

  if (auth.isParkingLoggedIn()) {
    return true;
  } else {
    // If not logged in, redirect to the public parking dashboard
    router.navigate(['/Parking/dashboard']);
    return false;
  }
};
