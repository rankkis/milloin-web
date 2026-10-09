import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnswerHeaderComponent } from '../../shared/answer-header/answer-header.component';
import { initialNow } from '../../shared/render-time';
import { CATEGORIES } from '../../topics';
import { finnishToday } from '../banking-days';
import { MONEY_QUESTIONS, MoneyQuestionId } from '../money-questions';

/** Route data of a Raha question page */
export interface PaymentDayRouteData {
  question: MoneyQuestionId;
}

/** A Raha question page: the next payment day and the payment days around it */
@Component({
  selector: 'app-payment-day',
  imports: [AnswerHeaderComponent],
  templateUrl: './payment-day.component.html',
  styleUrl: './payment-day.component.scss',
})
export class PaymentDayComponent {
  private readonly id = (inject(ActivatedRoute).snapshot.data as PaymentDayRouteData).question;

  readonly question = MONEY_QUESTIONS[this.id];
  readonly title = CATEGORIES.flatMap((category) => category.questions).find((question) => question.id === this.id)
    ?.title;

  readonly now = signal(initialNow());
  readonly answer = computed(() => this.question.answer(finnishToday(this.now())));

  constructor() {
    // A page cached overnight shows the right day once it is in the browser
    afterNextRender(() => this.now.set(new Date()));
  }
}
