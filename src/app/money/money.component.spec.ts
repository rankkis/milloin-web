import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MoneyComponent } from './money.component';

// Friday 9.10.2026 10:00 Finnish time
const NOW = new Date('2026-10-09T07:00:00.000Z');

describe('MoneyComponent', () => {
  let fixture: ComponentFixture<MoneyComponent>;

  const text = (selector: string): string =>
    (fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
    TestBed.configureTestingModule({ imports: [MoneyComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(MoneyComponent);
    fixture.detectChanges();
  });

  afterEach(() => jasmine.clock().uninstall());

  it('shows the category name and links back to home', () => {
    expect(text('h1')).toBe('Raha');
    expect(text('.clock')).toBe('pe 9.10.');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-test-id="money-back"]')?.getAttribute('href')).toBe('/');
  });

  it('answers each question with its next payment day', () => {
    expect(text('[data-test-id="money-kela"] .question__text')).toBe('Milloin Kelan tuet maksetaan?');
    expect(text('[data-test-id="money-kela"] .question__answer')).toBe('pe 9.10.');
    expect(text('[data-test-id="money-kela"] .question__detail')).toBe('elatustuki · tänään');
    expect(text('[data-test-id="money-tax-refund"] .question__answer')).toBe('ti 3.11.');
    expect(text('[data-test-id="money-pension"] .question__answer')).toBe('ma 2.11.');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-test-id="money-pension"]')?.getAttribute('href'),
    ).toBe('/elake-maksetaan');
  });
});
