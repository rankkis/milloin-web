export const APP_NAVIGATION_PATHS = {
  ELECTRICITY: 'sahko-on-halpaa',
  WASH_LAUNDRY: 'pestaan-pyykit',
  CHARGE_EV: 'ladataan-auto',
  SAUNA: 'saunotaan',
  MONEY: 'raha-tulee-tilille',
  KELA: 'kelan-tuet-maksetaan',
  TAX_REFUND: 'veronpalautukset-tulevat',
  PENSION: 'elake-maksetaan',
  MISC: 'mitakin-tapahtuu',
  ENCE: 'ence-pelaa',
};

/** Earlier addresses of moved pages, redirected permanently to the new ones (also in vercel.json) */
export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  'kannattaa-pesta-pyykkia': APP_NAVIGATION_PATHS.WASH_LAUNDRY,
  'kannattaa-ladata-auto': APP_NAVIGATION_PATHS.CHARGE_EV,
};
