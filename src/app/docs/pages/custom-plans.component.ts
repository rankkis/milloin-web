import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../code-block.component';
import { API_BASE } from './docs-samples';

const SEARCH_REQUEST = `curl -X POST ${API_BASE}/v1/electricity/plans/search \\
  -H "Content-Type: application/json" \\
  -d '{
    "resolution": "hour",
    "profileKwh": [4, 2, 2],
    "startTimes": ["2026-10-12T17:00:00+03:00", "2026-10-12T19:00:00+03:00"],
    "limit": 1
  }'`;

const SEARCH_RESPONSE = `{
  "request": { "pausable": false, "durationHours": 3, "energyKwh": 8, "resolution": "hour", ... },
  "plans": [
    { "startTime": "2026-10-13T01:00:00.000Z", "endTime": "2026-10-13T04:00:00.000Z",
      "priceAvg": 2, "costCents": 16, "savingsCents": 68, ... }
  ],
  "startTimes": [
    { "requestedStart": "2026-10-12T17:00:00+03:00", "startTime": "2026-10-12T14:00:00.000Z",
      "endTime": "2026-10-12T17:00:00.000Z", "priceAvg": 10.25, "category": "EXPENSIVE", "costCents": 82 },
    { "requestedStart": "2026-10-12T19:00:00+03:00", "startTime": "2026-10-12T16:00:00.000Z",
      "endTime": "2026-10-12T19:00:00.000Z", "priceAvg": 9.75, "category": "NORMAL", "costCents": 78 }
  ],
  ...
}`;

/** /docs/custom-plans: GET /v1/electricity/plans parameters and POST /v1/electricity/plans/search */
@Component({
  selector: 'app-docs-custom-plans',
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <h1>Custom plans</h1>
    <p class="lead">
      Describe your own load and get the cheapest time to run it. The
      <a routerLink="/docs/presets" data-test-id="docs-custom-presets">presets</a> are the same request with the
      parameters filled in.
    </p>

    <h2>Parameters of GET /v1/electricity/plans</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Parameter</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr><td><code>durationHours</code></td><td>How long the load runs, in steps of 0.25 hours, up to 24.</td></tr>
          <tr><td><code>energyKwh</code></td><td>Energy it uses. With it the answer has costs in cents; without it, only average prices.</td></tr>
          <tr><td><code>maxPowerKw</code></td><td>Its power, such as a charger's 11 kW, with <code>energyKwh</code> instead of <code>durationHours</code>.</td></tr>
          <tr><td><code>pausable</code></td><td><code>true</code> for a load that can stop and go on later. Defaults to <code>false</code>.</td></tr>
          <tr><td><code>minBlockHours</code></td><td>Pausable loads: the shortest time it runs once switched on, in steps of 0.25 hours. Defaults to 0.25.</td></tr>
          <tr><td><code>earliestStart</code></td><td>Start of the search; defaults to now. May be in the past back to midnight today, so a plan stays the same as time passes. <code>today</code> and <code>tomorrow</code> mean midnight, Finnish time.</td></tr>
          <tr><td><code>latestEnd</code></td><td>When it must be done, such as when the car leaves. Defaults to the last published price. <code>tomorrow</code> is midnight tonight.</td></tr>
          <tr><td><code>limit</code></td><td>Continuous loads: how many runs to return, 1 to 10. Defaults to 3.</td></tr>
          <tr><td><code>resolution</code></td><td><code>hour</code> plans on hourly average prices with starts on the full hour. Defaults to <code>15min</code>.</td></tr>
          <tr><td><code>vat</code></td><td><code>false</code> for prices and costs without VAT.</td></tr>
        </tbody>
      </table>
    </div>

    <h2>A continuous load</h2>
    <p>A dishwasher that runs 3 hours on 1.2 kWh and should be done by midnight:</p>
    <app-code-block [code]="dishwasher" />

    <h2>A pausable load</h2>
    <p>Charging 50 kWh at 11 kW before 7:00 tomorrow morning, an hour at least at a time:</p>
    <app-code-block [code]="ev" />
    <p>
      The plan has one or more <code>blocks</code>, each with its <code>energyKwh</code>. At full power the energy may be
      in up to 15 minutes before a block's <code>endTime</code>.
    </p>

    <h2>Following a plan with a device</h2>
    <p>
      Switch the device on while <code>activeNow</code> is <code>true</code>, and ask again at <code>nextChangeAt</code>.
      Keep <code>earliestStart</code> and <code>latestEnd</code> fixed for the period, as the
      <a routerLink="/docs/home-assistant" data-test-id="docs-custom-home-assistant">Home Assistant</a> example does
      with <code>today</code> and <code>tomorrow</code>: a search from now would plan the whole load again each time.
    </p>

    <h2>A power profile and given start times</h2>
    <p>
      <code>POST /v1/electricity/plans/search</code> takes the same fields as a JSON body, plus <code>profileKwh</code>, the energy
      for each slot of the run for a load whose power changes, and <code>startTimes</code> to cost given starts, such as
      the delays a washing machine's timer offers. A sauna heater that draws 4 kWh in its first hour and 2 kWh in the
      next two, compared with warming it at 17 or 19:
    </p>
    <app-code-block title="Request" [code]="searchRequest" />
    <app-code-block title="Response, shortened" [code]="searchResponse" />
    <p>Responses to POST are not cached by the CDN, so use GET when it is enough.</p>
  `,
  styleUrl: '../docs-page.scss',
})
export class DocsCustomPlansComponent {
  readonly dishwasher = `curl "${API_BASE}/v1/electricity/plans?durationHours=3&energyKwh=1.2&latestEnd=tomorrow"`;
  readonly ev = `curl "${API_BASE}/v1/electricity/plans?pausable=true&energyKwh=50&maxPowerKw=11&minBlockHours=1&latestEnd=2026-10-13T07:00:00%2B03:00"`;
  readonly searchRequest = SEARCH_REQUEST;
  readonly searchResponse = SEARCH_RESPONSE;
}
