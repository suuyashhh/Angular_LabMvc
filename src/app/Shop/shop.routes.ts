import { Routes } from "@angular/router";
import { shopAuthGuard } from "../shared/shop-auth.guard";

export const SHOP_ROUTES : Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
        canActivate: [shopAuthGuard],
        children: [
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
                path:'ex-entrytype',
                loadComponent: () => import('./ex-entrytype/ex-entrytype.component').then(m => m.ExEntrytypeComponent)
            },
            {
                path:'',
                redirectTo:'dashboard',
                pathMatch:'full'
            }
        ]
    },
    {
        path:'**',
        redirectTo:''
    }
];
