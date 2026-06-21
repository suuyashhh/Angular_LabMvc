import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const shopAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isShopLoggedIn()) {
    router.navigate(['/shop/login']);
    return false;
  }

  return auth.validateShopSession(true).pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/shop/login'])))
  );
};
