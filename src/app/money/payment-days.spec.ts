import { calendarDay, isBankingDay } from './banking-days';
import {
  KELA_PAYMENTS,
  PENSION_PAYMENTS,
  TAX_REFUND_DAYS,
  kelaAnswer,
  nextPaymentDay,
  pensionAnswer,
  taxRefundAnswer,
} from './payment-days';

// Friday
const TODAY = calendarDay(2026, 10, 9);

const kela = (name: string) => KELA_PAYMENTS.find((payment) => payment.name === name)!;

describe('payment days', () => {
  it('pays Kela benefits on their days, moved by the banking day rules', () => {
    // 1.11. is a Sunday
    expect(nextPaymentDay(kela('Opintoraha ja asumislisä'), TODAY)).toEqual(calendarDay(2026, 11, 2));
    expect(nextPaymentDay(kela('Yleinen asumistuki'), TODAY)).toEqual(calendarDay(2026, 11, 2));
    // 7.11. is a Saturday
    expect(nextPaymentDay(kela('Kansaneläke ja vammaistuet'), TODAY)).toEqual(calendarDay(2026, 11, 6));
    // 26.10. is a Monday
    expect(nextPaymentDay(kela('Lapsilisä'), TODAY)).toEqual(calendarDay(2026, 10, 23));
    // 31.10. is a Saturday
    expect(nextPaymentDay(kela('Kotihoidon tuki'), TODAY)).toEqual(calendarDay(2026, 10, 30));
  });

  it('pays lapsilisä before Christmas when the 26th is Boxing Day', () => {
    expect(nextPaymentDay(kela('Lapsilisä'), calendarDay(2026, 12, 1))).toEqual(calendarDay(2026, 12, 23));
  });

  it('moves to next month once this month’s day has passed, also over the new year', () => {
    const tyoelake = PENSION_PAYMENTS[0];
    expect(nextPaymentDay(tyoelake, TODAY)).toEqual(calendarDay(2026, 11, 2));
    expect(nextPaymentDay(tyoelake, calendarDay(2026, 12, 31))).toEqual(calendarDay(2027, 1, 4));
  });

  it('answers the Kela question with the soonest payment', () => {
    // Elatustuki: 10.10. is a Saturday, so it is paid today
    const answer = kelaAnswer(TODAY);
    expect(answer.value).toBe('pe 9.10.');
    expect(answer.detail).toBe('elatustuki · tänään');
    expect(answer.sentence).toBe('Elatustuki maksetaan tänään.');
    expect(answer.rows.length).toBe(KELA_PAYMENTS.length);
    expect(answer.rows.filter((row) => row.next).map((row) => row.name)).toEqual(['Elatustuki']);
  });

  it('names every payment on the soonest day', () => {
    const answer = kelaAnswer(calendarDay(2026, 10, 31));
    expect(answer.value).toBe('ma 2.11.');
    expect(answer.detail).toBe('opintoraha ja asumislisä ym. · 2 päivän päästä');
    expect(answer.sentence).toBe('Opintoraha ja asumislisä, yleinen asumistuki ja toimeentulotuki maksetaan ma 2.11.');
  });

  it('answers the pension question with työeläke', () => {
    const answer = pensionAnswer(TODAY);
    expect(answer.value).toBe('ma 2.11.');
    expect(answer.detail).toBe('työeläke · 24 päivän päästä');
    expect(answer.rows.map((row) => row.date)).toEqual(['ma 2.11.', 'ke 4.11.', 'pe 6.11.', 'to 22.10.']);
  });

  it('answers the tax refund question with the next published day', () => {
    const answer = taxRefundAnswer(TODAY);
    expect(answer.value).toBe('ti 3.11.');
    expect(answer.detail).toBe('verotus valmis syyskuussa · 25 päivän päästä');
    expect(answer.rows.filter((row) => row.past).length).toBe(4);
    expect(answer.rows.find((row) => row.next)?.date).toBe('ti 3.11.');
  });

  it('points to next July once this year’s refunds are paid', () => {
    const answer = taxRefundAnswer(calendarDay(2026, 12, 4));
    expect(answer.value).toBe('7/2027');
    expect(answer.rows.every((row) => row.past)).toBeTrue();
  });

  it('has only banking days as published refund days', () => {
    for (const { date } of TAX_REFUND_DAYS) {
      expect(isBankingDay(date)).withContext(date.toISOString()).toBeTrue();
    }
  });
});
