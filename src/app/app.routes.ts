import { Routes } from '@angular/router';
import { LandingComponent } from './admin/landing/landing.component';
import { CasepaperComponent } from './labadmin/casepaper/casepaper.component';
import { AddTestComponent } from './labadmin/add-test/add-test.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './shared/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',component:LoginComponent
  },
  {path:"", component:LoginComponent},
  {path:'labadmin',
    // canActivate:[authGuard],
    loadComponent:() => import('../app/labadmin/landing/landing.component').then(m=>m.LandingComponent),
      loadChildren: () =>import('../app/labadmin/labadmin.routes').then(m => m.lABADMIN_ROUTES)
  },
 

  // {path:'' ,component:LandingComponent},
  // {path:'casepaper' ,component:CasepaperComponent},
  // {path:'test',component:AddTestComponent}
];
