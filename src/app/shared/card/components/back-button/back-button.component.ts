import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-back-button',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './back-button.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './back-button.component.scss',
})
export class BackButtonComponent {
  @Input() testId = 'back-button';
  @Input() ariaLabel = 'Go back to previous page';

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
