import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation-link',
  imports: [MatCardModule, MatIconModule, RouterModule],
  templateUrl: './navigation-link.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navigation-link.component.scss',
})
export class NavigationLinkComponent {
  @Input() icon!: string;
  @Input() text!: string;
  @Input() routerLink!: string;
  @Input() badgeIcon?: string;
}
