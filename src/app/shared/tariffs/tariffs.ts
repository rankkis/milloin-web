import { formatNumber, formatPrice } from '../format/format';

/**
 * Per-kWh charges paid on top of the spot price, in c/kWh including VAT 25,5 %.
 * Typical Finnish values for a household on a spot contract, autumn 2026.
 * Monthly fees are left out: they do not depend on when or how much electricity is used.
 */
export const TARIFFS = {
  /**
   * Distribution energy fee (siirtomaksu) of a general (yleissähkö) tariff: 3,51 c/kWh is the
   * average of 17 network companies, checked 7.5.2026 (halpasahko.com/sahkonsiirto);
   * selectra.fi/sahkon-hinta/siirtohinta gives about 4 c/kWh
   */
  transfer: 3.5,
  /** Electricity tax class I with the security of supply fee, 2,325 c/kWh + VAT from 1.4.2026 (vero.fi) */
  tax: 2.92,
  /** Retailer's spot margin: most spot contracts charge 0,3–0,6 c/kWh (sahkovertaaja.fi/halvin-porssisahko) */
  margin: 0.5,
} as const;

/** All per-kWh charges on top of the spot price, c/kWh */
export const TARIFF_CENTS_PER_KWH =
  TARIFFS.transfer + TARIFFS.tax + TARIFFS.margin;

/** Total cost in cents: the spot-priced energy plus the per-kWh charges */
export function totalCents(energyCents: number, kwh: number): number {
  return energyCents + kwh * TARIFF_CENTS_PER_KWH;
}

/** Cents as euros with two decimals, e.g. 1,15 € */
export const formatEuros = (cents: number): string =>
  `${formatNumber(cents / 100, 2)} €`;

/** Kilowatt-hours with a decimal only when needed, e.g. 1,5 or 8 */
export const formatKwh = (kwh: number): string =>
  formatNumber(kwh, kwh % 1 ? 1 : 0);

/**
 * How a total is calculated, e.g.
 * "Hinta = 1,5 kWh × (spot 8,20 + siirto 3,50 + sähkövero 2,92 + marginaali 0,50 c/kWh) = 22,7 snt."
 */
export function costFormula(
  energyCents: number,
  kwh: number,
  unit: 'snt' | '€',
): string {
  const spot = kwh > 0 ? energyCents / kwh : 0;
  const total = totalCents(energyCents, kwh);
  const result =
    unit === '€' ? formatEuros(total) : `${formatNumber(total, 1)} snt`;
  return (
    `Hinta = ${formatKwh(kwh)} kWh × (spot ${formatPrice(spot)} + siirto ${formatPrice(TARIFFS.transfer)} + ` +
    `sähkövero ${formatPrice(TARIFFS.tax)} + marginaali ${formatPrice(TARIFFS.margin)} c/kWh) = ${result}.`
  );
}

/** Where the per-kWh charges come from, shown under the formula */
export const TARIFF_NOTE =
  'Siirto ja marginaali ovat tyypillisiä arvoja. Hinnat sis. alv 25,5 %, kuukausimaksut eivät sisälly.';
