# Milloin Web - Angular Project

## Project Overview
Angular web application for the Milloin project. Milloin translates to When in english. This service is web application where user may ask different type of pre defined questions like When to use washing machine. By clicking the button this web applications calls to backend which is using Claude AI and electric spot prices to figure out when is cheapest time to start the washing machine.

## Technology Stack
- **Angular**: 19.2.0
- **Angular CLI**: 19.2.17
- **Node.js**: 18.20.5
- **Package Manager**: npm 10.8.2
- **TypeScript**: 5.7.2
- **Styling**: SCSS
- **Routing**: Enabled
- **Testing**: Jasmine + Karma

## Dependencies
- **Core**: @angular/core, @angular/common, @angular/router
- **Forms**: @angular/forms
- **HTTP**: @angular/common/http (add when needed)
- **UI**: @angular/material, @angular/cdk, @angular/animations (Material Design)
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
ng test --watch=false --browsers=ChromeHeadless  # Run tests once
```

### Code Quality
```bash
ng lint             # Run linting (if ESLint is configured)
```

### Deployment to GitHub Pages
```bash
npm run github-build    # Build for GitHub Pages with correct base-href
npm run github-deploy   # Deploy to GitHub Pages (creates gh-pages branch)
```

**GitHub Pages URL:** https://rankkis.github.io/milloin-web/

**Deployment Workflow:**
1. Build for GitHub Pages: `npm run github-build`
2. Deploy to Pages: `npm run github-deploy`
3. Site will be available at the URL above

**Important Notes:**
- Repository must be public for GitHub Pages (or GitHub Pro for private repos)
- Deployment creates/updates `gh-pages` branch automatically
- Base href is set to `/milloin-web/` to match repository name
- **Angular 19 Build Structure:** Files are built to `dist/milloin-web-app/browser/` (note the `/browser` subdirectory)
- Deployment script correctly uses `--dir=dist/milloin-web-app/browser` for proper file structure
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
│   ├── core/                     # Core shared module
│   │   ├── navigation/           # Generic navigation/grid component
│   │   │   ├── navigation-link/  # Generic navigation link component
│   │   │   └── navigation.component.* # Navigation layout component
│   │   └── core.module.ts        # Core module for shared components
│   ├── app.component.*           # Root application component
│   ├── app.config.ts            # Application configuration
│   └── app.routes.ts            # Application routing
├── assets/                       # Static assets
├── environments/                 # Environment configurations
└── styles.scss                 # Global styles
```

## Features

### Core Components
- `NavigationComponent`: Generic standalone component with content projection for 3-column responsive grid layout
- `NavigationLinkComponent`: Reusable navigation link component with icon and text inputs, featuring Spotify-themed styling
- `CoreModule`: Shared module for reusable components and utilities

### Application Features
- **Interactive Navigation Links**: Displays user-friendly navigation link cards for asking Claude AI questions
- **Responsive Grid Layout**: 3-column grid that adapts to screen sizes (3→2→1 columns)
- **Spotify-Inspired Design**: Dark theme with Spotify green accents and modern typography

### UI Framework
- **Angular Material 19**: Complete Material Design component library
- **Spotify Theme**: Dark theme with Spotify green (#1db954) and gray (#121212) color scheme
- **Typography**: Montserrat and Inter fonts for modern, clean appearance
- **Material Icons**: Google Material Icons for consistent iconography
- **Responsive Design**: Mobile-first approach with Material's responsive components
- **3-Column Grid Layout**: Responsive grid that adapts to screen sizes (3→2→1 columns)
- **Content Projection**: Flexible component architecture using `<ng-content>` slots
- **Material Navigation Links**: Elevated navigation link cards with Spotify-inspired styling and hover effects
- **Gradient Text Effects**: Modern gradient overlays on text elements

## Development Workflow
1. Create feature branch from main
2. Implement changes
3. Run tests: `ng test`
4. Run linting: `ng lint`
5. Build: `ng build`
6. Commit and push changes
7. Create pull request

## Important Notes
- This is an Angular 19 project
- Uses SCSS for styling
- Routing is enabled
- Follow Angular style guide for code conventions
- Every "a" and "buttton" elements should have a data-test-id attribute in order to help e2e tests