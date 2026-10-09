import { APP_NAVIGATION_PATHS } from './app.paths';
import { IconName } from './shared/icon/icon.component';

export type QuestionId = 'sauna' | 'laundry' | 'ev';

/** A question the site answers. The title is the whole question; the path finishes the sentence after "milloin.xyz/". */
export interface Question {
  id: QuestionId;
  title: string;
  path: string;
  icon: IconName;
}

/** A group of questions with its own page */
export interface Category {
  id: string;
  name: string;
  path: string;
  questions: Question[];
}

/** Every category and its questions, in the order the home page lists them */
export const CATEGORIES: Category[] = [
  {
    id: 'sahko',
    name: 'Sähkö',
    path: APP_NAVIGATION_PATHS.ELECTRICITY,
    questions: [
      { id: 'sauna', title: 'Milloin saunotaan?', path: APP_NAVIGATION_PATHS.SAUNA, icon: 'sauna' },
      { id: 'laundry', title: 'Milloin pestään pyykit?', path: APP_NAVIGATION_PATHS.WASH_LAUNDRY, icon: 'washer' },
      { id: 'ev', title: 'Milloin ladataan auto?', path: APP_NAVIGATION_PATHS.CHARGE_EV, icon: 'car' },
    ],
  },
];
