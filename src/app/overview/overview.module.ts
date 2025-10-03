import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideCharts, withDefaultRegisterables, BaseChartDirective } from 'ng2-charts';

import { OverviewRoutingModule } from './overview-routing.module';
import { OverviewComponent } from './overview/overview.component';
import { OverviewService } from './overview.service';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    OverviewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    BaseChartDirective,
    OverviewRoutingModule
  ],
  providers: [
    OverviewService,
    provideCharts(withDefaultRegisterables())
  ]
})
export class OverviewModule { }
