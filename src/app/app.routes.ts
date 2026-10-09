import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { APP_NAVIGATION_PATHS, LEGACY_PATH_REDIRECTS } from './app.paths';
import { PaymentDayRouteData } from './money/payment-day/payment-day.component';
import { SeoRouteData } from './shared/seo/seo-title-strategy';

const HOME_DESCRIPTION =
  'Milloin saunotaan, pestään pyykit tai ladataan auto, ja milloin Kelan tuet, veronpalautukset ja eläke tulevat tilille? Vastaukset arjen milloin-kysymyksiin ja sähkön hinta nyt.';

const paymentDay = () => import('./money/payment-day/payment-day.component').then(m => m.PaymentDayComponent);

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Milloin… – Vastaukset arjen milloin-kysymyksiin',
    data: {
      description: HOME_DESCRIPTION,
    } satisfies SeoRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.ELECTRICITY,
    loadComponent: () => import('./electricity/electricity.component').then(m => m.ElectricityComponent),
    title: 'Pörssisähkön hinta nyt – Milloin sähkö on halpaa? | Milloin…',
    data: {
      description:
        'Sähkön hinta nyt: pörssisähkön tuntihinnat tänään ja huomenna sekä keskihinta seuraavien 6, 12 ja 24 tunnin ajalta. Katso milloin pyykinpesu, sähköauton lataus ja saunominen tulevat halvimmiksi.',
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
  {
    path: APP_NAVIGATION_PATHS.MONEY,
    loadComponent: () => import('./money/money.component').then(m => m.MoneyComponent),
    title: 'Milloin raha tulee tilille? – Kelan tukien, veronpalautusten ja eläkkeiden maksupäivät | Milloin…',
    data: {
      description:
        'Milloin Kelan tuet, veronpalautukset ja eläkkeet tulevat tilille? Seuraavat maksupäivät laskettuna maksajien julkaisemista säännöistä ja pankkipäivistä.',
    } satisfies SeoRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.KELA,
    loadComponent: paymentDay,
    title: 'Milloin Kelan tuet maksetaan? – Kelan maksupäivät | Milloin…',
    data: {
      question: 'kela',
      description:
        'Milloin opintoraha, asumistuki, toimeentulotuki, lapsilisä, kansaneläke ja muut Kelan tuet tulevat tilille? Seuraava maksupäivä jokaiselle tuelle pankkipäivät huomioiden.',
    } satisfies SeoRouteData & PaymentDayRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.TAX_REFUND,
    loadComponent: paymentDay,
    title: 'Milloin veronpalautukset tulevat? – Veronpalautusten maksupäivät 2026 | Milloin…',
    data: {
      question: 'tax-refund',
      description:
        'Veronpalautusten maksupäivät 2026: palautuksen päivä sen mukaan, milloin verotuksesi valmistui, ja seuraava palautuspäivä.',
    } satisfies SeoRouteData & PaymentDayRouteData,
  },
  {
    path: APP_NAVIGATION_PATHS.PENSION,
    loadComponent: paymentDay,
    title: 'Milloin eläke maksetaan? – Työeläkkeen ja kansaneläkkeen maksupäivät | Milloin…',
    data: {
      question: 'pension',
      description:
        'Milloin työeläke, kansaneläke ja takuueläke tulevat tilille? Seuraavat eläkkeen maksupäivät pankkipäivät huomioiden.',
    } satisfies SeoRouteData & PaymentDayRouteData,
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
