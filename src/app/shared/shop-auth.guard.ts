import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';


export const shopAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isShopLoggedIn()) {
    return true;
  }

  router.navigate(['/shop/login']);
  return false;
};
