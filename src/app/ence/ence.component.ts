import { Component, computed, inject } from '@angular/core';
import { AnswerHeaderComponent } from '../shared/answer-header/answer-header.component';
import { formatClock, formatDate, formatNumber } from '../shared/format/format';
import { IconComponent } from '../shared/icon/icon.component';
import { resourceErrorMessage } from '../shared/resource-error';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { EnceAnswers, hasStarted, matchDay, matchValue, matchWhen, timeUntil } from './ence-answer';
import { EnceStreamDto, EnceTeamDto } from './ence.model';
import { EnceService } from './ence.service';

/** ENCE's page on HLTV.org, for visitors; the data comes from elsewhere */
export const HLTV_TEAM_URL = 'https://www.hltv.org/team/4869/ence';

const LANGUAGES: Record<string, string> = { fi: 'suomi', en: 'englanti' };

/** Milloin Ence pelaa? The next match, its streams, the next matches and news */
@Component({
  selector: 'app-ence',
  imports: [AnswerHeaderComponent, IconComponent, SpinnerComponent],
  providers: [EnceAnswers],
  templateUrl: './ence.component.html',
  styleUrl: './ence.component.scss',
})
export class EnceComponent {
  private readonly answers = inject(EnceAnswers);
  private readonly enceService = inject(EnceService);

  readonly hltvUrl = HLTV_TEAM_URL;
  readonly ence = this.answers.ence;
  readonly data = this.answers.data;
  readonly match = computed(() => this.data()?.nextMatch);

  readonly started = computed(() => {
    const match = this.match();
    return !!match && hasStarted(match, this.answers.now());
  });

  /** The answer, e.g. "la 18:30", "Nyt" or "Ei tiedossa" */
  readonly value = computed(() => {
    const match = this.match();
    return match ? matchValue(match, this.answers.now()) : 'Ei tiedossa';
  });

  /** Under the opponents: when it starts or started */
  readonly when = computed(() => {
    const match = this.match();
    const now = this.answers.now();
    if (!match) return 'Seuraavaa ottelua ei ole vielä julkaistu.';
    if (this.started()) return `alkoi ${formatClock(match.startTime)}`;
    return `${matchDay(match.startTime, now)} · alkaa ${timeUntil(match.startTime, now)} päästä`;
  });

  readonly streams = computed(() =>
    (this.match()?.streams ?? []).map((stream) => ({
      ...stream,
      meta: `${stream.platform} · ${LANGUAGES[stream.language] ?? stream.language}`,
      viewersText: stream.viewers !== undefined ? formatNumber(stream.viewers, 0) : '',
    })),
  );
  readonly hasViewers = computed(() => this.streams().some((stream) => stream.viewersText));

  readonly upcoming = computed(() =>
    (this.data()?.upcoming ?? []).map((match) => ({ ...match, when: matchWhen(match.startTime) })),
  );

  readonly results = computed(() =>
    (this.data()?.results ?? []).map((result) => ({
      ...result,
      when: formatDate(new Date(result.startTime)),
      score: `${result.teamScore}–${result.opponentScore}`,
      won: result.teamScore > result.opponentScore,
    })),
  );

  readonly news = computed(() =>
    (this.data()?.news ?? []).map((item) => ({ ...item, when: formatDate(new Date(item.publishedAt)) })),
  );

  readonly updated = computed(() => {
    const data = this.data();
    return data && `${data.source}, päivitetty klo ${formatClock(data.updatedAt)}`;
  });

  readonly matchTime = computed(() => {
    const match = this.match();
    return match ? matchWhen(match.startTime) : '';
  });

  logo(team: EnceTeamDto): string | undefined {
    return team.logo && this.enceService.logoUrl(team.logo);
  }

  trackStream(stream: EnceStreamDto): string {
    return stream.url;
  }

  reload(): void {
    this.answers.reload();
  }

  readonly errorMessage = resourceErrorMessage;
}
