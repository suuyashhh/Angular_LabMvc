import { Routes } from '@angular/router';

export const DAIRYFARM_ROUTES: Routes = [
 {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
 {
    path:'home',
    loadComponent:()=> import('../DairyFarm/home/home.component')
        .then(m => m.HomeComponent)
 },
 {
    path:'Masters',
    loadComponent:()=> import('../DairyFarm/masters/masters.component')
        .then(m => m.MastersComponent)
 },
 {
    path:'Feed',
    loadComponent:()=> import('../DairyFarm/feeds/feeds.component')
        .then(m => m.FeedsComponent)
 },
 {
    path:'Doctor',
    loadComponent:()=> import('../DairyFarm/doctor-dairy/doctor-dairy.component')
        .then(m => m.DoctorDairyComponent)
 },
 {
    path:'Medicien',
    loadComponent:()=> import('../DairyFarm/medicien/medicien.component')
        .then(m => m.MedicienComponent)
 },
 {
    path:'OtherFeed',
    loadComponent:()=> import('../DairyFarm/other-feed/other-feed.component')
        .then(m => m.OtherFeedComponent)
 },
 {
    path:'Bill',
    loadComponent:()=> import('../DairyFarm/dairy-bill/dairy-bill.component')
        .then(m => m.DairyBillComponent)
 },
 {
    path:'History',
    loadComponent:()=> import('../DairyFarm/history-dairy/history-dairy.component')
        .then(m => m.HistoryDairyComponent)
 },
 {
    path:'check-Animal-History',
    loadComponent:()=> import('../DairyFarm/check-animal-history/check-animal-history.component')
        .then(m => m.CheckAnimalHistoryComponent)
 },
 {
    path:'check-Breeding-History',
    loadComponent:()=> import('../DairyFarm/check-breeding-dates/check-breeding-dates.component')
        .then(m => m.CheckBreedingDatesComponent)
 },
 {
    path:'monthlype',
    loadComponent:()=> import('../DairyFarm/monthly-pe/monthly-pe.component')
        .then(m => m.MonthlyPeComponent)
 },
 {
    path:'datepe',
    loadComponent:()=> import('../DairyFarm/date-pe/date-pe.component')
        .then(m => m.DatePEComponent)
 },
 {
    path:'Cattle-breeding-calculater',
    loadComponent:()=> import('../DairyFarm/cattle-breeding-calculator/cattle-breeding-calculator.component')
        .then(m => m.CattleBreedingCalculatorComponent)
 },
  
  
];
