import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Shown for unknown addresses instead of a copy of the home page */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="answer">
        <h1 class="question">Sivua ei löytynyt</h1>
        <p class="message">Osoitteessa ei ole sivua. Katso sähkön hinta nyt etusivulta.</p>
        <a class="home" routerLink="/" data-test-id="not-found-home">Etusivulle</a>
      </div>
    </div>
  `,
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
