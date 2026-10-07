/**
 * Palette colors for code that cannot use CSS custom properties, such as
 * canvas charts. Values come from the --color-* properties defined in
 * src/styles/_colors.scss, so colors stay defined in one place.
 */
export type ColorName =
  | 'bg'
  | 'surface'
  | 'border'
  | 'border-strong'
  | 'bar-past'
  | 'text'
  | 'text-muted'
  | 'accent'
  | 'on-accent'
  | 'price-very-cheap'
  | 'price-expensive'
  | 'price-very-expensive';

/**
 * Returns a palette color as `rgb()` or, with an opacity below 1, `rgba()`.
 * @param name - Palette color name, matching --color-<name>
 * @param opacity - 0 to 1
 */
export function color(name: ColorName, opacity = 1): string {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim();
  const value = parseInt(hex.replace('#', ''), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return opacity < 1
    ? `rgba(${r}, ${g}, ${b}, ${opacity})`
    : `rgb(${r}, ${g}, ${b})`;
}
