import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const fabAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isFabLoggedIn()) {
    return true;
  } else {
    // redirect to fabrication login
    router.navigate(['/fab/login']);
    return false;
  }
};
