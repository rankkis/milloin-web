import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { WashLaundryComponent } from './wash-laundry.component';
import { WashLaundryService } from './wash-laundry.service';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  { path: '', component: WashLaundryComponent }
];

@NgModule({
  declarations: [
    WashLaundryComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    WashLaundryService
  ]
})
export class WashLaundryModule { }