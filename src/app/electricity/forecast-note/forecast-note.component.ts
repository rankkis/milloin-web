import { Component } from '@angular/core';

/**
 * Legend of the estimated (striped) bars on the price page: the estimates are
 * milloin.xyz's own forecast
 */
@Component({
  selector: 'app-forecast-note',
  template: `
    <span class="swatch" aria-hidden="true"></span>
    <span>
      Raidalliset pylväät ovat arvioita: milloin.xyz:n oma ennuste tunneille, joiden pörssihintaa ei ole vielä
      julkaistu.
    </span>
  `,
  styleUrl: './forecast-note.component.scss',
})
export class ForecastNoteComponent {}
