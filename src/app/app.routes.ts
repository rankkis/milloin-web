import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { APP_NAVIGATION_PATHS } from './app.paths';
import { SeoRouteData } from './shared/seo/seo-title-strategy';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Milloin… – Pörssisähkön hinta nyt ja halvimmat tunnit',
    data: {
      description:
        'Pörssisähkön hinta nyt, tuntihinnat huomiseen asti ja keskihinta seuraavien 6, 12 ja 24 tunnin ajalta. Katso milloin pyykinpesu ja sähköauton lataus tulevat halvimmiksi.',
    } satisfies SeoRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.WASH_LAUNDRY,
    loadComponent: () => import('./wash-laundry/wash-laundry.component').then(m => m.WashLaundryComponent),
    title: 'Milloin kannattaa pestä pyykkiä? – Pesukoneen halvin aloitusaika | Milloin…',
    data: {
      description:
        'Kannattaako pyykinpesu aloittaa nyt vai ajastaa myöhemmäksi? Katso pesun hinta pörssisähkön tuntihinnoilla ja paljonko ajastus säästää.',
    } satisfies SeoRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.CHARGE_EV,
    loadComponent: () => import('./charge-ev/charge-ev.component').then(m => m.ChargeEvComponent),
    title: 'Milloin kannattaa ladata auto? – Sähköauton halvin latausaika | Milloin…',
    data: {
      description:
        'Sähköauton halvin neljän tunnin latausaika seuraavan vuorokauden pörssisähkön hinnoista ja paljonko säästät verrattuna lataukseen heti.',
    } satisfies SeoRouteData,
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Sivua ei löytynyt | Milloin…',
    data: { noindex: true } satisfies SeoRouteData,
  },
];
