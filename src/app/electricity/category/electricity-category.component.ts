import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';
import { resourceErrorMessage } from '../../shared/resource-error';
import { SpinnerComponent } from '../../shared/spinner/spinner.component';
import { CATEGORIES, QuestionId } from '../../topics';
import { ConsentSettingsLinkComponent } from '../../shared/consent/consent-settings-link.component';
import { Answer, ElectricityAnswers } from '../electricity-answers';

/** The Sähkö category page: one row per electricity question, like the other category pages */
@Component({
  selector: 'app-electricity-category',
  imports: [RouterLink, IconComponent, SpinnerComponent, ConsentSettingsLinkComponent],
  providers: [ElectricityAnswers],
  templateUrl: './electricity-category.component.html',
  styleUrls: ['../../money/money.component.scss', './electricity-category.component.scss'],
})
export class ElectricityCategoryComponent {
  private readonly answers = inject(ElectricityAnswers);

  readonly date = this.answers.date;
  readonly overview = this.answers.overview;
  readonly questions = CATEGORIES.find(({ id }) => id === 'sahko')?.questions ?? [];

  private readonly answerOf: Partial<Record<QuestionId, () => Answer | undefined>> = {
    price: this.answers.priceAnswer,
    sauna: this.answers.saunaAnswer,
    laundry: this.answers.laundryAnswer,
    ev: this.answers.evAnswer,
  };

  private readonly loadingOf: Partial<Record<QuestionId, () => boolean>> = {
    price: this.answers.overview.isLoading,
    sauna: this.answers.sauna.isLoading,
    laundry: this.answers.laundry.isLoading,
    ev: this.answers.ev.isLoading,
  };

  answer(id: QuestionId): Answer | undefined {
    return this.answerOf[id]?.();
  }

  loading(id: QuestionId): boolean {
    return this.loadingOf[id]?.() ?? false;
  }

  reload(): void {
    this.answers.reload();
  }

  readonly errorMessage = resourceErrorMessage;
}
