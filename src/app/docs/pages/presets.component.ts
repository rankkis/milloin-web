import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../code-block.component';
import { API_BASE } from './docs-samples';

const LAUNDRY_RESPONSE = `{
  "request": {
    "pausable": false, "durationHours": 2, "energyKwh": 1.5,
    "earliestStart": "2026-10-12T08:15:00.000Z", "latestEnd": "2026-10-13T21:00:00.000Z",
    "limit": 1, "resolution": "15min", "preset": "laundry"
  },
  "meta": {
    "priceUnit": "c/kWh", "currency": "EUR", "vatIncluded": true, "vatPercent": 25.5, "area": "FI",
    "pricesUntil": "2026-10-13T21:00:00.000Z", "tomorrowPublished": true,
    "nextPricesExpectedAt": "2026-10-13T11:00:00.000Z"
  },
  "activeNow": false,
  "nextChangeAt": "2026-10-13T01:00:00.000Z",
  "startNow": {
    "startTime": "2026-10-12T08:15:00.000Z", "endTime": "2026-10-12T10:15:00.000Z",
    "priceAvg": 11.13, "category": "EXPENSIVE", "costCents": 16.69
  },
  "plans": [
    {
      "startTime": "2026-10-13T01:00:00.000Z", "endTime": "2026-10-13T03:00:00.000Z",
      "priceAvg": 2, "category": "VERY_CHEAP", "costCents": 3, "savingsCents": 13.69,
      "activeNow": false, "nextChangeAt": "2026-10-13T01:00:00.000Z",
      "blocks": [
        { "startTime": "2026-10-13T01:00:00.000Z", "endTime": "2026-10-13T03:00:00.000Z", "energyKwh": 1.5 }
      ]
    }
  ]
}`;

/** /docs/presets: the ready-made loads and how to override them */
@Component({
  selector: 'app-docs-presets',
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <h1>Presets</h1>
    <p class="lead">Ready-made loads: ask when to run one with a single URL.</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Preset</th><th>Load</th><th>Kind</th></tr>
        </thead>
        <tbody>
          <tr><td><code>laundry</code></td><td>A washing machine program: 2 hours, 1.5 kWh</td><td>Continuous</td></tr>
          <tr><td><code>sauna</code></td><td>Heating an electric sauna: about an hour to warm up and two hours of bathing, 8 kWh</td><td>Continuous</td></tr>
          <tr><td><code>ev-charging</code></td><td>Charging an electric vehicle: 44 kWh at 11 kW</td><td>Pausable</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      A continuous load runs from start to end without a break, and the answer is up to three runs that do not overlap,
      cheapest first. A pausable load can stop and go on later, and the answer is the single cheapest plan, in one or more
      blocks. <code>GET /v1/plans/presets</code> lists the presets with their parameters.
    </p>

    <h2>Example: the washing machine</h2>
    <app-code-block title="Request" [code]="laundryRequest" />
    <app-code-block title="Response" [code]="laundryResponse" />
    <ul>
      <li><code>plans[0]</code> is the cheapest run: start the program at its <code>startTime</code>. <code>costCents</code> is the cost of the energy, <code>savingsCents</code> what it saves compared with starting now (<code>startNow</code>).</li>
      <li><code>activeNow</code> and <code>nextChangeAt</code> tell a device whether to be on now and when to switch next.</li>
      <li>The search runs from now to the last published price, <code>meta.pricesUntil</code>. Tomorrow's prices arrive at about 14:00 Finnish time; ask again after <code>meta.nextPricesExpectedAt</code> for a plan that can use them.</li>
    </ul>

    <h2>Overriding a preset</h2>
    <p>Any <code>GET /v1/plans</code> parameter replaces the preset's. Charge 30 kWh before 7:00 tomorrow morning:</p>
    <app-code-block [code]="evRequest" />
    <p>
      A <code>durationHours</code> replaces the preset's power, and a <code>maxPowerKw</code> its duration. The other
      parameters are in <a routerLink="/docs/custom-plans" data-test-id="docs-presets-custom-plans">Custom plans</a>.
    </p>
  `,
  styleUrl: '../docs-page.scss',
})
export class DocsPresetsComponent {
  readonly laundryRequest = `curl "${API_BASE}/v1/plans/presets/laundry?limit=1"`;
  readonly laundryResponse = LAUNDRY_RESPONSE;
  readonly evRequest = `curl "${API_BASE}/v1/plans/presets/ev-charging?energyKwh=30&latestEnd=2026-10-13T07:00:00%2B03:00"`;
}
