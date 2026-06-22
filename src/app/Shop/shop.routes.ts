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
        path:'shop-users',
        loadComponent: () => import('./shop-users/shop-users.component').then(m => m.ShopUsersComponent)
    },   
    {
        path:'**',
        redirectTo:'dashboard'
    }
];
