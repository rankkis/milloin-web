import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { APP_NAVIGATION_PATHS } from './app.paths';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: APP_NAVIGATION_PATHS.WASH_LAUNDRY,
    loadComponent: () => import('./wash-laundry/wash-laundry.component').then(m => m.WashLaundryComponent)
  },
  {
    path: APP_NAVIGATION_PATHS.CHARGE_EV,
    loadComponent: () => import('./charge-ev/charge-ev.component').then(m => m.ChargeEvComponent)
  },
  { path: '**', redirectTo: '' }
];
