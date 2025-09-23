import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-washing-machine',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div style="padding: 2rem; color: var(--spotify-white);">
      <button
        mat-icon-button
        (click)="goBack()"
        data-test-id="back-button"
        aria-label="Go back to previous page"
        title="Go back to previous page"
        style="margin-bottom: 2rem; color: var(--spotify-green);">
        <mat-icon>arrow_back</mat-icon>
      </button>

      <div style="text-align: center;">
        <h1 style="font-family: 'Montserrat', sans-serif; font-size: 2.5rem; margin-bottom: 1rem;">
          Washing Machine Question
        </h1>
        <p style="font-family: 'Inter', sans-serif; font-size: 1.2rem; color: var(--spotify-text-light);">
          This is where the washing machine functionality will be implemented.
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class WashingMachineComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}