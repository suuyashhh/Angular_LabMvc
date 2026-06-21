import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const shopAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const hasSession = typeof window !== 'undefined' && sessionStorage.getItem('shopCredentials') !== null;

  if (hasSession || auth.isShopLoggedIn()) {
    return true;
  } else {
    router.navigate(['/shop/login']);
    return false;
  }
};
