import { toLaundrySchedule } from './wash-laundry.service';
import { OptimalWindowsDto, StartOffsetWindowDto } from '../shared/models/price.model';

const offset = (offsetHours: number, costCents: number): StartOffsetWindowDto => ({
  offsetHours,
  startTime: `2026-10-07T1${offsetHours}:30:00.000Z`,
  endTime: '',
  priceAvg: costCents / 1.5,
  priceCategory: 'CHEAP',
  pricePoints: [],
  costCents,
});

describe('toLaundrySchedule', () => {
  it("turns the preset's start offsets into timer delays, cheapest first on a tie", () => {
    const response: OptimalWindowsDto = {
      durationHours: 2,
      energyKwh: 1.5,
      earliestStart: '',
      latestEnd: '',
      windows: [],
      startOffsets: [offset(0, 9), offset(1, 6), offset(2, 6)],
    };

    const schedule = toLaundrySchedule(response);

    expect(schedule.durationHours).toBe(2);
    expect(schedule.energyKwh).toBe(1.5);
    expect(schedule.startDelays.map((d) => [d.delayHours, d.costCents, d.isBest])).toEqual([
      [0, 9, false],
      [1, 6, true],
      [2, 6, false],
    ]);
    expect(schedule.startDelays[1].startTime).toBe('2026-10-07T11:30:00.000Z');
  });

  it('has no delays when the response has no start offsets', () => {
    const schedule = toLaundrySchedule({
      durationHours: 2,
      earliestStart: '',
      latestEnd: '',
      windows: [],
    });

    expect(schedule.startDelays).toEqual([]);
  });
});
