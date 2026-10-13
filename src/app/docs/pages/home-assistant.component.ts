import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../code-block.component';
import { API_BASE } from './docs-samples';

const PRICE_SENSOR = `# configuration.yaml
rest:
  - resource: ${API_BASE}/v1/electricity/prices?resolution=hour
    scan_interval: 900
    sensor:
      - name: Electricity price
        unique_id: milloin_electricity_price
        value_template: "{{ value_json.current.price }}"
        unit_of_measurement: "c/kWh"
        state_class: measurement
        json_attributes:
          - prices
      - name: Electricity price today
        unique_id: milloin_electricity_price_today
        value_template: "{{ value_json.current.dayCategory }}"`;

const PLAN_SENSOR = `# configuration.yaml, under the same rest: key
  - resource: ${API_BASE}/v1/electricity/plans?pausable=true&durationHours=4&minBlockHours=1&earliestStart=today&latestEnd=tomorrow
    scan_interval: 60
    binary_sensor:
      - name: Water heater cheap hours
        unique_id: milloin_water_heater_cheap_hours
        value_template: "{{ value_json.activeNow }}"`;

const AUTOMATION = `# automations.yaml
- alias: Water heater on in the cheap hours
  triggers:
    - trigger: state
      entity_id: binary_sensor.water_heater_cheap_hours
      to: ["on", "off"]
  actions:
    - action: "switch.turn_{{ trigger.to_state.state }}"
      target:
        entity_id: switch.water_heater`;

const CHEAPEST_FIFTH = `# configuration.yaml
template:
  - binary_sensor:
      - name: Electricity cheapest fifth of the day
        unique_id: milloin_cheapest_fifth
        state: "{{ is_state('sensor.electricity_price_today', 'VERY_CHEAP') }}"`;

/** /docs/electricity/home-assistant: REST sensors for the price and a plan, and an automation that follows the plan */
@Component({
  selector: 'app-docs-home-assistant',
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <h1>Home Assistant</h1>
    <p class="lead">
      Show the spot price in Home Assistant and switch a device on in the cheapest hours, with the
      <a href="https://www.home-assistant.io/integrations/rest/" data-test-id="docs-ha-rest">RESTful integration</a>.
      No API key, add-on or custom component is needed.
    </p>

    <h2>The price now</h2>
    <p>
      This sensor reads the price of the current hour every 15 minutes. Its <code>prices</code> attribute holds the
      hourly prices from midnight today to the last published hour, ready for a chart card. The second sensor tells how
      cheap the hour is compared with the rest of the day, from <code>VERY_CHEAP</code> (the cheapest fifth) to
      <code>VERY_EXPENSIVE</code>.
    </p>
    <app-code-block [code]="priceSensor" />
    <p>
      Leave out <code>resolution=hour</code> for the 15-minute price. The attribute then holds four times as many
      prices, over the 16 kB Home Assistant keeps in its database.
    </p>

    <h2>Run a device in the cheapest hours</h2>
    <p>
      This binary sensor is on during the cheapest 4 hours of each day, in blocks of at least an hour, for example for
      a water heater. <code>earliestStart=today</code> and <code>latestEnd=tomorrow</code> plan the whole Finnish day from
      midnight to midnight, so the plan stays the same as the day goes on: it does not move when blocks are over or when
      tomorrow's prices arrive.
    </p>
    <app-code-block [code]="planSensor" />
    <p>An automation switches the device when the sensor changes:</p>
    <app-code-block [code]="automation" />
    <p>
      Change <code>durationHours</code> to how long the device needs to run, or give <code>energyKwh</code> and
      <code>maxPowerKw</code> instead. Every parameter is in <a routerLink="/docs/electricity/custom-plans" data-test-id="docs-ha-custom-plans">Custom plans</a>.
      Polling every minute is fine: the CDN answers the repeats, and <code>activeNow</code> changes on the quarter hour.
    </p>

    <h2>The cheapest fifth of the day</h2>
    <p>Without a plan: a template sensor that is on whenever the price is among the cheapest fifth of its day.</p>
    <app-code-block [code]="cheapestFifth" />
  `,
  styleUrl: '../docs-page.scss',
})
export class DocsHomeAssistantComponent {
  readonly priceSensor = PRICE_SENSOR;
  readonly planSensor = PLAN_SENSOR;
  readonly automation = AUTOMATION;
  readonly cheapestFifth = CHEAPEST_FIFTH;
}
