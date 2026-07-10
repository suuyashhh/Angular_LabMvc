import { Routes } from "@angular/router";
import { marketAuthGuard } from "./guards/market-auth.guard";

export const MARKET_ROUTES : Routes = [
    {
        path: 'login',
        loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: '',
        loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
        canActivate: [marketAuthGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'hotels',
                loadComponent: () => import('./components/hotels/hotels.component').then(m => m.HotelsComponent)
            },
            {
                path: 'vegetables',
                loadComponent: () => import('./components/vegetables/vegetables.component').then(m => m.VegetablesComponent)
            },
            {
                path: 'purchase/add',
                loadComponent: () => import('./components/purchase-entry/purchase-entry.component').then(m => m.PurchaseEntryComponent)
            },
            {
                path: 'purchase/edit/:id',
                loadComponent: () => import('./components/purchase-entry/purchase-entry.component').then(m => m.PurchaseEntryComponent)
            },
            {
                path: 'purchase/view/:id',
                loadComponent: () => import('./components/purchase-view/purchase-view.component').then(m => m.PurchaseViewComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'purchase/print/:id',
        loadComponent: () => import('./components/purchase-view/purchase-view.component').then(m => m.PurchaseViewComponent),
        canActivate: [marketAuthGuard]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
