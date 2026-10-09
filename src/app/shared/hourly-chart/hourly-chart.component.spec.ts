import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HourlyChartComponent } from './hourly-chart.component';
import { HourlyPriceDto } from '../models/price.model';

const NOW = new Date('2026-10-09T09:15:00Z');

const hours = (...prices: number[]): HourlyPriceDto[] =>
  prices.map((priceAvg, index) => ({
    startTime: new Date(Date.UTC(2026, 9, 9, 9 + index)).toISOString(),
    endTime: new Date(Date.UTC(2026, 9, 9, 10 + index)).toISOString(),
    priceAvg,
    priceCategory: 'NORMAL',
  }));

describe('HourlyChartComponent', () => {
  let fixture: ComponentFixture<HourlyChartComponent>;

  const render = (prices: number[]) => {
    fixture.componentRef.setInput('hours', hours(...prices));
    fixture.componentRef.setInput('now', NOW);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HourlyChartComponent] });
    fixture = TestBed.createComponent(HourlyChartComponent);
  });

  it('scales low prices against 10 c/kWh', () => {
    const chart = render([2, 5, 1]);
    expect(chart.bars().map((bar) => bar.height)).toEqual([20, 50, 10]);
    expect(chart.gridlines().map((line) => line.value)).toEqual(['0', '10']);
    expect(chart.gridlines()[1].bottom).toBe(100);
  });

  it('scales to the highest price above 10 c/kWh', () => {
    const chart = render([5, 25, 10]);
    expect(chart.bars().map((bar) => bar.height)).toEqual([20, 100, 40]);
    expect(chart.gridlines().map((line) => line.value)).toEqual([
      '0',
      '10',
      '20',
    ]);
  });

  it('keeps free and negative hours visible', () => {
    const chart = render([0, -1, 4]);
    expect(chart.bars().map((bar) => bar.height)).toEqual([2, 2, 40]);
  });
});
