import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const dairyAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isDairyLoggedIn()) {
    return true;
  } else {
    // redirect to dairy login
    router.navigate(['/dairyfarm']);
    return false;
  }
};
