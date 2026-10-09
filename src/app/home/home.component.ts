import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ElectricityAnswers, Answer } from '../electricity/electricity-answers';
import { IconComponent } from '../shared/icon/icon.component';
import { resourceErrorMessage } from '../shared/resource-error';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { CATEGORIES, QuestionId } from '../topics';

/** Category filter value that shows every category */
const ALL = 'all';

/** Home: every question grouped by category, each with its answer */
@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, SpinnerComponent],
  providers: [ElectricityAnswers],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly answers = inject(ElectricityAnswers);

  readonly categories = CATEGORIES;
  readonly all = ALL;
  /** The filter is only worth showing once there is more than one category */
  readonly showFilter = CATEGORIES.length > 1;
  readonly selected = signal<string>(ALL);

  readonly shownCategories = computed(() => {
    const selected = this.selected();
    return selected === ALL ? CATEGORIES : CATEGORIES.filter((category) => category.id === selected);
  });

  readonly date = this.answers.date;
  readonly overview = this.answers.overview;

  /** Current price for the Sähkö heading, e.g. "nyt 4,82 c/kWh · normaali" */
  readonly electricityNow = computed(() => {
    const current = this.answers.current();
    return current && `nyt ${current.price} c/kWh · ${current.category.toLowerCase()}`;
  });

  private readonly answerOf: Record<QuestionId, () => Answer | undefined> = {
    sauna: this.answers.saunaAnswer,
    laundry: this.answers.laundryAnswer,
    ev: this.answers.evAnswer,
  };

  private readonly loadingOf: Record<QuestionId, () => boolean> = {
    sauna: this.answers.sauna.isLoading,
    laundry: this.answers.laundry.isLoading,
    ev: this.answers.ev.isLoading,
  };

  answer(id: QuestionId): Answer | undefined {
    return this.answerOf[id]();
  }

  loading(id: QuestionId): boolean {
    return this.loadingOf[id]();
  }

  select(id: string): void {
    this.selected.set(id);
  }

  reload(): void {
    this.answers.reload();
  }

  readonly errorMessage = resourceErrorMessage;
}
