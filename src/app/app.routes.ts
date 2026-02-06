import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './shared/auth.guard';
import { LogindairyComponent } from './LoginDairFarm/logindairy/logindairy.component';
import { dairyAuthGuard } from './shared/dairy-auth.guard';
import { LoginfarmComponent } from './LoginFarm/loginfarm/loginfarm.component';

export const routes: Routes = [

  { path: '', redirectTo: 'farm', pathMatch: 'full' },
  { path: 'lab', component: LoginComponent },

  { path: 'login', component: LoginComponent },
  { path: 'dairyfarm', component: LogindairyComponent},
  { path: 'farm', component: LoginfarmComponent},

  {
    path: 'portfolio',
    loadComponent: () => import('./portfolio/landing/landing.component').then(m => m.LandingComponent),
    loadChildren: () => import('./portfolio/portfolio.routes').then(m => m.PORTFOLIO_ROUTES)
  },
  {
    path: 'LABADMIN',
    canActivate: [authGuard],
    loadComponent: () => import('./labadmin/landing/landing.component').then(m => m.LandingComponent),
    loadChildren: () => import('./labadmin/labadmin.routes').then(m => m.lABADMIN_ROUTES)
  },
  {
    path: 'SDF',
    canActivate: [dairyAuthGuard],
    loadComponent: () => import('./DairyFarm/landing/landing.component').then(m => m.LandingComponent),
    loadChildren: () => import('./DairyFarm/dairyfarm.routes').then(m => m.DAIRYFARM_ROUTES)
  },
  {
    path: 'SF',
    loadComponent: () => import('./Farm/landing/landing.component').then(m => m.LandingComponent),
    loadChildren: () => import('./Farm/farm.routes').then(m => m.FARM_ROUTES)
  },
  {
    path: 'ADMIN',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/landing/landing.component').then(m => m.LandingComponent),
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  }
];
