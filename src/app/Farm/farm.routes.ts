import { Routes } from '@angular/router';

export const FARM_ROUTES: Routes = [
 {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
 {
    path:'home',
    loadComponent:()=> import('../Farm/home/home.component')
        .then(m => m.HomeComponent)
 }
  
];
