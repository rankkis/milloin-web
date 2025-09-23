import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-back-button',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss'
})
export class BackButtonComponent {
  @Input() testId: string = 'back-button';
  @Input() ariaLabel: string = 'Go back to previous page';

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}