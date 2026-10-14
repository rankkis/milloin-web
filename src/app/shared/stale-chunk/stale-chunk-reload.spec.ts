import { STALE_CHUNK_RELOAD_KEY, isChunkLoadError, reloadForNewBuild } from './stale-chunk-reload';

describe('stale chunk reload', () => {
  describe('isChunkLoadError', () => {
    it('recognizes how each browser reports a chunk that failed to load', () => {
      expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://milloin.xyz/chunk-A.js'))).toBeTrue();
      expect(isChunkLoadError(new TypeError('error loading dynamically imported module: https://milloin.xyz/chunk-A.js'))).toBeTrue();
      expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBeTrue();
    });

    it('ignores other errors', () => {
      expect(isChunkLoadError(new Error('Http failure response'))).toBeFalse();
      expect(isChunkLoadError(undefined)).toBeFalse();
    });
  });

  describe('reloadForNewBuild', () => {
    let storage: Map<string, string>;
    let assign: jasmine.Spy;
    let win: Window;

    beforeEach(() => {
      storage = new Map();
      assign = jasmine.createSpy('assign');
      win = {
        sessionStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => storage.set(key, value),
        },
        location: { assign },
      } as unknown as Window;
    });

    it('loads the page from the server', () => {
      expect(reloadForNewBuild(win, 'https://milloin.xyz/saunotaan', 1000)).toBeTrue();
      expect(assign).toHaveBeenCalledWith('https://milloin.xyz/saunotaan');
    });

    it('does not reload the same page again right after reloading it', () => {
      reloadForNewBuild(win, 'https://milloin.xyz/saunotaan', 1000);
      expect(reloadForNewBuild(win, 'https://milloin.xyz/saunotaan', 20_000)).toBeFalse();
      expect(assign).toHaveBeenCalledTimes(1);
    });

    it('reloads another page, or the same page later', () => {
      reloadForNewBuild(win, 'https://milloin.xyz/saunotaan', 1000);
      expect(reloadForNewBuild(win, 'https://milloin.xyz/ladataan-auto', 2000)).toBeTrue();
      expect(reloadForNewBuild(win, 'https://milloin.xyz/saunotaan', 60_000)).toBeTrue();
      expect(assign).toHaveBeenCalledTimes(3);
    });

    it('does not reload without storage for the guard', () => {
      win = {
        get sessionStorage(): Storage {
          throw new DOMException('denied', 'SecurityError');
        },
        location: { assign },
      } as unknown as Window;
      expect(reloadForNewBuild(win, 'https://milloin.xyz/saunotaan')).toBeFalse();
      expect(assign).not.toHaveBeenCalled();
      expect(storage.has(STALE_CHUNK_RELOAD_KEY)).toBeFalse();
    });
  });
});
