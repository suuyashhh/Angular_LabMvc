import { Routes } from "@angular/router";

export const SHOP_ROUTES : Routes = [
    {
        path:'',
        redirectTo:'dashboard',
        pathMatch:'full'
    },
    {
        
        path:'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path:'history',
        loadComponent: () => import('./history/history.component').then(m => m.HistoryComponent)
    },    
    {
        path:'**',
        redirectTo:'dashboard'
    }
];
