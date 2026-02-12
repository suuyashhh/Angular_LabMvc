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
 },
 {
    path:'farmentrytypes',
    loadComponent:()=> import('../Farm/farm-entry-types/farm-entry-types.component')
        .then(m => m.FarmEntryTypesComponent)
 },
 {
    path:'farmentry',
    loadComponent:()=> import('../Farm/farmentry/farmentry.component')
        .then(m => m.FarmentryComponent)
 },
 {
    path:'all-history',  
    loadComponent:()=> import('../Farm/allhistory-farm/allhistory-farm.component')
        .then(m => m.AllHistoryComponent)
 }
  
];
