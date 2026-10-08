import { StartDelayDto } from '../shared/models/price.model';
import { RULE_TEXT, recommendDelay, requiredSaving } from './laundry-recommendation';

/** Start delays Nyt, +1, +2 … with these costs in cents */
const delays = (...costs: number[]): StartDelayDto[] =>
  costs.map((costCents, delayHours) => ({
    delayHours,
    startTime: '',
    endTime: '',
    priceAvg: costCents,
    priceCategory: 'NORMAL',
    costCents,
    isBest: false,
  }));

describe('recommendDelay', () => {
  it('needs 5 cents for the first hour and 2 cents more for each further hour', () => {
    expect([0, 1, 2, 3, 4, 5].map(requiredSaving)).toEqual([0, 5, 7, 9, 11, 13]);
    expect(RULE_TEXT).toBe(
      'Odottaminen kannattaa vasta, kun säästö on vähintään 5 senttiä. ' +
        'Jokainen lisätunti vaatii 2 senttiä enemmän säästöä.',
    );
  });

  // Worked examples from the spec

  it('starts now when the cheapest delay saves too little (+4 h saves 3,1 < 11)', () => {
    const result = recommendDelay(delays(7.6, 8.1, 6.9, 5.2, 4.5, 6.3))!;

    expect(result.recommended.delayHours).toBe(0);
    expect(result.cheapest.delayHours).toBe(4);
    expect(result.saving).toBe(0);
    expect(result.extraSavingIfWaitLonger).toBe(3.1);
    expect(result.hours).toBe(5);
  });

  it('waits 2 hours when it saves enough and longer waits do not (8,2 ≥ 7; +5 h 9,8 < 13)', () => {
    const result = recommendDelay(delays(14.8, 12.9, 6.6, 6.1, 5.4, 5.0))!;

    expect(result.recommended.delayHours).toBe(2);
    expect(result.cheapest.delayHours).toBe(5);
    expect(result.saving).toBe(8.2);
    expect(result.extraSavingIfWaitLonger).toBe(1.6);
  });

  it('waits 1 hour when it saves exactly 5 cents', () => {
    const result = recommendDelay(delays(10, 5, 5, 5, 5, 5))!;

    expect(result.recommended.delayHours).toBe(1);
    expect(result.cheapest.delayHours).toBe(1);
    expect(result.saving).toBe(5);
    expect(result.extraSavingIfWaitLonger).toBe(0);
  });

  it('starts now when +1 h saves only 1,8 cents', () => {
    const result = recommendDelay(delays(5.8, 4.0, 4.2, 8.5, 14.6, 16.6))!;

    expect(result.recommended.delayHours).toBe(0);
    expect(result.cheapest.delayHours).toBe(1);
    expect(result.extraSavingIfWaitLonger).toBe(1.8);
  });

  // Edge cases

  it('compares costs rounded to 0,1 cents', () => {
    // 9,96 − 4,96 shows as 10,0 − 5,0 = 5,0
    expect(recommendDelay(delays(9.96, 4.96))!.recommended.delayHours).toBe(1);
    // 9,94 − 4,96 shows as 9,9 − 5,0 = 4,9
    expect(recommendDelay(delays(9.94, 4.96))!.recommended.delayHours).toBe(0);
  });

  it('prefers the shorter delay on equal net saving', () => {
    // +1 h: 6 − 5 = 1, +2 h: 8 − 7 = 1
    expect(recommendDelay(delays(10, 4, 2))!.recommended.delayHours).toBe(1);
  });

  it('runs on the available options when fewer than six are published', () => {
    const result = recommendDelay(delays(14, 11, 6))!;

    expect(result.recommended.delayHours).toBe(2);
    expect(result.hours).toBe(2);
  });

  it('sorts the options by delay', () => {
    const [now, plus1] = delays(10, 4);
    expect(recommendDelay([plus1, now])!.recommended).toBe(plus1);
  });

  it('has no recommendation without a "now" option', () => {
    expect(recommendDelay([])).toBeUndefined();
    expect(recommendDelay(delays(10, 4).slice(1))).toBeUndefined();
  });
});
