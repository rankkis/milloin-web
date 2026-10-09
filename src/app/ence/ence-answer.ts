import { DestroyRef, Injectable, afterNextRender, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Answer } from '../electricity/electricity-answers';
import { dayOffset, formatClock, formatDate, formatWeekday } from '../shared/format/format';
import { initialNow } from '../shared/render-time';
import { EnceDto, EnceMatchDto } from './ence.model';
import { EnceService } from './ence.service';

const MINUTE_MS = 60 * 1000;
/** Reload when the page comes back into view with older data than this */
const STALE_AFTER_MS = 15 * MINUTE_MS;

/** Running, or past its start time: the data can be an hour old */
export function hasStarted(match: EnceMatchDto, now: Date): boolean {
  return match.live || Date.parse(match.startTime) <= now.getTime();
}

/** tänään, huomenna, ylihuomenna or "5 päivän päästä" */
export function matchDay(start: string, now: Date): string {
  const days = dayOffset(start, now);
  if (days <= 0) return 'tänään';
  if (days === 1) return 'huomenna';
  if (days === 2) return 'ylihuomenna';
  return `${days} päivän päästä`;
}

/** The answer itself: Nyt, 18:30 today, la 18:30 within a week, la 17.10. later */
export function matchValue(match: EnceMatchDto, now: Date): string {
  if (hasStarted(match, now)) return 'Nyt';
  const days = dayOffset(match.startTime, now);
  if (days === 0) return formatClock(match.startTime);
  if (days < 7) return `${formatWeekday(match.startTime)} ${formatClock(match.startTime)}`;
  return formatDate(new Date(match.startTime));
}

/** Date and time, e.g. la 10.10. 18:30 */
export function matchWhen(start: string): string {
  return `${formatDate(new Date(start))} ${formatClock(start)}`;
}

/** Time until the start, e.g. 1 pv 4 h 40 min */
export function timeUntil(start: string, now: Date): string {
  const minutes = Math.max(1, Math.ceil((Date.parse(start) - now.getTime()) / MINUTE_MS));
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const rest = minutes % 60;
  return [days && `${days} pv`, hours && `${hours} h`, rest && `${rest} min`].filter(Boolean).join(' ');
}

/** Tournament and format, e.g. "CCT Europe Series 9, Bo3" */
export function matchEvent(match: EnceMatchDto): string {
  return [match.event, match.format].filter(Boolean).join(', ');
}

/** The answer shown on home and the Sekalaista page */
export function enceAnswer(ence: EnceDto, now: Date): Answer {
  const match = ence.nextMatch;
  if (!match) {
    return {
      value: 'Ei tiedossa',
      short: 'ei otteluita',
      detail: 'seuraavaa ottelua ei ole julkaistu',
      price: '',
      highlight: false,
    };
  }
  const opponent = `vs. ${match.opponent.name}`;
  const day = hasStarted(match, now) ? 'käynnissä' : matchDay(match.startTime, now);
  const event = matchEvent(match);
  return {
    value: matchValue(match, now),
    short: `${day} · ${opponent}`,
    detail: event ? `${day} ${opponent} · ${event}` : `${day} ${opponent}`,
    price: '',
    highlight: true,
  };
}

/**
 * ENCE's matches from the API and the answer they give. Provide it in the
 * component that shows them: it keeps the clock running and reloads when the
 * tab comes back after a while.
 */
@Injectable()
export class EnceAnswers {
  private readonly enceService = inject(EnceService);

  readonly now = signal(initialNow());
  readonly ence = rxResource({ stream: () => this.enceService.getEnce() });

  private loadedAt = Date.now();

  readonly data = computed(() => (this.ence.hasValue() ? this.ence.value() : undefined));
  readonly answer = computed(() => {
    const data = this.data();
    return data && enceAnswer(data, this.now());
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.now.set(new Date());
      const tick = setInterval(() => this.now.set(new Date()), 30 * 1000);
      destroyRef.onDestroy(() => clearInterval(tick));

      const onVisible = () => {
        if (document.visibilityState === 'visible' && Date.now() - this.loadedAt > STALE_AFTER_MS) {
          this.reload();
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
    });
  }

  reload(): void {
    this.loadedAt = Date.now();
    this.now.set(new Date());
    this.ence.reload();
  }
}
