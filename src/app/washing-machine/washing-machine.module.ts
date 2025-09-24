import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { WashingMachineComponent } from './washing-machine.component';
import { WashingMachineService } from './washing-machine.service';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  { path: '', component: WashingMachineComponent }
];

@NgModule({
  declarations: [
    WashingMachineComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    WashingMachineService
  ]
})
export class WashingMachineModule { }