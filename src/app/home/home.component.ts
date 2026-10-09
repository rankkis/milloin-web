import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ElectricityAnswers, Answer } from '../electricity/electricity-answers';
import { EnceAnswers } from '../ence/ence-answer';
import { finnishToday } from '../money/banking-days';
import { MONEY_QUESTIONS } from '../money/money-questions';
import { IconComponent } from '../shared/icon/icon.component';
import { resourceErrorMessage } from '../shared/resource-error';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { CATEGORIES, QuestionId } from '../topics';
import { ConsentSettingsLinkComponent } from '../shared/consent/consent-settings-link.component';

/** Category filter value that shows every category */
const ALL = 'all';

/** Home: every question grouped by category, each with its answer */
@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, SpinnerComponent, ConsentSettingsLinkComponent],
  providers: [ElectricityAnswers, EnceAnswers],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly answers = inject(ElectricityAnswers);
  private readonly ence = inject(EnceAnswers);

  readonly categories = CATEGORIES;
  readonly all = ALL;
  /** The filter is only worth showing once there is more than one category */
  readonly showFilter = CATEGORIES.length > 1;
  readonly selected = signal<string>(ALL);

  readonly shownCategories = computed(() => {
    const selected = this.selected();
    return selected === ALL ? CATEGORIES : CATEGORIES.filter((category) => category.id === selected);
  });

  readonly now = this.answers.now;
  readonly date = this.answers.date;
  readonly overview = this.answers.overview;

  /** Current price for the Sähkö heading, e.g. "nyt 4,82 c/kWh · normaali" */
  readonly electricityNow = computed(() => {
    const current = this.answers.current();
    return current && `nyt ${current.price} c/kWh · ${current.category.toLowerCase()}`;
  });

  private readonly today = computed(() => finnishToday(this.now()));

  /** A Raha answer: a payment day, calculated here from the published rules */
  private moneyAnswer(id: keyof typeof MONEY_QUESTIONS): () => Answer {
    return computed(() => {
      const { value, short, detail } = MONEY_QUESTIONS[id].answer(this.today());
      return { value, short, detail, price: '', highlight: false };
    });
  }

  private readonly answerOf: Record<QuestionId, () => Answer | undefined> = {
    sauna: this.answers.saunaAnswer,
    laundry: this.answers.laundryAnswer,
    ev: this.answers.evAnswer,
    kela: this.moneyAnswer('kela'),
    'tax-refund': this.moneyAnswer('tax-refund'),
    pension: this.moneyAnswer('pension'),
    ence: this.ence.answer,
  };

  private readonly loadingOf: Partial<Record<QuestionId, () => boolean>> = {
    sauna: this.answers.sauna.isLoading,
    laundry: this.answers.laundry.isLoading,
    ev: this.answers.ev.isLoading,
    ence: this.ence.ence.isLoading,
  };

  answer(id: QuestionId): Answer | undefined {
    return this.answerOf[id]();
  }

  loading(id: QuestionId): boolean {
    return this.loadingOf[id]?.() ?? false;
  }

  /** Answer and price joined for the row, e.g. "tänään · 39,7 snt"; Raha answers have no price */
  withPrice(text: string, price: string): string {
    return price ? `${text} · ${price}` : text;
  }

  select(id: string): void {
    this.selected.set(id);
  }

  reload(): void {
    this.answers.reload();
    this.ence.reload();
  }

  readonly errorMessage = resourceErrorMessage;
}
