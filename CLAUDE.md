# Milloin Web - Angular Project

## Project Overview
Angular web application for the Milloin project.

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
├── app/                 # Application source code
├── assets/             # Static assets
├── environments/       # Environment configurations
└── styles.scss        # Global styles
```

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