import { Component } from '@angular/core';
import { NavigationComponent } from '../core/navigation/navigation.component';
import { NavigationLinkComponent } from '../core/navigation/navigation-link/navigation-link.component';

@Component({
  selector: 'app-home',
  imports: [
    NavigationComponent,
    NavigationLinkComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {}