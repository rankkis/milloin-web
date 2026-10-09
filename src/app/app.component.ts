import { Component, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsentBannerComponent } from './shared/consent/consent-banner.component';
import { ConsentService } from './shared/consent/consent.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConsentBannerComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor() {
    const consent = inject(ConsentService);
    afterNextRender(() => consent.init());
  }
}
