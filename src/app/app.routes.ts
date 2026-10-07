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
    loadChildren: () => import('./charge-ev/charge-ev.module').then(m => m.ChargeEvModule)
  },
  { path: '**', redirectTo: '' }
];
