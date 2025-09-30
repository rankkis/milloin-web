import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChargeEvRoutingModule } from './charge-ev-routing.module';
import { ChargeEvComponent } from './charge-ev.component';
import { ChargeEvService } from './charge-ev.service';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    ChargeEvComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ChargeEvRoutingModule
  ],
  providers: [
    ChargeEvService
  ]
})
export class ChargeEvModule { }
