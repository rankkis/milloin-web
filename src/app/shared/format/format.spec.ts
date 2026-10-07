import {
  formatClock,
  formatDate,
  formatDay,
  formatPrice,
  formatTimeUntil,
  formatWindow,
} from './format';

describe('format', () => {
  // 2026-10-07 13:42 Finnish summer time (UTC+3)
  const now = new Date('2026-10-07T10:42:00.000Z');

  it('formats prices with a decimal comma', () => {
    expect(formatPrice(4.8249)).toBe('4,82');
    expect(formatPrice(12)).toBe('12,00');
  });

  it('formats clock times and windows in Finnish time', () => {
    expect(formatClock('2026-10-07T12:00:00.000Z')).toBe('15:00');
    expect(formatClock('2026-10-07T21:05:00.000Z')).toBe('00:05');
    expect(
      formatWindow('2026-10-07T12:00:00.000Z', '2026-10-07T14:00:00.000Z'),
    ).toBe('15:00–17:00');
  });

  it('formats Finnish winter time', () => {
    expect(formatClock('2026-12-01T12:00:00.000Z')).toBe('14:00');
  });

  it('formats the weekday and date', () => {
    expect(formatDate(now)).toBe('ke 7.10.');
  });

  it('formats the time until a moment', () => {
    expect(formatTimeUntil('2026-10-07T12:00:00.000Z', now)).toBe('1 h 18 min');
    expect(formatTimeUntil('2026-10-07T11:00:00.000Z', now)).toBe('18 min');
    expect(formatTimeUntil('2026-10-07T12:42:00.000Z', now)).toBe('2 h');
    expect(formatTimeUntil('2026-10-07T10:00:00.000Z', now)).toBeNull();
  });

  it('names the day a window starts', () => {
    expect(formatDay('2026-10-07T10:30:00.000Z', now)).toBe('nyt');
    expect(formatDay('2026-10-07T12:00:00.000Z', now)).toBe('tänään');
    expect(formatDay('2026-10-07T19:00:00.000Z', now)).toBe('tänä yönä');
    expect(formatDay('2026-10-07T22:00:00.000Z', now)).toBe('ensi yönä');
    expect(formatDay('2026-10-08T09:00:00.000Z', now)).toBe('huomenna');
  });
});
