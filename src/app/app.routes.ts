import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './shared/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'labadmin',
    canActivate: [authGuard],
    loadComponent: () => import('./labadmin/landing/landing.component').then(m => m.LandingComponent),
    loadChildren: () => import('./labadmin/labadmin.routes').then(m => m.lABADMIN_ROUTES)
  }
];
