import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
 {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full'
  },
 {
    path:'users',
    loadComponent:()=> import('../admin/show-users/show-users.component')
        .then(m => m.ShowUsersComponent)
 }
];
