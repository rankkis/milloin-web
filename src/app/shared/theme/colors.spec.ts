import { color } from './colors';

describe('color', () => {
  const root = document.documentElement;

  beforeEach(() => root.style.setProperty('--color-accent', '#2ee06f'));
  afterEach(() => root.style.removeProperty('--color-accent'));

  it('reads a palette color from its CSS custom property', () => {
    expect(color('accent')).toBe('rgb(46, 224, 111)');
  });

  it('applies opacity', () => {
    expect(color('accent', 0.2)).toBe('rgba(46, 224, 111, 0.2)');
  });
});
