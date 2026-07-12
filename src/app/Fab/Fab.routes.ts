import { Routes } from "@angular/router";

export const FAB_ROUTES : Routes = [
    {
        path: 'login',
        loadComponent: () => import('./fab-login/fab-login.component').then(m => m.FabLoginComponent)
    },
    {
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./fab-dashboard/fab-dashboard.component').then(m => m.FabDashboardComponent)
            },
          
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
