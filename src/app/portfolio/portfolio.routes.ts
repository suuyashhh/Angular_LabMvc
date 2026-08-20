import { Routes } from '@angular/router';

export const PORTFOLIO_ROUTES: Routes = [
 {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path:'home',
    loadComponent:()=> import('../portfolio/home/home.component')
        .then(m => m.HomeComponent)
 },
 {
    path:'projects',
    loadComponent:() => import('../portfolio/projects/projects.component')
        .then(m => m.ProjectsComponent)
 }
];
