import { Component, input } from '@angular/core';

/** A code sample. The code is text, so templates such as Home Assistant's {{ }} stay as written. */
@Component({
  selector: 'app-code-block',
  template: `
    @if (title()) {
      <p class="title">{{ title() }}</p>
    }
    <pre class="code"><code>{{ code() }}</code></pre>
  `,
  styles: `
    @use 'colors' as *;

    :host {
      display: block;
      margin: 0 0 var(--space-4);
    }

    .title {
      margin: 0 0 var(--space-1);
      font-size: var(--text-label-size);
      letter-spacing: var(--text-label-tracking);
      text-transform: uppercase;
      color: color(text-muted);
    }

    .code {
      margin: 0;
      padding: var(--space-3) var(--space-4);
      overflow-x: auto;
      background: color(surface);
      border: 1px solid color(border);
      border-radius: var(--radius);
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.5;
    }
  `,
})
export class CodeBlockComponent {
  readonly code = input.required<string>();
  readonly title = input<string>();
}
