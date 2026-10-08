import { PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { isPlatformServer } from '@angular/common';

const RENDER_TIME = makeStateKey<number>('renderTime');

/**
 * The time a page is first drawn at. On the server it is now, and it is
 * handed to the browser, which uses the same time while it takes over the
 * server-rendered page; otherwise a page cached on the CDN could hydrate
 * into different content (e.g. an hour that has since ended). Later pages
 * in the browser get the actual time. Components set the real time after
 * the first render.
 */
export function initialNow(): Date {
  const state = inject(TransferState);
  if (isPlatformServer(inject(PLATFORM_ID))) {
    if (!state.hasKey(RENDER_TIME)) state.set(RENDER_TIME, Date.now());
    return new Date(state.get(RENDER_TIME, Date.now()));
  }
  const renderTime = state.get(RENDER_TIME, null);
  state.remove(RENDER_TIME);
  return new Date(renderTime ?? Date.now());
}
