import { Component, afterNextRender, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDate } from '../shared/format/format';
import { IconComponent } from '../shared/icon/icon.component';
import { initialNow } from '../shared/render-time';
import { CATEGORIES } from '../topics';
import { finnishToday } from './banking-days';
import { MONEY_QUESTIONS, MoneyQuestionId } from './money-questions';
import { ConsentSettingsLinkComponent } from '../shared/consent/consent-settings-link.component';

/** The Raha category page: when money comes in, one row per question */
@Component({
  selector: 'app-money',
  imports: [RouterLink, IconComponent, ConsentSettingsLinkComponent],
  templateUrl: './money.component.html',
  styleUrl: './money.component.scss',
})
export class MoneyComponent {
  readonly now = signal(initialNow());
  readonly date = computed(() => formatDate(this.now()));

  readonly rows = computed(() => {
    const today = finnishToday(this.now());
    const category = CATEGORIES.find(({ id }) => id === 'raha');
    return (category?.questions ?? []).map((question) => ({
      ...question,
      answer: MONEY_QUESTIONS[question.id as MoneyQuestionId].answer(today),
    }));
  });

  constructor() {
    // A page cached overnight shows the right day once it is in the browser
    afterNextRender(() => this.now.set(new Date()));
  }
}
