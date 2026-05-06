import { Routes } from "@angular/router";
import { parkingAuthGuard } from "../shared/parking-auth.guard";

export const PARKING_ROUTES : Routes = [
    {
        path:'',
        redirectTo:'dashboard',
        pathMatch:'full'
    },
    {
        
        path:'dashboard',
        canActivate: [parkingAuthGuard],
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path:'parking-provider',
        canActivate: [parkingAuthGuard],
        loadComponent: () => import('./parking-provider/parking-provider.component').then(m => m.ParkingProviderComponent)
    },
    {
        path:'provider-login',
        loadComponent: () => import('./provider-login/provider-login.component').then(m => m.ProviderLoginComponent)
    },
    {
        path:'provider-registration',
        loadComponent: () => import('./provider-registration/provider-registration.component').then(m => m.ProviderRegistrationComponent)
    },
    {
        path:'parking-seeker',
        loadComponent: () => import('./parking-seeker/parking-seeker.component').then(m => m.ParkingSeekerComponent)
    }
];

