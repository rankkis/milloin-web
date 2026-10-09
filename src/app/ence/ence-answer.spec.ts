import { EnceDto, EnceMatchDto } from './ence.model';
import { enceAnswer, matchDay, matchValue, matchWhen, timeUntil } from './ence-answer';

// Friday 9.10.2026 13:50 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-09T10:50:00.000Z');

const match = (startTime: string, live = false): EnceMatchDto => ({
  startTime,
  live,
  opponent: { name: 'Sashi' },
  event: 'CCT Europe Series 9',
  format: 'Bo3',
});

const ence = (nextMatch?: EnceMatchDto): EnceDto => ({
  updatedAt: '2026-10-09T10:12:00.000Z',
  source: 'PandaScore',
  team: { name: 'ENCE' },
  nextMatch: nextMatch && { ...nextMatch, streams: [] },
  upcoming: [],
  results: [],
  news: [],
});

describe('ENCE answers', () => {
  it('answers with the clock time today, weekday and time within a week, date later', () => {
    expect(matchValue(match('2026-10-09T15:30:00.000Z'), NOW)).toBe('18:30');
    expect(matchValue(match('2026-10-10T15:30:00.000Z'), NOW)).toBe('la 18:30');
    expect(matchValue(match('2026-10-20T15:30:00.000Z'), NOW)).toBe('ti 20.10.');
  });

  it('answers Nyt once the match is running or past its start', () => {
    expect(matchValue(match('2026-10-09T12:00:00.000Z', true), NOW)).toBe('Nyt');
    expect(matchValue(match('2026-10-09T10:30:00.000Z'), NOW)).toBe('Nyt');
  });

  it('names the day', () => {
    expect(matchDay('2026-10-09T18:00:00.000Z', NOW)).toBe('tänään');
    expect(matchDay('2026-10-10T15:30:00.000Z', NOW)).toBe('huomenna');
    expect(matchDay('2026-10-11T15:30:00.000Z', NOW)).toBe('ylihuomenna');
    expect(matchDay('2026-10-14T15:30:00.000Z', NOW)).toBe('5 päivän päästä');
  });

  it('tells the time until the start in days, hours and minutes', () => {
    expect(timeUntil('2026-10-10T15:30:00.000Z', NOW)).toBe('1 pv 4 h 40 min');
    expect(timeUntil('2026-10-09T11:00:00.000Z', NOW)).toBe('10 min');
    expect(timeUntil('2026-10-09T12:50:00.000Z', NOW)).toBe('2 h');
  });

  it('gives the date and time in Finnish time', () => {
    expect(matchWhen('2026-10-10T15:30:00.000Z')).toBe('la 10.10. 18:30');
  });

  it('answers home and the category page', () => {
    expect(enceAnswer(ence(match('2026-10-10T15:30:00.000Z')), NOW)).toEqual({
      value: 'la 18:30',
      short: 'huomenna · vs. Sashi',
      detail: 'huomenna vs. Sashi · CCT Europe Series 9, Bo3',
      price: '',
      highlight: true,
    });
    expect(enceAnswer(ence(match('2026-10-09T10:30:00.000Z', true)), NOW).short).toBe('käynnissä · vs. Sashi');
    expect(enceAnswer(ence(), NOW)).toEqual(jasmine.objectContaining({ value: 'Ei tiedossa', highlight: false }));
  });
});
