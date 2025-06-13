import { Routes } from '@angular/router';

export const lABADMIN_ROUTES: Routes = [
 {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
 {
    path:'dashboard',
    loadComponent:()=> import('../labadmin/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
 },
    {
    path:'casepaper',
    loadComponent:()=> import('../labadmin/casepaper/casepaper.component')
        .then(m => m.CasepaperComponent)
 },
 {
    path:'add-test',
    loadComponent:() => import('../labadmin/add-test/add-test.component')
        .then(m => m.AddTestComponent)
 },
 {
    path:'create-employee',
    loadComponent: () => import('../labadmin/create-employee/create-employee.component')
        .then(m =>m.CreateEmployeeComponent)
 },
 {
    path:'doctor',
    loadComponent: () => import('../labadmin/doctor/doctor.component')
        .then(m => m.DoctorComponent)
 },
 {
    path:'approve/casepaper',
    loadComponent: () => import('../labadmin/approve/casepaper/casepaper.component')
        .then(m => m.CasepaperComponent)
 },
 {
    path:'approve/test',
    loadComponent: () => import('../labadmin/approve/test/test.component')
        .then(m => m.TestComponent)
 },
 {
    path:'lab-materials',
    loadComponent: () => import('../labadmin/lab-materials/lab-materials.component')
        .then(m => m.LabMaterialsComponent)
 },
 {
    path:'bike-fule',
    loadComponent: () => import('../labadmin/bike-fule/bike-fule.component')
        .then(m => m.BikeFuleComponent)
 },
 {
    path:'employee-salary',
    loadComponent: () => import('../labadmin/employee-salary/employee-salary.component')
        .then(m => m.EmployeeSalaryComponent)
 },
 {
    path:'ele-bill',
    loadComponent: () => import('../labadmin/electricity-bill/electricity-bill.component')
        .then(m => m.ElectricityBillComponent)
 }
    //   {
//     path: 'drr',
//     loadComponent: () => import('../staff/drr/drr.component')
//       .then(m => m.DrrComponent)  //Lazy-load DashboardHomeComponent
//   },
  // {
  //   path: 'ic',
  //   loadComponent: () => import('../pages/issued-certificate/issued-certificate.component')
  //     .then(m => m.IssuedCertificateComponent) // Lazy-load DashboardSettingsComponent
  // }
];
