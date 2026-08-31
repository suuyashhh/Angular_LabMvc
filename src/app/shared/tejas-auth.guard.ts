import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';


export const tejasAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isTejasLoggedIn()) {
    return true;
  }

  router.navigate(['/tejas/login']);
  return false;
};
