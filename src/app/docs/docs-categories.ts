/** A page of a docs category; '' is the category's overview */
export interface DocsPage {
  path: string;
  label: string;
  testId: string;
}

/** A category of the public API, as its paths group them (/v1/electricity, /v1/misc) */
export interface DocsCategory {
  path: string;
  label: string;
  summary: string;
  /** Prefix of the category's API paths; its API reference shows only these */
  apiPrefix: string;
  pages: DocsPage[];
}

const page = (category: string, path: string, label: string): DocsPage => ({
  path,
  label,
  testId: `docs-nav-${category}-${path || 'overview'}`,
});

/** The categories of the developer docs, in the order the menu lists them */
export const DOCS_CATEGORIES: DocsCategory[] = [
  {
    path: 'electricity',
    label: 'Electricity',
    summary:
      'Finnish spot prices and the cheapest times to run a load: a washing machine, a sauna, an EV charger or a water heater.',
    apiPrefix: '/v1/electricity',
    pages: [
      page('electricity', '', 'Overview'),
      page('electricity', 'home-assistant', 'Home Assistant'),
      page('electricity', 'presets', 'Presets'),
      page('electricity', 'custom-plans', 'Custom plans'),
      page('electricity', 'reference', 'API reference'),
    ],
  },
  {
    path: 'misc',
    label: 'Miscellaneous',
    summary: 'Everything else milloin.xyz answers, such as when ENCE, the Finnish CS2 team, plays next.',
    apiPrefix: '/v1/misc',
    pages: [page('misc', '', 'Overview'), page('misc', 'reference', 'API reference')],
  },
];

export const docsCategory = (path: string | undefined): DocsCategory | undefined =>
  DOCS_CATEGORIES.find(category => category.path === path);

/** Link to a page of a category */
export const docsLink = (category: DocsCategory, page: DocsPage): string =>
  `/docs/${category.path}${page.path ? '/' + page.path : ''}`;
