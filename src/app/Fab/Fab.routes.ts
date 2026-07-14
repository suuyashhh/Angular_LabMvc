import { Routes } from "@angular/router";
import { fabAuthGuard } from "../shared/fab-auth.guard";

export const FAB_ROUTES : Routes = [
    {
        path: 'login',
        loadComponent: () => import('./fab-login/fab-login.component').then(m => m.FabLoginComponent)
    },
    {
        path: 'dashboard',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-dashboard/fab-dashboard.component').then(m => m.FabDashboardComponent)
    },
    {
        path: 'users',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-users/fab-users.component').then(m => m.FabUsersComponent)
    },
    {
        path: 'helper-attendance',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-helper-attendance/fab-helper-attendance.component').then(m => m.FabHelperAttendanceComponent)
    },
    {
        path: 'admin-attendance',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-attendance/fab-admin-attendance.component').then(m => m.FabAdminAttendanceComponent)
    },
    {
        path: 'advance',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-advance/fab-admin-advance.component').then(m => m.FabAdminAdvanceComponent)
    },
    {
        path: 'expense',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-expense/fab-admin-expense.component').then(m => m.FabAdminExpenseComponent)
    },
    {
        path: 'profit',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-profit/fab-admin-profit.component').then(m => m.FabAdminProfitComponent)
    },
    {
        path: 'transport',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-transport/fab-admin-transport.component').then(m => m.FabAdminTransportComponent)
    },
    {
        path: 'monthly-pe',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-monthly-pe/fab-admin-monthly-pe.component').then(m => m.FabAdminMonthlyPeComponent)
    },
    {
        path: 'date-pe',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-date-pe/fab-admin-date-pe.component').then(m => m.FabAdminDatePeComponent)
    },
    {
        path: 'create-salaryslip',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-create-salaryslip/fab-admin-create-salaryslip.component').then(m => m.FabAdminCreateSalaryslipComponent)
    },
    {
        path: 'salary-history',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-salary-history/fab-admin-salary-history.component').then(m => m.FabAdminSalaryHistoryComponent)
    },
    {
        path: 'history',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-history-all/fab-admin-history-all.component').then(m => m.FabAdminHistoryAllComponent)
    },
    {
        path: 'helper-history',
        canActivate: [fabAuthGuard],
        loadComponent: () => import('./fab-admin-helper-history/fab-admin-helper-history.component').then(m => m.FabAdminHelperHistoryComponent)
    },
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
