import { formatDate } from '../shared/format/format';
import {
  addDays,
  bankingDayOnOrAfter,
  bankingDayOnOrBefore,
  calendarDay,
  daysBetween,
  lastDayOfMonth,
} from './banking-days';

/**
 * Payment days of Kela benefits, pensions and tax refunds, from the rules
 * the payers publish:
 * - Kela: https://www.kela.fi/maksupaivat
 * - Työeläke: https://www.tyoelake.fi/miten-haen-elaketta/elakkeen-maksaminen-ja-verotus/
 * - Veronpalautukset: https://vero.fi/henkiloasiakkaat/maksaminen/veronpalautukset/veronpalautuksen-maara-ja-maksupaivat/
 */

/** A payment made once a month, and the day it lands in a given month */
export interface MonthlyPayment {
  name: string;
  /** The rule in words, e.g. "kuun 7. päivä" */
  rule: string;
  dayIn: (year: number, month: number) => Date;
}

/** On the given day, or the banking day before it when banks are closed */
const onOrBefore = (day: number) => (year: number, month: number) =>
  bankingDayOnOrBefore(calendarDay(year, month, day));

/** On the given day, or the banking day after it when banks are closed */
const onOrAfter = (day: number) => (year: number, month: number) =>
  bankingDayOnOrAfter(calendarDay(year, month, day));

const firstBankingDay = onOrAfter(1);

const lastBankingDay = (year: number, month: number) =>
  bankingDayOnOrBefore(lastDayOfMonth(year, month));

/** Lapsilisä: the 26th, but the banking day before it when the 26th is a Saturday, Sunday, Monday or holiday */
const childBenefitDay = (year: number, month: number) => {
  const day = calendarDay(year, month, 26);
  return day.getUTCDay() === 1
    ? bankingDayOnOrBefore(addDays(day, -1))
    : bankingDayOnOrBefore(day);
};

/** Kela benefits paid on a fixed day of the month, in the order of the day */
export const KELA_PAYMENTS: MonthlyPayment[] = [
  {
    name: 'Opintoraha ja asumislisä',
    rule: 'kuun 1. päivä tai seuraava pankkipäivä',
    dayIn: onOrAfter(1),
  },
  {
    name: 'Yleinen asumistuki',
    rule: 'kuun 1. pankkipäivä',
    dayIn: firstBankingDay,
  },
  {
    name: 'Toimeentulotuki',
    rule: 'kuun 1. pankkipäivä',
    dayIn: firstBankingDay,
  },
  {
    name: 'Eläkkeensaajan asumistuki',
    rule: 'kuun 4. päivä tai edellinen pankkipäivä',
    dayIn: onOrBefore(4),
  },
  {
    name: 'Kansaneläke ja vammaistuet',
    rule: 'kuun 7. päivä tai edellinen pankkipäivä',
    dayIn: onOrBefore(7),
  },
  {
    name: 'Elatustuki',
    rule: 'kuun 10. päivä tai edellinen pankkipäivä',
    dayIn: onOrBefore(10),
  },
  {
    name: 'Takuueläke',
    rule: 'kuun 22. päivä tai edellinen pankkipäivä',
    dayIn: onOrBefore(22),
  },
  {
    name: 'Lapsilisä',
    rule: 'kuun 26. päivä; jos se on la, su, ma tai pyhä, edellinen pankkipäivä',
    dayIn: childBenefitDay,
  },
  {
    name: 'Kotihoidon tuki',
    rule: 'kuun viimeinen arkipäivä',
    dayIn: lastBankingDay,
  },
];

/** Pensions, työeläke first since most pensioners get one */
export const PENSION_PAYMENTS: MonthlyPayment[] = [
  {
    name: 'Työeläke',
    rule: 'kuun 1. pankkipäivä useimmilla eläkelaitoksilla',
    dayIn: firstBankingDay,
  },
  {
    name: 'Eläkkeensaajan asumistuki',
    rule: 'kuun 4. päivä tai edellinen pankkipäivä',
    dayIn: onOrBefore(4),
  },
  {
    name: 'Kansaneläke',
    rule: 'kuun 7. päivä tai edellinen pankkipäivä',
    dayIn: onOrBefore(7),
  },
  {
    name: 'Takuueläke',
    rule: 'kuun 22. päivä tai edellinen pankkipäivä',
    dayIn: onOrBefore(22),
  },
];

/** A published tax refund payment day and whose taxation it is for */
export interface TaxRefundDay {
  /** Month the taxation ended in */
  taxationEnded: string;
  date: Date;
}

/** Refund days for the 2025 taxation, paid in 2026 */
export const TAX_REFUND_DAYS: TaxRefundDay[] = [
  { taxationEnded: 'toukokuussa', date: calendarDay(2026, 7, 3) },
  { taxationEnded: 'kesäkuussa', date: calendarDay(2026, 8, 3) },
  { taxationEnded: 'heinäkuussa', date: calendarDay(2026, 9, 3) },
  { taxationEnded: 'elokuussa', date: calendarDay(2026, 10, 5) },
  { taxationEnded: 'syyskuussa', date: calendarDay(2026, 11, 3) },
  { taxationEnded: 'lokakuussa', date: calendarDay(2026, 12, 3) },
];

/** The first payment day on or after today */
export function nextPaymentDay(payment: MonthlyPayment, today: Date): Date {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;
  const thisMonth = payment.dayIn(year, month);
  if (daysBetween(today, thisMonth) >= 0) return thisMonth;
  return month === 12
    ? payment.dayIn(year + 1, 1)
    : payment.dayIn(year, month + 1);
}

/** Days until a payment in words: tänään, huomenna, 5 päivän päästä */
export function formatDaysUntil(date: Date, today: Date): string {
  const days = daysBetween(today, date);
  if (days === 0) return 'tänään';
  if (days === 1) return 'huomenna';
  return `${days} päivän päästä`;
}

export interface PaymentRow {
  name: string;
  rule: string;
  date: string;
  until: string;
  /** The soonest payment in the list */
  next: boolean;
  /** Already paid this year */
  past: boolean;
}

export interface PaymentAnswer {
  /** The date, e.g. ma 26.10., or a month when no date is published yet */
  value: string;
  /** Shown under the answer on phones */
  short: string;
  /** Shown in its own column on wider screens */
  detail: string;
  /** The answer as a sentence on the question page */
  sentence: string;
  rows: PaymentRow[];
}

/** Ends with a full stop, unless the last word (a date like 2.11.) already has one */
const endSentence = (text: string): string =>
  text.endsWith('.') ? text : `${text}.`;

const sentenceCase = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** Names in a sentence: a, b ja c */
const joinNames = (names: string[]): string =>
  names.length > 1
    ? `${names.slice(0, -1).join(', ')} ja ${names[names.length - 1]}`
    : names[0];

/** When a payment lands, in a sentence: tänään, huomenna or the date */
const sentenceDay = (date: Date, today: Date): string =>
  daysBetween(today, date) <= 1
    ? formatDaysUntil(date, today)
    : formatDate(date);

/**
 * The next day of each monthly payment, answered with the soonest of them,
 * or with the first in the list when it is the one the question is about
 */
function monthlyAnswer(
  payments: MonthlyPayment[],
  today: Date,
  answerWithFirst = false,
): PaymentAnswer {
  const dated = payments.map((payment) => ({
    payment,
    date: nextPaymentDay(payment, today),
  }));
  const answer = answerWithFirst
    ? dated[0]
    : dated.reduce((a, b) => (b.date < a.date ? b : a));
  const paidThen = answerWithFirst
    ? [answer]
    : dated.filter(({ date }) => date.getTime() === answer.date.getTime());
  const names = paidThen.map(({ payment }) => payment.name.toLowerCase());
  const until = formatDaysUntil(answer.date, today);
  return {
    value: formatDate(answer.date),
    short: until,
    detail: `${names[0]}${names.length > 1 ? ' ym.' : ''} · ${until}`,
    sentence: endSentence(
      `${sentenceCase(joinNames(names))} maksetaan ${sentenceDay(answer.date, today)}`,
    ),
    // In the order of the day, except when one payment is the answer: it stays first
    rows: (answerWithFirst
      ? dated
      : [...dated].sort((a, b) => a.date.getTime() - b.date.getTime())
    ).map(({ payment, date }) => ({
      name: payment.name,
      rule: payment.rule,
      date: formatDate(date),
      until: formatDaysUntil(date, today),
      next: paidThen.some((paid) => paid.payment === payment),
      past: false,
    })),
  };
}

/** Milloin Kelan tuet maksetaan? The soonest Kela payment day */
export function kelaAnswer(today: Date): PaymentAnswer {
  return monthlyAnswer(KELA_PAYMENTS, today);
}

/** Milloin eläke maksetaan? The next työeläke day, with the other pensions listed */
export function pensionAnswer(today: Date): PaymentAnswer {
  return monthlyAnswer(PENSION_PAYMENTS, today, true);
}

/** Milloin veronpalautukset tulevat? The next published refund day */
export function taxRefundAnswer(today: Date): PaymentAnswer {
  const next = TAX_REFUND_DAYS.find(
    ({ date }) => daysBetween(today, date) >= 0,
  );
  const rows = TAX_REFUND_DAYS.map(({ taxationEnded, date }) => ({
    name: `Verotus valmistui ${taxationEnded}`,
    rule: '',
    date: formatDate(date),
    until:
      daysBetween(today, date) >= 0 ? formatDaysUntil(date, today) : 'maksettu',
    next: date === next?.date,
    past: daysBetween(today, date) < 0,
  }));

  if (!next) {
    const year =
      TAX_REFUND_DAYS[TAX_REFUND_DAYS.length - 1].date.getUTCFullYear() + 1;
    return {
      value: `7/${year}`,
      short: 'heinäkuussa',
      detail: `seuraavat palautukset heinäkuusta ${year} alkaen`,
      sentence: `Tämän vuoden palautukset on maksettu. Seuraavat veronpalautukset maksetaan heinä–joulukuussa ${year}.`,
      rows,
    };
  }

  const until = formatDaysUntil(next.date, today);
  return {
    value: formatDate(next.date),
    short: until,
    detail: `verotus valmis ${next.taxationEnded} · ${until}`,
    sentence: `Seuraava palautuspäivä on ${formatDate(next.date)}, jos verotuksesi valmistui ${next.taxationEnded}.`,
    rows,
  };
}
