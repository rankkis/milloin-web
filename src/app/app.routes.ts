import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WashingMachineComponent } from './washing-machine/washing-machine.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'washing-machine', component: WashingMachineComponent },
  { path: '**', redirectTo: '' }
];
