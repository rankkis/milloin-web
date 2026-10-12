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

const ERROR_RESPONSE = `HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "durationHours must not be greater than 24",
  "errors": [{ "field": "durationHours", "message": "durationHours must not be greater than 24" }]
}`;

/** /docs: what the API is, its endpoints, units, freshness, limits and errors */
@Component({
  selector: 'app-docs-overview',
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <h1>milloin.xyz API</h1>
    <p class="lead">
      Finnish electricity spot prices and the cheapest times to run a load, the same data that powers
      <a href="https://milloin.xyz" data-test-id="docs-overview-site">milloin.xyz</a>. Free to use, no API key or sign-up.
    </p>

    <h2>Quick start</h2>
    <p>Every endpoint is under <code>{{ base }}</code>. The price now:</p>
    <app-code-block title="Request" [code]="currentRequest" />
    <app-code-block title="Response" [code]="currentResponse" />
    <p>
      Running a device in the cheap hours? Start with
      <a routerLink="/docs/home-assistant" data-test-id="docs-overview-home-assistant">Home Assistant</a> or the
      <a routerLink="/docs/presets" data-test-id="docs-overview-presets">presets</a>. Every field and parameter is in the
      <a routerLink="/docs/reference" data-test-id="docs-overview-reference">API reference</a>.
    </p>

    <h2>Endpoints</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Endpoint</th><th>What it answers</th></tr>
        </thead>
        <tbody>
          <tr><td><code>GET /v1/prices</code></td><td>Prices from a time to a time (<code>from</code>, <code>to</code>, <code>resolution=15min|hour</code>), with the price now. Defaults to midnight today, Finnish time, to the last published price.</td></tr>
          <tr><td><code>GET /v1/prices/current</code></td><td>Just the price now.</td></tr>
          <tr><td><code>GET /v1/plans</code></td><td>When to run a load: continuous (a washing machine) or pausable (an EV charger), with <code>activeNow</code> and <code>nextChangeAt</code> for switching a device.</td></tr>
          <tr><td><code>POST /v1/plans/search</code></td><td>The same, plus a power profile (<code>profileKwh</code>) and the cost of given start times (<code>startTimes</code>).</td></tr>
          <tr><td><code>GET /v1/plans/presets</code></td><td>Ready-made loads; <code>/v1/plans/presets/&#123;name&#125;</code> plans one.</td></tr>
          <tr><td><code>GET /v1/health</code></td><td>Whether the prices are fresh and when tomorrow's arrive.</td></tr>
        </tbody>
      </table>
    </div>
    <p>The OpenAPI document is at <a [href]="base + '/openapi.json'" data-test-id="docs-overview-openapi">{{ base }}/openapi.json</a>, for generating a client.</p>

    <h2>Units and times</h2>
    <ul>
      <li>Prices are day-ahead spot prices for Finland (ENTSO-E Transparency Platform, spot-hinta.fi as fallback) in 15-minute resolution, in c/kWh including 25.5 % VAT. <code>vat=false</code> leaves VAT out.</li>
      <li>Money is in cents, energy in kWh and power in kW. Costs are the energy only: no transfer, tax or retailer margin.</li>
      <li>Times in responses are UTC (ISO 8601, <code>Z</code>). Requests may give a UTC offset, such as <code>2026-10-13T07:00:00+03:00</code>; write the <code>+</code> as <code>%2B</code> in a URL (a plain <code>+</code> also works).</li>
      <li><code>category</code> is fixed thresholds: VERY_CHEAP under 2.5, CHEAP under 5, NORMAL under 10, EXPENSIVE under 20 c/kWh, else VERY_EXPENSIVE. <code>dayCategory</code> is the price's fifth within its own Finnish day, so every day has cheap hours.</li>
    </ul>

    <h2>When prices change</h2>
    <p>
      Tomorrow's prices are published once a day at about 14:00 Finnish time. Each response's <code>meta</code> tells
      <code>pricesUntil</code>, <code>tomorrowPublished</code> and <code>nextPricesExpectedAt</code>, so polling every
      15 minutes, or once after <code>nextPricesExpectedAt</code>, is plenty. <code>GET /v1/health</code> answers
      <code>late</code> when tomorrow's prices are over an hour late.
    </p>

    <h2>Limits and caching</h2>
    <p>
      GET responses carry <code>Cache-Control</code> up to the next quarter hour, when the price now changes, and
      repeated requests are answered from the CDN. Requests that reach the server count against 60 a minute for each IP
      address; over that the API answers <code>429 Too Many Requests</code> with <code>Retry-After</code>. Any website may
      call the API from the browser (CORS). A link back to milloin.xyz is appreciated.
    </p>
    <p>
      For higher volumes, guaranteed availability or your own endpoints, write to
      <a href="mailto:jarkko.peltola@hurlumhei.xyz" data-test-id="docs-overview-contact">jarkko.peltola&#64;hurlumhei.xyz</a>.
    </p>

    <h2>Errors</h2>
    <p>Every error is <code>application/problem+json</code>; a validation error lists the fields that failed.</p>
    <app-code-block [code]="errorResponse" />
  `,
  styleUrl: '../docs-page.scss',
})
export class DocsOverviewComponent {
  readonly base = API_BASE;
  readonly currentRequest = `curl ${API_BASE}/v1/prices/current`;
  readonly currentResponse = CURRENT_RESPONSE;
  readonly errorResponse = ERROR_RESPONSE;
}
