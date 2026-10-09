import { TARIFF_CENTS_PER_KWH, costFormula, totalCents } from './tariffs';

describe('tariffs', () => {
  it('adds transfer, tax and margin per kWh to the energy cost', () => {
    expect(TARIFF_CENTS_PER_KWH).toBeCloseTo(6.92, 10);
    expect(totalCents(10, 1.5)).toBeCloseTo(20.38, 10);
    expect(totalCents(0, 0)).toBe(0);
  });

  it('shows the formula in cents', () => {
    expect(costFormula(10, 2, 'snt')).toBe(
      'Hinta = 2 kWh × (spot 5,00 + siirto 3,50 + sähkövero 2,92 + marginaali 0,50 c/kWh) = 23,8 snt.',
    );
  });

  it('shows the formula in euros', () => {
    expect(costFormula(440, 44, '€')).toBe(
      'Hinta = 44 kWh × (spot 10,00 + siirto 3,50 + sähkövero 2,92 + marginaali 0,50 c/kWh) = 7,44 €.',
    );
  });
});
