import { Routes } from '@angular/router';
import { adminAuthGuard } from './guards/admin-auth.guard';

export const Admin_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        canActivate: [adminAuthGuard],
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
    }
];