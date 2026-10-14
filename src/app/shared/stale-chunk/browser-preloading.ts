import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable, catchError, of } from 'rxjs';

/**
 * Loads every page's code in the browser once the first page is shown, so
 * moving around keeps working with the build the visitor loaded even after a
 * deploy removes its chunks. The pages' chunks are small. The server renders
 * one page per request and loads nothing ahead.
 */
@Injectable({ providedIn: 'root' })
export class BrowserPreloading implements PreloadingStrategy {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  preload(_route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // A chunk that fails to load here is loaded again when its page is opened
    return this.browser ? load().pipe(catchError(() => of(null))) : EMPTY;
  }
}
