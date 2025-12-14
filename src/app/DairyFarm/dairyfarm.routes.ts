import { Routes } from '@angular/router';

export const DAIRYFARM_ROUTES: Routes = [
 {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
 {
    path:'home',
    loadComponent:()=> import('../DairyFarm/home/home.component')
        .then(m => m.HomeComponent)
 },
 {
    path:'Masters',
    loadComponent:()=> import('../DairyFarm/masters/masters.component')
        .then(m => m.MastersComponent)
 },
 {
    path:'Feed',
    loadComponent:()=> import('../DairyFarm/feeds/feeds.component')
        .then(m => m.FeedsComponent)
 },
 {
    path:'Doctor',
    loadComponent:()=> import('../DairyFarm/doctor-dairy/doctor-dairy.component')
        .then(m => m.DoctorDairyComponent)
 },
  
];
