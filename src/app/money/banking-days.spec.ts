import {
  bankingDayOnOrAfter,
  bankingDayOnOrBefore,
  calendarDay,
  easterSunday,
  finnishToday,
  isBankingDay,
} from './banking-days';

describe('banking days', () => {
  it('finds Easter Sunday', () => {
    expect(easterSunday(2026)).toEqual(calendarDay(2026, 4, 5));
    expect(easterSunday(2027)).toEqual(calendarDay(2027, 3, 28));
  });

  it('closes banks on weekends and Finnish bank holidays', () => {
    const closed2026 = [
      [1, 1], // uudenvuodenpäivä
      [1, 6], // loppiainen
      [4, 3], // pitkäperjantai
      [4, 6], // 2. pääsiäispäivä
      [5, 1], // vappu
      [5, 14], // helatorstai
      [6, 19], // juhannusaatto
      [12, 24],
      [12, 25],
      [10, 10], // lauantai
      [10, 11], // sunnuntai
    ];
    for (const [month, day] of closed2026) {
      expect(isBankingDay(calendarDay(2026, month, day)))
        .withContext(`${day}.${month}.`)
        .toBeFalse();
    }
    // Independence Day 2027 is a Monday
    expect(isBankingDay(calendarDay(2027, 12, 6))).toBeFalse();
    expect(isBankingDay(calendarDay(2026, 10, 9))).toBeTrue();
    expect(isBankingDay(calendarDay(2026, 12, 31))).toBeTrue();
  });

  it('moves a closed day to the banking day before or after it', () => {
    expect(bankingDayOnOrBefore(calendarDay(2026, 12, 26))).toEqual(calendarDay(2026, 12, 23));
    expect(bankingDayOnOrAfter(calendarDay(2027, 1, 1))).toEqual(calendarDay(2027, 1, 4));
    expect(bankingDayOnOrAfter(calendarDay(2026, 10, 9))).toEqual(calendarDay(2026, 10, 9));
  });

  it('takes today from Finnish time', () => {
    // 23:30 UTC is already the next day in Finland
    expect(finnishToday(new Date('2026-10-08T23:30:00Z'))).toEqual(calendarDay(2026, 10, 9));
  });
});
