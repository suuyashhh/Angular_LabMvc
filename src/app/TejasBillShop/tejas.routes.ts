import { Routes } from '@angular/router';
import { TejasLayoutComponent } from './tejas-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BillingComponent } from './pages/billing/billing.component';
import { EntriesComponent } from './pages/entries/entries.component';
import { BillDetailComponent } from './pages/bill-detail/bill-detail.component';
import { FoodMasterComponent } from './pages/food-master/food-master.component';
import { PrinterComponent } from './pages/printer/printer.component';

import { tejasAuthGuard } from '../shared/tejas-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: TejasLayoutComponent,
    canActivate: [tejasAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'entries', component: EntriesComponent },
      { path: 'entries/:id', component: BillDetailComponent },
      { path: 'food-master', component: FoodMasterComponent },
      { path: 'printer', component: PrinterComponent },
      { path: 'expenses', loadComponent: () => import('./pages/expense-dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'history', loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent) },
      { path: 'ex-entrytype', loadComponent: () => import('./pages/ex-entrytype/ex-entrytype.component').then(m => m.ExEntrytypeComponent) },
      { path: 'tejas-users', loadComponent: () => import('./pages/Tejas-users/Tejas-users.component').then(m => m.TejasUsersComponent) },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
