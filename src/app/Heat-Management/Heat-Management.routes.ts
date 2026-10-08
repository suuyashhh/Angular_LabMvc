import { Routes } from '@angular/router';

export const HEAT_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'data-server',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login-heat-management/login-heat-management.component').then(m => m.LoginHeatManagementComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'Dashboard',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'data-server',
    loadComponent: () => import('./data-server/data-server.component').then(m => m.DataServerComponent)
  },
  {
    path: 'thermal-storage',
    loadComponent: () => import('./thermal-storage/thermal-storage.component').then(m => m.ThermalStorageComponent)
  },
  {
    path: 'heat-consumers',
    loadComponent: () => import('./heat-consumers/heat-consumers.component').then(m => m.HeatConsumersComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
  }
];
