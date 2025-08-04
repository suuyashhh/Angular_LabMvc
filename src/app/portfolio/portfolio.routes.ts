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
    path:'about',
    loadComponent:()=> import('../portfolio/about/about.component')
        .then(m => m.AboutComponent)
 },
 {
    path:'projects',
    loadComponent:() => import('../portfolio/projects/projects.component')
        .then(m => m.ProjectsComponent)
 },
 {
    path:'resume',
    loadComponent: () => import('../portfolio/resume/resume.component')
        .then(m =>m.ResumeComponent)
 },
 {
    path:'contact',
    loadComponent: () => import('../portfolio/contact/contact.component')
        .then(m => m.ContactComponent)
 }
];
