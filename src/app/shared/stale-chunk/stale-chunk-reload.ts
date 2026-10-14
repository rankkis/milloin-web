import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { NavigationError } from '@angular/router';

/** Where the last reload is kept, so a page that keeps failing is not reloaded again */
export const STALE_CHUNK_RELOAD_KEY = 'milloin-stale-chunk-reload';

/** A page that failed to load its code again this soon after a reload is not reloaded again */
const RELOAD_GUARD_MS = 30_000;

/**
 * Whether the error is a lazy-loaded chunk that could not be loaded. After a
 * deploy, a page loaded from the previous build asks for that build's chunks,
 * which are gone. Chrome, Firefox and Safari word it differently.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|error loading module script/i.test(message);
}

/**
 * Loads the page at `url` from the server, which serves the current build.
 * Not when the same page was just reloaded this way, so a chunk that is really
 * missing can't reload the page over and over. Returns whether it reloads.
 */
export function reloadForNewBuild(win: Window, url: string, now = Date.now()): boolean {
  try {
    const last = JSON.parse(win.sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY) ?? 'null') as { url: string; at: number } | null;
    if (last?.url === url && now - last.at < RELOAD_GUARD_MS) return false;
    win.sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, JSON.stringify({ url, at: now }));
  } catch {
    // Without storage there is no guard against reloading over and over
    return false;
  }
  win.location.assign(url);
  return true;
}

/**
 * Router navigation error handler (`withNavigationErrorHandler`): when the
 * page being opened can't load its code because a new build was deployed,
 * loads that page from the server instead of leaving the visitor on a page
 * that doesn't respond. Other errors are left to the router.
 */
export function reloadOnStaleChunk(error: NavigationError): void {
  const win = inject(DOCUMENT).defaultView;
  if (!win || !isChunkLoadError(error.error)) return;
  reloadForNewBuild(win, new URL(error.url, win.location.href).href);
}
