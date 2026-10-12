import { Component, inject } from '@angular/core';
import { ConsentService } from './consent.service';

/** Asks for consent to cookies; shown until the visitor chooses, while CONSENT_BANNER_ENABLED */
@Component({
  selector: 'app-consent-banner',
  templateUrl: './consent-banner.component.html',
  styleUrl: './consent-banner.component.scss',
})
export class ConsentBannerComponent {
  protected readonly consent = inject(ConsentService);
}
