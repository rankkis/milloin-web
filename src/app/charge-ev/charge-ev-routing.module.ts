import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChargeEvComponent } from './charge-ev.component';

const routes: Routes = [
  { path: '', component: ChargeEvComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChargeEvRoutingModule { }
