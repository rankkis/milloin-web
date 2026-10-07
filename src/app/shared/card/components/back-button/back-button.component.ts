import {
  Component,
  Input,
  inject,
} from '@angular/core';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-back-button',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss',
})
export class BackButtonComponent {
  private location = inject(Location);

  @Input() testId = 'back-button';
  @Input() ariaLabel = 'Go back to previous page';

  goBack(): void {
    this.location.back();
  }
}
