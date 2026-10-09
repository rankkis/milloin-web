import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { APP_NAVIGATION_PATHS, LEGACY_PATH_REDIRECTS } from './app.paths';
import { SeoRouteData } from './shared/seo/seo-title-strategy';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Milloin… – Vastaukset arjen milloin-kysymyksiin',
    data: {
      description:
        'Milloin saunotaan, pestään pyykit tai ladataan auto? Vastaukset arjen milloin-kysymyksiin, laskettuna pörssisähkön tuntihinnoista, ja sähkön hinta nyt.',
    } satisfies SeoRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.ELECTRICITY,
    loadComponent: () => import('./electricity/electricity.component').then(m => m.ElectricityComponent),
    title: 'Milloin sähkö on halpaa? – Pörssisähkön hinta nyt ja halvimmat tunnit | Milloin…',
    data: {
      description:
        'Pörssisähkön hinta nyt, tuntihinnat huomiseen asti ja keskihinta seuraavien 6, 12 ja 24 tunnin ajalta. Katso milloin pyykinpesu, sähköauton lataus ja saunominen tulevat halvimmiksi.',
    } satisfies SeoRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.WASH_LAUNDRY,
    loadComponent: () => import('./wash-laundry/wash-laundry.component').then(m => m.WashLaundryComponent),
    title: 'Milloin pestään pyykit? – Pesukoneen halvin aloitusaika | Milloin…',
    data: {
      description:
        'Kannattaako pyykinpesu aloittaa nyt vai ajastaa myöhemmäksi? Katso pesun hinta pörssisähkön tuntihinnoilla ja paljonko ajastus säästää.',
    } satisfies SeoRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.CHARGE_EV,
    loadComponent: () => import('./charge-ev/charge-ev.component').then(m => m.ChargeEvComponent),
    title: 'Milloin ladataan auto? – Sähköauton halvin latausaika | Milloin…',
    data: {
      description:
        'Sähköauton halvin neljän tunnin latausaika seuraavan vuorokauden pörssisähkön hinnoista ja paljonko säästät verrattuna lataukseen heti.',
    } satisfies SeoRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.SAUNA,
    loadComponent: () => import('./sauna/sauna.component').then(m => m.SaunaComponent),
    title: 'Milloin saunotaan? – Sähkökiukaan halvin lämmitysaika | Milloin…',
    data: {
      description:
        'Milloin sähkösauna kannattaa lämmittää tänään tai huomenna? Katso saunomisen hinta pörssisähkön tuntihinnoilla eri aloitusajoille ja halvin aika päivälle tai illalle.',
    } satisfies SeoRouteData,
  },
  // Earlier addresses; Vercel redirects these permanently before they reach the app
  ...Object.entries(LEGACY_PATH_REDIRECTS).map(([path, redirectTo]) => ({ path, redirectTo, pathMatch: 'full' as const })),
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Sivua ei löytynyt | Milloin…',
    data: { noindex: true } satisfies SeoRouteData,
  },
];
