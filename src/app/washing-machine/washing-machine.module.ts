import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WashingMachineCardComponent } from './washing-machine-card/washing-machine-card.component';
import { WashingMachineListComponent } from './washing-machine-list/washing-machine-list.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    WashingMachineCardComponent,
    WashingMachineListComponent
  ],
  exports: [
    WashingMachineCardComponent,
    WashingMachineListComponent
  ]
})
export class WashingMachineModule { }
