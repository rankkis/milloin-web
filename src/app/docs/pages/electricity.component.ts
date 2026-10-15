import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../code-block.component';
import { API_BASE } from './docs-samples';

const CURRENT_RESPONSE = `{
  "startTime": "2026-10-12T08:00:00.000Z",
  "endTime": "2026-10-12T08:15:00.000Z",
  "price": 4.82,
  "category": "CHEAP",
  "dayCategory": "NORMAL",
  "meta": {
    "unit": "c/kWh",
    "vatIncluded": true,
    "vatPercent": 25.5,
    "area": "FI",
    "resolution": "15min",
    "pricesUntil": "2026-10-12T21:00:00.000Z",
    "tomorrowPublished": false,
    "nextPricesExpectedAt": "2026-10-12T11:00:00.000Z",
    "source": "ENTSO-E",
    "fetchedAt": "2026-10-11T11:02:13.000Z"
  }
}`;

/** /docs/electricity: the quick start, endpoints, units and price freshness of the electricity category */
@Component({
  selector: 'app-docs-electricity',
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <h1>Electricity</h1>
    <p class="lead">
      Finnish electricity spot prices and the cheapest times to run a load, the same data that answers the
      <a href="https://milloin.xyz/sahkoa-kannattaa-kayttaa" data-test-id="docs-electricity-site">Sähkö</a> questions on
      milloin.xyz.
    </p>

    <h2>Quick start</h2>
    <p>Every endpoint is under <code>{{ base }}</code>. The price now:</p>
    <app-code-block title="Request" [code]="currentRequest" />
    <app-code-block title="Response" [code]="currentResponse" />
    <p>
      Running a device in the cheap hours? Start with
      <a routerLink="/docs/electricity/home-assistant" data-test-id="docs-electricity-home-assistant">Home Assistant</a> or the
      <a routerLink="/docs/electricity/presets" data-test-id="docs-electricity-presets">presets</a>. Every field and parameter is in the
      <a routerLink="/docs/electricity/reference" data-test-id="docs-electricity-reference">API reference</a>.
    </p>

    <h2>Endpoints</h2>
    <p>Every electricity path is under <code>/v1/electricity</code>.</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Endpoint</th><th>What it answers</th></tr>
        </thead>
        <tbody>
          <tr><td><code>GET /v1/electricity/prices</code></td><td>Prices from a time to a time (<code>from</code>, <code>to</code>, <code>resolution=15min|hour</code>), with the price now. Defaults to midnight today, Finnish time, to the last published price.</td></tr>
          <tr><td><code>GET /v1/electricity/prices/current</code></td><td>Just the price now.</td></tr>
          <tr><td><code>GET /v1/electricity/plans</code></td><td>When to run a load: continuous (a washing machine) or pausable (an EV charger), with <code>activeNow</code> and <code>nextChangeAt</code> for switching a device.</td></tr>
          <tr><td><code>POST /v1/electricity/plans/search</code></td><td>The same, plus a power profile (<code>profileKwh</code>) and the cost of given start times (<code>startTimes</code>).</td></tr>
          <tr><td><code>GET /v1/electricity/plans/presets</code></td><td>Ready-made loads; <code>/v1/electricity/plans/presets/&#123;name&#125;</code> plans one.</td></tr>
          <tr><td><code>GET /v1/electricity/health</code></td><td>Whether the prices are fresh and when tomorrow's arrive.</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Units and times</h2>
    <ul>
      <li>Prices are day-ahead spot prices for Finland (ENTSO-E Transparency Platform, spot-hinta.fi as fallback) in 15-minute resolution, in c/kWh including 25.5 % VAT. <code>vat=false</code> leaves VAT out.</li>
      <li>Money is in cents, energy in kWh and power in kW. Costs are the energy only: no transfer, tax or retailer margin.</li>
      <li>Times are UTC in responses and may carry a UTC offset in requests, as in <a routerLink="/docs" data-test-id="docs-electricity-basics">every category</a>.</li>
      <li><code>category</code> is fixed thresholds: VERY_CHEAP under 2.5, CHEAP under 5, NORMAL under 10, EXPENSIVE under 20 c/kWh, else VERY_EXPENSIVE. <code>dayCategory</code> is the price's fifth within its own Finnish day, so every day has cheap hours.</li>
    </ul>

    <h2>When prices change</h2>
    <p>
      Tomorrow's prices are published once a day at about 14:00 Finnish time. Each response's <code>meta</code> tells
      <code>pricesUntil</code>, <code>tomorrowPublished</code> and <code>nextPricesExpectedAt</code>, so polling every
      15 minutes, or once after <code>nextPricesExpectedAt</code>, is plenty: responses are cached up to the next
      quarter hour, when the price now changes. <code>GET /v1/electricity/health</code> answers
      <code>late</code> when tomorrow's prices are over an hour late.
    </p>
  `,
  styleUrl: '../docs-page.scss',
})
export class DocsElectricityComponent {
  readonly base = API_BASE;
  readonly currentRequest = `curl ${API_BASE}/v1/electricity/prices/current`;
  readonly currentResponse = CURRENT_RESPONSE;
}
