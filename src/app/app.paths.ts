export const APP_NAVIGATION_PATHS = {
  /** The Sähkö category page: the electricity questions */
  ELECTRICITY: 'sahkoa-kannattaa-kayttaa',
  /** Price now, hourly prices and averages: "Milloin sähkö on halpaa?" */
  ELECTRICITY_PRICE: 'sahko-on-halpaa',
  WASH_LAUNDRY: 'pestaan-pyykit',
  CHARGE_EV: 'ladataan-auto',
  SAUNA: 'saunotaan',
  MONEY: 'raha-tulee-tilille',
  KELA: 'kelan-tuet-maksetaan',
  TAX_REFUND: 'veronpalautukset-tulevat',
  PENSION: 'elake-maksetaan',
  MISC: 'mitakin-tapahtuu',
  ENCE: 'ence-pelaa',
  /** Developer docs of the public API, in English */
  DOCS: 'docs',
};

/** Earlier addresses of moved pages, redirected permanently to the new ones (also in vercel.json) */
export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  'kannattaa-pesta-pyykkia': APP_NAVIGATION_PATHS.WASH_LAUNDRY,
  'kannattaa-ladata-auto': APP_NAVIGATION_PATHS.CHARGE_EV,
};

/**
 * Docs pages before the docs had categories, under /docs, redirected permanently (also in vercel.json).
 * The reference covered every category, so it goes to the category choice.
 */
export const LEGACY_DOCS_REDIRECTS: Record<string, string> = {
  'home-assistant': 'electricity/home-assistant',
  presets: 'electricity/presets',
  'custom-plans': 'electricity/custom-plans',
  reference: '',
};
