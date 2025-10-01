import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'wash-laundry',
    loadChildren: () => import('./wash-laundry/wash-laundry.module').then(m => m.WashLaundryModule)
  },
  {
    path: 'charge-ev',
    loadChildren: () => import('./charge-ev/charge-ev.module').then(m => m.ChargeEvModule)
  },
  { path: '**', redirectTo: '' }
];
