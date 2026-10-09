import { Routes } from '@angular/router';
import { wasteHeatAuthGuard } from '../shared/waste-heat-auth.guard';

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
    canActivate: [wasteHeatAuthGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'Dashboard',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'data-server',
    canActivate: [wasteHeatAuthGuard],
    loadComponent: () => import('./data-server/data-server.component').then(m => m.DataServerComponent)
  },
  {
    path: 'thermal-storage',
    canActivate: [wasteHeatAuthGuard],
    loadComponent: () => import('./thermal-storage/thermal-storage.component').then(m => m.ThermalStorageComponent)
  },
  {
    path: 'heat-consumers',
    canActivate: [wasteHeatAuthGuard],
    loadComponent: () => import('./heat-consumers/heat-consumers.component').then(m => m.HeatConsumersComponent)
  },
  {
    path: 'reports',
    canActivate: [wasteHeatAuthGuard],
    loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'settings',
    canActivate: [wasteHeatAuthGuard],
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
  }
];
