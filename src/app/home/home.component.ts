import { Component } from '@angular/core';
import { NavigationComponent } from '../core/navigation/navigation.component';
import { CardComponent } from '../core/navigation/card/card.component';

@Component({
  selector: 'app-home',
  imports: [
    NavigationComponent,
    CardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {}