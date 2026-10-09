# Milloin Web - Angular Project

## Project Overview
Angular web application for the Milloin project. Milloin translates to When in english. The site answers everyday "when" questions ("Milloin saunotaan?"), grouped into categories. The home page lists every question with its answer, grouped by category. The Sähkö category page shows the current spot price, hourly prices from now to the last published hour, the average price of the next 6, 12 and 24 hours, and the electricity questions (when to wash laundry, charge the EV, heat the sauna). Those answers come from the milloin-server backend, which calculates them from day-ahead spot prices (ENTSO-E).

Goal for the site is saving money by running high-consumption tasks during optimal time windows.

## Technology Stack
- **Angular**: 22
- **Angular CLI**: 22
- **Node.js**: 24 (see `.nvmrc`; Angular 22 needs 22.22.3+ or 24.15+)
- **Package Manager**: npm
- **TypeScript**: 6.0
- **Styling**: SCSS
- **Routing**: Enabled
- **Testing**: Jasmine + Karma
- **Linting**: ESLint (angular-eslint)

## Dependencies
- **Core**: @angular/core, @angular/common, @angular/router
- **Forms**: @angular/forms
- **HTTP**: @angular/common/http (add when needed)
- **Testing**: jasmine-core, karma, karma-chrome-launcher
- **Deployment**: angular-cli-ghpages (GitHub Pages deployment)

## Development Commands

### Setup
```bash
npm install          # Install dependencies
```

### Development
```bash
npm start           # Start development server (same as ng serve)
ng serve            # Start development server (http://localhost:4200)
ng serve --open     # Start dev server and open browser
ng serve --port 4201 # Start on custom port
```

### Building
```bash
npm run build       # Build for production (same as ng build)
ng build            # Build for production
npm run watch       # Build and watch for changes
```

### Testing
```bash
npm test            # Run unit tests (same as ng test)
ng test             # Run unit tests with Karma
npm run test:ci      # Run tests once in headless Chrome (also works as root in containers)
```

### Code Quality
```bash
npm run lint        # Run ESLint (same as ng lint)
```

### CI
`.github/workflows/ci.yml` runs lint, tests and build on every pull request.

### Server-side rendering
Every page is rendered on the server (Angular SSR, `outputMode: server`) so search engines and the first paint get the prices and answers in the HTML.
- `src/server.ts` is the Express server, `src/app/app.config.server.ts` and `src/app/app.routes.server.ts` the server config and routes (render mode, 404 status, CDN `Cache-Control`: `s-maxage=60, stale-while-revalidate=600`).
- The browser hydrates the page and reuses the server's API responses (HTTP transfer cache), so it does not fetch them again on first load.
- Browser-only code (timers, `document`) goes in `afterNextRender`. Components take their first `now` from `initialNow()` (`shared/render-time.ts`), which hands the server's render time to the browser so hydration draws the same content.
- On the server the API services don't retry (`API_RETRY_COUNT`), and a failed API call marks the page `no-store` so the error page is not cached.
- Server renders send `x-milloin-ssr-key` from the `SSR_API_KEY` environment variable (set in both Vercel projects) so the API's per-IP rate limit doesn't count them; the key is read only on the server.
- Hosts allowed to render are listed in `security.allowedHosts` in `angular.json`.
- Run the production server locally: `npm run build && npm run serve:ssr:milloin-web-app` (http://localhost:4000).

### Deployment to milloin.xyz
Vercel builds and deploys `master` to production on every merge, and every pull request gets a preview deployment. `vercel.json` sends every non-file path to the `api/ssr.mjs` function, which runs the Angular server (region `arn1`, Stockholm); static files are served from `dist/milloin-web-app/browser` by the CDN. The Vercel build deletes `browser/index.csr.html`, because Vercel would serve it as the static home page instead of the server render (the server bundle has its own copy).

Legacy GitHub Pages deployment (fallback until it is turned off):
```bash
npm run domain-build    # Build for production with correct base-href
npm run domain-deploy   # Deploy to milloin.xyz (creates gh-pages branch with CNAME)
```

**Production URL:** https://milloin.xyz/

**Deployment Workflow:**
1. Build for domain: `npm run domain-build`
2. Deploy to domain: `npm run domain-deploy`
3. Site will be available at https://milloin.xyz/

**Important Notes:**
- Deployment creates/updates `gh-pages` branch automatically with CNAME file
- Base href is set to `/` for root domain
- **Angular Build Structure:** Files are built to `dist/milloin-web-app/browser/` (note the `/browser` subdirectory)
- Deployment script correctly uses `--dir=dist/milloin-web-app/browser` for proper file structure
- CNAME file is automatically created pointing to milloin.xyz
- First deployment may take a few minutes to become available

**Troubleshooting:**
- If favicon or assets don't load, ensure deployment uses the correct `/browser` directory
- CSP errors may occur if assets are deployed to wrong directory level

### Code Generation
```bash
ng generate component <name>     # Generate component
ng generate service <name>       # Generate service
ng generate module <name>        # Generate module
ng generate directive <name>     # Generate directive
ng generate pipe <name>          # Generate pipe
```

## Project Structure
```
src/
├── app/                           # Application source code
│   ├── home/                     # Home: every question grouped by category, category filter
│   ├── electricity/              # Sähkö category page (/sahko-on-halpaa): current price, price chart, trend tiles, questions
│   │                             # (electricity-answers.ts: price and answers shared with home)
│   ├── wash-laundry/             # When to wash laundry
│   ├── charge-ev/                # When to charge the EV
│   ├── sauna/                    # When to heat the sauna (milloin saunotaan)
│   ├── money/                    # Raha category page (/raha-tulee-tilille) and its question pages (payment-day/)
│   │                             # (banking-days.ts: Finnish banking days; payment-days.ts: published payment rules and dates)
│   ├── misc/                     # Sekalaista category page (/mitakin-tapahtuu)
│   ├── ence/                     # Milloin Ence pelaa? (/ence-pelaa); ence-answer.ts: answers shared with home and Sekalaista
│   ├── not-found/                # Page for unknown addresses (noindex)
│   ├── shared/
│   │   ├── answer-header/        # Back link, current price and refresh on question pages
│   │   │                         # (shared question page styles: src/styles/_answer-page.scss)
│   │   ├── format/               # Finnish number, clock and duration formatting
│   │   ├── hourly-chart/         # Hourly price bars from now: gridlines, +6/+12/+24 h markers, tooltip
│   │   ├── icon/                 # Inline SVG icons
│   │   ├── models/               # API DTOs
│   │   ├── seo/                  # Per-page title, description, canonical and Open Graph tags
│   │   ├── services/             # API services
│   │   ├── spinner/              # Loading spinner shown until prices arrive
│   │   └── trend-tiles/          # Average of the next 6, 12 and 24 hours vs. now
│   ├── app.component.*           # Root component (router outlet)
│   ├── app.config.ts             # Application configuration
│   ├── app.config.server.ts      # Server-side rendering configuration
│   ├── app.routes.server.ts      # Server render mode, status and cache headers per route
│   ├── app.paths.ts              # Route paths and redirects from earlier paths
│   ├── topics.ts                 # Categories and their questions (title, path, icon), listed on home; add new paths to sitemap.xml too
│   └── app.routes.ts             # Application routing
├── environments/                 # Environment configurations
├── styles/_colors.scss           # The only place colors are defined
└── styles.scss                   # Global styles and design tokens
```

## Features

- **Questions and URLs**: every question is a short "Milloin …?" sentence, preferably passive ("Milloin saunotaan?", "Milloin pestään pyykit?"), shown whole everywhere. Its URL finishes the sentence after the domain: drop "Milloin" and "?", lower case, ä/ö → a/o, spaces → hyphens, directly under the domain with no category (`/saunotaan`, `/pestaan-pyykit`, `/ladataan-auto`). A category page reads as a question too (Sähkö: `/sahko-on-halpaa`). Moved pages keep a permanent redirect in both `vercel.json` and `LEGACY_PATH_REDIRECTS` (`app.paths.ts`). New questions and categories go in `topics.ts`. Plan for future categories (Raha, Taivas, Vapaa): the "milloin.xyz: topics, URLs and home" doc.
- **Home**: header, a category filter (shown once there are two or more categories), then one table of questions grouped by category. Each group heading links to its category page (the Sähkö heading also shows the current price); each row links to its question page and shows the answer (phone: answer with a short line; 960 px+: Kysymys | Vastaus | Tarkemmin). Data loads on open and again when the tab returns after 15 minutes.
- **Sähkö page** (`/sahko-on-halpaa`): "Takaisin" link to home, the title "Sähkö", the current price and its category (from the backend) in a box colored by the category (`price-*` colors), hourly price bars from the current hour to the last published price (scale up to the highest price but at least 10 c/kWh, gridlines every 10 c/kWh, dashed +6/+12/+24 h markers, tooltip on hover or tap), trend tiles with the average of the next 6, 12 and 24 hours vs. now, and one row per electricity question with its answer. On wide screens an invisible slot under the price is reserved for an ad or price analysis.
- **Question pages**: the header's Takaisin returns to the page the visitor came from (home or a category page); a page opened directly (or the server render) shows Koti, linking to home (`shared/answer-header`). Laundry recommends a timer delay (Nyt, +1 … +5 h) from the cost of each (2 h program, 1,5 kWh, costed by the backend); waiting must save at least 5 snt for +1 h and 2 snt more for each further hour (`wash-laundry/laundry-recommendation.ts`), so the recommendation is not always the cheapest option (the backend's `isBest`); EV charging answers with the cheapest 4-hour clock-time window, a chart of the next 24 hours and a comparison with charging now. Sauna (`/saunotaan`) answers with when the sauna is warm (heater start + 1 h) for the recommended full-hour heater start of a 3-hour, 8 kWh session (backend preset `sauna`): the cheapest, except that in the evening a start warm at 19–21 (the usual sauna time) wins unless another start is at least 10 snt and 10 % cheaper (`recommendStart`), and the chart marks the cheapest with a dashed border, and tells when to start heating; the visitor picks Tänään/Huomenna and Päivä (heater on 6–16) / Ilta (17–21, default) / Ei väliä (6–23, no night starts 00–05), choices without prices are disabled; until the visitor picks a day, tomorrow is shown once today's evening is over, with a button for the cheapest start still left tonight; the page fits a phone screen without scrolling; starts whose prices are not published yet are dashed bars with a note, and a button suggests the other day when it is at least 1 snt cheaper (`sauna/sauna-plan.ts`).
- **Raha** (`/raha-tulee-tilille`): "Takaisin" link, the title "Raha" and one row per money question with its next payment day. The answers are calculated in the browser and on the server from rules and dates the payers publish, with no API: Kela benefits (`/kelan-tuet-maksetaan`, kela.fi/maksupaivat), tax refunds (`/veronpalautukset-tulevat`, vero.fi; `TAX_REFUND_DAYS` lists the year's published dates and must be updated when Vero publishes the next year's, by spring) and pensions (`/elake-maksetaan`, työeläke on the 1st banking day at most providers, Kela pensions on their days). A day banks are closed moves to the banking day before or after it, as each payer's rule says (`money/payment-days.ts`); banking days skip weekends and Finnish bank holidays, Easter-based ones calculated (`money/banking-days.ts`). Each question page lists every payment with its rule and next date, and links its source. Palkka is not answered: paydays depend on each employment contract.
- **Sekalaista** (`/mitakin-tapahtuu`, "Milloin mitäkin tapahtuu?"): "Takaisin" link, the title "Sekalaista" and one row per question. **Milloin Ence pelaa?** (`/ence-pelaa`) answers with ENCE's (Finnish CS2 team) next match from the backend's `GET /ence` (PandaScore, refreshed hourly): the start ("la 18:30", "Nyt" with a LIVE tag once started, "Ei tiedossa" when none is scheduled), a match card with both teams' logos (copies served by the backend; a shield when missing) and a link to ENCE on HLTV.org, the top 5 Finnish and English streams (each opens in a new tab), the next matches (or the latest results when none is scheduled) and the latest news (Google News). No live scores: the data can be an hour old. HLTV.org is only linked: Cloudflare blocks scripted requests to it. On wide screens the streams are a second column.
- **Costs** of laundry, sauna and EV charging (question pages and home) are totals: the spot-priced energy plus typical per-kWh charges from `shared/tariffs/tariffs.ts` (transfer 3,50, sähkövero 2,92 and retailer margin 0,50 c/kWh, all incl. VAT 25,5 %; monthly fees left out, sources in the file). Sauna and EV totals are in euros, laundry in cents; differences between starts stay in cents. The laundry and sauna bars scale to the spot energy cost only, since the charges are the same for every start; the numbers are totals. Each question page shows the formula at the bottom, under the calculation basis (`costFormula`). Recommendation rules still compare the backend's spot energy costs; a flat per-kWh charge doesn't change which start is cheapest.
- Clock times are shown in Finnish time (`shared/format/format.ts`).

### UI
- No UI component library. Plain HTML and SCSS with design tokens as CSS custom properties in `src/styles.scss` (fonts, radius, spacing, tap size) and colors in `src/styles/_colors.scss`.
- **Look**: dark background, one green accent (`accent`), IBM Plex Sans for text and IBM Plex Mono for prices and times.
- **Fonts**: self-hosted latin subsets from `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono`, listed in `styles` in `angular.json`; no Google Fonts.
- **Icons**: inline SVG through `IconComponent` (`shared/icon`); no icon fonts, no emoji.
- **Layout**: mobile first; home and the Sähkö page show their questions as a table from 960 px, and the Sähkö page puts price and chart side by side from 768 px. Question pages are a single column up to 560 px.

## Development Workflow
1. Create feature branch from main
2. Implement changes
3. Run tests: `npm run test:ci`
4. Run linting: `npm run lint`
5. Build: `ng build`
6. Commit and push changes
7. Create pull request

## SEO & Analytics

### Google Analytics
- **Tracking ID**: G-4J2DJ7V1SE
- Google Analytics script is in `src/index.html` (lines 4-11)
- Tracks page views and user behavior automatically

### SEO Meta Tags
Each route in `app.routes.ts` has its own `title` and `data.description`; `SeoTitleStrategy` (`shared/seo`) sets the title, description, canonical URL and `og:`/`twitter:` title, description and URL on every navigation. The tags in `src/index.html` are the home page's and the defaults:
- **Title**: "Milloin… – Vastaukset arjen milloin-kysymyksiin"
- **Description**: Optimized for search engines with relevant keywords
- **Keywords**: electricity price, spot price, cheapest hour, EV charging, laundry, energy savings (in Finnish)
- **Open Graph Tags**: For social media sharing (Facebook, LinkedIn); image `public/og-image.png` (1200x630, rendered from `src/og-image.svg`; when the image changes, bump the `?v=` in its `og:image`, `twitter:image` and JSON-LD URLs in `src/index.html`, because WhatsApp and others cache previews by URL)
- **Twitter Card Tags**: For Twitter/X sharing

**Important**: When adding new features or pages:
1. Give the route a `title` and `data.description`, and update the home meta description in `src/index.html` if the site's content changes
2. Add new routes to `src/sitemap.xml`
3. Keep heading hierarchy coherent (h1 → h2 → h3 → h4)
4. Update sitemap lastmod date when making significant changes

### Sitemap
- Located at `src/sitemap.xml`
- Automatically included in builds via `angular.json`
- Available at https://milloin.xyz/sitemap.xml
- Update when adding/removing routes

### Heading Hierarchy
Maintain proper heading structure for SEO:
- **h1**: Page title, one per page (home: "Milloin…", question pages: the question)
- **h2-h6**: Section headings in components
- Never skip heading levels (e.g., h1 → h3)
- Use semantic HTML elements

### Robots.txt
- Located at `public/robots.txt`
- Automatically included in builds
- Available at https://milloin.xyz/robots.txt
- Controls search engine crawling behavior
- Points to sitemap location

### Structured Data (JSON-LD)
Rich snippets and search result enhancements via Schema.org structured data:
- **Location**: `src/index.html` (`<script type="application/ld+json">`)
- **Type**: WebApplication schema
- **Purpose**: Helps search engines understand the app and display rich results
- **Features Listed**: spot price now, hourly prices from now on, average of the next 6, 12 and 24 hours, laundry timer and cost, EV cheapest charging time and cost

**When to Update**:
- Adding new features → update `featureList` array
- Changing app description → update `description` field
- Major updates → update `dateModified` and `softwareVersion`
- Company/creator changes → update `creator` object

**Testing Structured Data**:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/

## Important Notes
- This is an Angular 22 project; components default to OnPush change detection and the app is zoneless (`provideZonelessChangeDetection`, no zone.js in the build; tests still load zone.js for `fakeAsync`)
- Uses SCSS for styling
- Colors are defined only in `src/styles/_colors.scss`. In SCSS, `@use 'colors' as *` and use `color(accent)` or `alpha(accent, 10%)`, or the `--color-*` custom properties; never hex or rgba values.
- Routing is enabled
- Follow Angular style guide for code conventions
- Every "a" and "buttton" elements should have a data-test-id attribute in order to help e2e tests
- Use inject from angular/core for dependency injection instead of legacy constructor way
- Backend api documentation is located here https://milloin-server.vercel.app/api-json
- **Public API**: `vercel.json` proxies `/api` to the backend's Swagger UI (https://milloin.xyz/api), `/api/openapi.json` to its OpenAPI document and `/api/<endpoint>` to its endpoints, so other developers can use `https://milloin.xyz/api/...`. These rewrites must stay above the `/(.*)` catch-all that sends pages to the SSR function (`/api/ssr` itself is a function, which Vercel serves before any rewrite). The home footer links to it.