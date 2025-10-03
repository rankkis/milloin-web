import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const APP_NAVIGATION_PATHS = {
  OVERVIEW: 'sahko-on-halpaa',
  WASH_LAUNDRY: 'kannattaa-pesta-pyykkia',
  CHARGE_EV: 'kannattaa-ladata-auto'
}

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: APP_NAVIGATION_PATHS.OVERVIEW,
    loadChildren: () => import('./overview/overview.module').then(m => m.OverviewModule)
  },
  {
    path: APP_NAVIGATION_PATHS.WASH_LAUNDRY,
    loadChildren: () => import('./wash-laundry/wash-laundry.module').then(m => m.WashLaundryModule)
  },
  {
    path: APP_NAVIGATION_PATHS.CHARGE_EV,
    loadChildren: () => import('./charge-ev/charge-ev.module').then(m => m.ChargeEvModule)
  },
  { path: '**', redirectTo: '' }
];
