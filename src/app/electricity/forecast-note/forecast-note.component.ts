import { Component } from '@angular/core';

/**
 * Legend of the estimated (striped) bars on the price page: the estimates are
 * milloin.xyz's own forecast, and a longer one is available on request
 */
@Component({
  selector: 'app-forecast-note',
  template: `
    <span class="swatch" aria-hidden="true"></span>
    <span>
      Raidalliset pylväät ovat arvioita: milloin.xyz:n oma ennuste tunneille, joiden pörssihintaa ei ole vielä
      julkaistu. Tarvitsetko pidemmän ennusteen? Ota yhteyttä:
      <a class="link" href="mailto:jarkko.peltola@hurlumhei.xyz" data-test-id="electricity-forecast-contact">jarkko.peltola&#64;hurlumhei.xyz</a>
    </span>
  `,
  styleUrl: './forecast-note.component.scss',
})
export class ForecastNoteComponent {}
