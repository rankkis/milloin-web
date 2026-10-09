import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EnceAnswers } from '../ence/ence-answer';
import { IconComponent } from '../shared/icon/icon.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { formatDate } from '../shared/format/format';
import { CATEGORIES } from '../topics';
import { ConsentSettingsLinkComponent } from '../shared/consent/consent-settings-link.component';

/** The Sekalaista category page: one row per question */
@Component({
  selector: 'app-misc',
  imports: [RouterLink, IconComponent, SpinnerComponent, ConsentSettingsLinkComponent],
  providers: [EnceAnswers],
  templateUrl: './misc.component.html',
  styleUrl: '../money/money.component.scss',
})
export class MiscComponent {
  private readonly ence = inject(EnceAnswers);

  readonly date = computed(() => formatDate(this.ence.now()));
  readonly questions = CATEGORIES.find(({ id }) => id === 'sekalaista')?.questions ?? [];
  readonly answer = this.ence.answer;
  readonly loading = this.ence.ence.isLoading;
}
