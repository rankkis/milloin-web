import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../code-block.component';
import { API_BASE } from './docs-samples';

const ENCE_RESPONSE = `{
  "updatedAt": "2026-10-13T05:00:00.000Z",
  "source": "PandaScore",
  "team": { "name": "ENCE", "logo": "v1/misc/ence/logos/8d41c2e07a9b3f60" },
  "nextMatch": {
    "startTime": "2026-10-14T15:30:00.000Z",
    "live": false,
    "opponent": { "name": "Sashi", "logo": "v1/misc/ence/logos/3f2a9c0d1b7e4a55" },
    "event": "CCT Europe Series 9 2026",
    "format": "Bo3",
    "streams": [
      {
        "name": "cct_cs",
        "platform": "Twitch",
        "language": "en",
        "url": "https://www.twitch.tv/cct_cs",
        "official": true,
        "viewers": 5400
      }
    ]
  },
  "upcoming": [],
  "results": [
    {
      "startTime": "2026-10-07T16:00:00.000Z",
      "opponent": { "name": "Nexus" },
      "event": "CCT Europe Series 9 2026",
      "teamScore": 2,
      "opponentScore": 1
    }
  ],
  "news": [
    {
      "title": "ENCE qualify for the playoffs",
      "source": "Dust2.us",
      "url": "https://example.com/news",
      "publishedAt": "2026-10-08T09:12:00.000Z"
    }
  ]
}`;

/** /docs/misc: the questions outside the other categories, so far when ENCE plays */
@Component({
  selector: 'app-docs-misc',
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <h1>Miscellaneous</h1>
    <p class="lead">The questions that fit no other category. Every path is under <code>/v1/misc</code>.</p>

    <h2>When does ENCE play?</h2>
    <p>
      The next Counter-Strike 2 match of ENCE, the Finnish CS2 team, with its streams, the next matches, the latest
      results and news. The site no longer shows it, but the API still serves it.
    </p>
    <app-code-block title="Request" [code]="enceRequest" />
    <app-code-block title="Response" [code]="enceResponse" />
    <ul>
      <li><code>nextMatch</code> is the running or next match, missing when none is scheduled; <code>live</code> is true once it has started. There are no live scores.</li>
      <li><code>streams</code> lists up to 5 Finnish (<code>fi</code>) and English (<code>en</code>) broadcasts, the official ones first. <code>viewers</code> is there only when the source tells it.</li>
      <li>Logos are paths relative to <code>{{ base }}/</code>: <code>{{ base }}/v1/misc/ence/logos/&#123;id&#125;</code> serves a copy of the image. A team without a logo has no <code>logo</code>.</li>
      <li>Matches come from PandaScore and news from Google News, refreshed hourly, so the data can be up to an hour old. <code>updatedAt</code> tells when it was fetched.</li>
    </ul>
    <p>Every field is in the <a routerLink="/docs/misc/reference" data-test-id="docs-misc-reference">API reference</a>.</p>
  `,
  styleUrl: '../docs-page.scss',
})
export class DocsMiscComponent {
  readonly base = API_BASE;
  readonly enceRequest = `curl ${API_BASE}/v1/misc/ence`;
  readonly enceResponse = ENCE_RESPONSE;
}
