import { Routes } from '@angular/router';
import { WashingMachineListComponent } from './washing-machine/washing-machine-list/washing-machine-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/washing-machines', pathMatch: 'full' },
  { path: 'washing-machines', component: WashingMachineListComponent },
  { path: '**', redirectTo: '/washing-machines' }
];
