import { Routes } from '@angular/router';
import { HaaSLayoutComponent } from './haas-layout.component';

export const HAAS_ROUTES: Routes = [
  {
    path: '',
    component: HaaSLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component')
          .then(m => m.HaaSDashboardComponent)
      },
      {
        path: 'ecosystem',
        loadComponent: () => import('./pages/ecosystem/ecosystem.component')
          .then(m => m.HaaSEcosystemComponent)
      },
      {
        path: 'forecasting',
        loadComponent: () => import('./pages/forecasting/forecasting.component')
          .then(m => m.HaaSForecastingComponent)
      },
      {
        path: 'storage-log',
        loadComponent: () => import('./pages/storage-log/storage-log.component')
          .then(m => m.HaaSStorageLogComponent)
      },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
