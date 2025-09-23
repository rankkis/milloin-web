import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from './navigation/navigation.component';
import { NavigationLinkComponent } from './navigation/navigation-link/navigation-link.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NavigationComponent,
    NavigationLinkComponent
  ],
  exports: [
    NavigationComponent,
    NavigationLinkComponent
  ]
})
export class CoreModule { }
