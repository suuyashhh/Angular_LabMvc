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
        path: '',
        canActivate: [adminAuthGuard],
        loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'project-master',
                loadComponent: () => import('./project-master/project-master.component').then(m => m.ProjectMasterComponent)
            }
        ]
    }
];