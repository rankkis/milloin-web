import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { PaymentDayComponent } from './payment-day.component';
import { MoneyQuestionId } from '../money-questions';

// Friday 9.10.2026 10:00 Finnish time
const NOW = new Date('2026-10-09T07:00:00.000Z');

describe('PaymentDayComponent', () => {
  let fixture: ComponentFixture<PaymentDayComponent>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (selector: string): string => element().querySelector(selector)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
  const texts = (selector: string): string[] =>
    Array.from(element().querySelectorAll(selector)).map((el) => el.textContent?.trim().replace(/\s+/g, ' ') ?? '');

  const render = (question: MoneyQuestionId) => {
    TestBed.configureTestingModule({
      imports: [PaymentDayComponent],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { question } } } }],
    });
    fixture = TestBed.createComponent(PaymentDayComponent);
    fixture.detectChanges();
  };

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('answers the Kela question and lists every benefit', () => {
    render('kela');

    expect(text('h1')).toBe('Milloin Kelan tuet maksetaan?');
    expect(text('.answer__value')).toBe('pe 9.10.');
    expect(text('.answer__sentence')).toBe('Elatustuki maksetaan tänään.');
    expect(texts('.payment__name')).toContain('Lapsilisä');
    expect(element().querySelector('[data-test-id="payment-source"]')?.getAttribute('href')).toBe(
      'https://www.kela.fi/maksupaivat',
    );
  });

  it('answers the tax refund question and marks paid days', () => {
    render('tax-refund');

    expect(text('h1')).toBe('Milloin veronpalautukset tulevat?');
    expect(text('.answer__value')).toBe('ti 3.11.');
    expect(element().querySelectorAll('.payment--past').length).toBe(4);
  });

  it('has no refresh button, as nothing needs loading', () => {
    render('pension');

    expect(text('.answer__value')).toBe('ma 2.11.');
    expect(element().querySelector('[data-test-id="answer-refresh"]')).toBeNull();
  });
});
