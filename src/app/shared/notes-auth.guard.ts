import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const notesAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isNotesLoggedIn()) {
    return true;
  } else {
    router.navigate(['/notes/login']);
    return false;
  }
};
