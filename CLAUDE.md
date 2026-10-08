# Milloin Web - Angular Project

## Project Overview
Angular web application for the Milloin project. Milloin translates to When in english. The home page shows the current spot price, hourly prices from now to the last published hour, the average price of the next 6, 12 and 24 hours, and answers pre-defined questions such as when to start the washing machine or charge the EV. The answers come from the milloin-server backend, which calculates them from day-ahead spot prices (ENTSO-E).

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

### Deployment to milloin.xyz
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
│   ├── home/                     # Home: current price, price chart, trend tiles, questions
│   ├── wash-laundry/             # When to wash laundry
│   ├── charge-ev/                # When to charge the EV
│   ├── shared/
│   │   ├── answer-header/        # Back link, current price and refresh on question pages
│   │   │                         # (shared question page styles: src/styles/_answer-page.scss)
│   │   ├── format/               # Finnish number, clock and duration formatting
│   │   ├── hourly-chart/         # Hourly price bars from now: gridlines, +6/+12/+24 h markers, tooltip
│   │   ├── icon/                 # Inline SVG icons
│   │   ├── models/               # API DTOs
│   │   ├── services/             # API services
│   │   ├── spinner/              # Loading spinner shown until prices arrive
│   │   └── trend-tiles/          # Average of the next 6, 12 and 24 hours vs. now
│   ├── app.component.*           # Root component (router outlet)
│   ├── app.config.ts             # Application configuration
│   ├── app.paths.ts              # Route paths
│   └── app.routes.ts             # Application routing
├── environments/                 # Environment configurations
├── styles/_colors.scss           # The only place colors are defined
└── styles.scss                   # Global styles and design tokens
```

## Features

- **Home**: current price and its category (from the backend), hourly price bars from the current hour to the last published price (gridlines every 10 c/kWh, dashed +6/+12/+24 h markers, tooltip on hover or tap), trend tiles with the average of the next 6, 12 and 24 hours vs. now, and one row per question with its answer. On wide screens an invisible slot under the price is reserved for an ad or price analysis. Data loads on open and again when the tab returns after 15 minutes.
- **Question pages**: laundry recommends a timer delay (Nyt, +1 … +5 h) from the cost of each (2 h program, 1,5 kWh, costed by the backend); waiting must save at least 5 snt for +1 h and 2 snt more for each further hour (`wash-laundry/laundry-recommendation.ts`), so the recommendation is not always the cheapest option (the backend's `isBest`); EV charging answers with the cheapest 4-hour clock-time window, a chart of the next 24 hours and a comparison with charging now.
- Clock times are shown in Finnish time (`shared/format/format.ts`).

### UI
- No UI component library. Plain HTML and SCSS with design tokens as CSS custom properties in `src/styles.scss` (fonts, radius, spacing, tap size) and colors in `src/styles/_colors.scss`.
- **Look**: dark background, one green accent (`accent`), IBM Plex Sans for text and IBM Plex Mono for prices and times.
- **Icons**: inline SVG through `IconComponent` (`shared/icon`); no icon fonts, no emoji.
- **Layout**: mobile first; the home screen widens to price and chart side by side (768 px) and a question table (960 px). Question pages are a single column up to 560 px.

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
All SEO meta tags are defined in `src/index.html`:
- **Title**: "Milloin… – Pörssisähkön hinta nyt ja halvimmat tunnit"
- **Description**: Optimized for search engines with relevant keywords
- **Keywords**: electricity price, spot price, cheapest hour, EV charging, laundry, energy savings (in Finnish)
- **Open Graph Tags**: For social media sharing (Facebook, LinkedIn); image `public/og-image.png` (1200x630, rendered from `src/og-image.svg`)
- **Twitter Card Tags**: For Twitter/X sharing

**Important**: When adding new features or pages:
1. Update meta description to reflect new content
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
- This is an Angular 22 project; components default to OnPush change detection
- Uses SCSS for styling
- Colors are defined only in `src/styles/_colors.scss`. In SCSS, `@use 'colors' as *` and use `color(accent)` or `alpha(accent, 10%)`, or the `--color-*` custom properties; never hex or rgba values.
- Routing is enabled
- Follow Angular style guide for code conventions
- Every "a" and "buttton" elements should have a data-test-id attribute in order to help e2e tests
- Use inject from angular/core for dependency injection instead of legacy constructor way
- Backend api documentation is located here https://milloin-server.vercel.app/api-json