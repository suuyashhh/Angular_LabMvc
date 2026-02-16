import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const farmAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isFarmUserLoggedIn()) {
    return true;
  } else {
    router.navigate(['/farm']);
    return false;
  }
};
