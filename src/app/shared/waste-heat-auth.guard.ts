import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const wasteHeatAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isWasteHeatLoggedIn()) {
    return true;
  } else {
    router.navigate(['/heatmanagement/login']);
    return false;
  }
};
