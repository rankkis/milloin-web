import { Component } from '@angular/core';
import { NavigationComponent } from '../core/navigation/navigation.component';
import { NavigationLinkComponent } from '../core/navigation/navigation-link/navigation-link.component';
import { APP_NAVIGATION_PATHS } from '../app.routes';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
    NavigationComponent,
    NavigationLinkComponent,
    RouterModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  paths = APP_NAVIGATION_PATHS;
}