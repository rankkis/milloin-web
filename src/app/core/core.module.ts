import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from './navigation/navigation.component';
import { CardComponent } from './navigation/card/card.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NavigationComponent,
    CardComponent
  ],
  exports: [
    NavigationComponent,
    CardComponent
  ]
})
export class CoreModule { }
