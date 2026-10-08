import { StartDelayDto } from '../shared/models/price.model';

/** Saving needed to wait one hour, cents */
export const MIN_SAVING_CENTS = 5;
/** Extra saving needed for each further hour of waiting, cents */
export const EXTRA_HOUR_CENTS = 2;

/** Rounds to 0,1 cents, the precision the page shows */
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Saving over starting now that makes a delay worth waiting for, cents */
export function requiredSaving(delayHours: number): number {
  return delayHours === 0 ? 0 : MIN_SAVING_CENTS + EXTRA_HOUR_CENTS * (delayHours - 1);
}

export interface LaundryRecommendation {
  recommended: StartDelayDto;
  cheapest: StartDelayDto;
  /** cost(Nyt) − cost(recommended), cents */
  saving: number;
  /** cost(recommended) − cost(cheapest), cents; 0 when they are the same option */
  extraSavingIfWaitLonger: number;
  /** Hours the options cover, normally 5 */
  hours: number;
}

/**
 * The start delay worth waiting for: the delay whose saving over starting now
 * exceeds its required saving the most, ties to the shorter delay. Starts now
 * when no delay saves enough. Undefined without a "now" option.
 */
export function recommendDelay(delays: StartDelayDto[]): LaundryRecommendation | undefined {
  const sorted = [...delays].sort((a, b) => a.delayHours - b.delayHours);
  const now = sorted.find((delay) => delay.delayHours === 0);
  if (!now) return undefined;

  const cost = (delay: StartDelayDto) => round1(delay.costCents);
  let recommended = now;
  let bestNet = -Infinity;

  for (const delay of sorted) {
    if (delay.delayHours === 0) continue;
    const net = round1(cost(now) - cost(delay) - requiredSaving(delay.delayHours));
    if (net >= 0 && net > bestNet) {
      recommended = delay;
      bestNet = net;
    }
  }

  const cheapest = sorted.reduce((min, delay) => (cost(delay) < cost(min) ? delay : min), sorted[0]);

  return {
    recommended,
    cheapest,
    saving: round1(cost(now) - cost(recommended)),
    extraSavingIfWaitLonger: round1(cost(recommended) - cost(cheapest)),
    hours: sorted[sorted.length - 1].delayHours,
  };
}

/** The rule in one sentence, for the tooltip of the recommended option */
export const RULE_TEXT =
  `Odottaminen kannattaa vasta, kun säästö on vähintään ${MIN_SAVING_CENTS} senttiä. ` +
  `Jokainen lisätunti vaatii ${EXTRA_HOUR_CENTS} senttiä enemmän säästöä.`;
