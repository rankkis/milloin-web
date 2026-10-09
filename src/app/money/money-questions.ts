import { PaymentAnswer, kelaAnswer, pensionAnswer, taxRefundAnswer } from './payment-days';

export type MoneyQuestionId = 'kela' | 'tax-refund' | 'pension';

/** What a Raha question page shows besides the question */
export interface MoneyQuestion {
  answer: (today: Date) => PaymentAnswer;
  /** Heading of the list of payment days */
  heading: string;
  note: string;
  source: { label: string; url: string };
}

export const MONEY_QUESTIONS: Record<MoneyQuestionId, MoneyQuestion> = {
  kela: {
    answer: kelaAnswer,
    heading: 'Seuraavat maksupäivät',
    note:
      'Sairauspäiväraha, vanhempainraha ja työttömyysetuudet maksetaan jälkikäteen erissä, joten niillä ei ole kiinteää päivää: oma maksupäiväsi näkyy OmaKelassa. Perhe-eläkkeet maksetaan sukunimen mukaan kuun 4., 14. tai 22. päivä.',
    source: { label: 'Kela: Maksupäivät', url: 'https://www.kela.fi/maksupaivat' },
  },
  'tax-refund': {
    answer: taxRefundAnswer,
    heading: 'Vuoden 2025 verotuksen palautukset',
    note:
      'Palautuksen päivä riippuu siitä, milloin Verohallinto sai verotuksesi valmiiksi. Oma päiväsi näkyy verotuspäätöksessä ja OmaVerossa. Raha tulee tilille maksupäivän aikana.',
    source: {
      label: 'Verohallinto: Veronpalautuksen määrä ja maksupäivät',
      url: 'https://vero.fi/henkiloasiakkaat/maksaminen/veronpalautukset/veronpalautuksen-maara-ja-maksupaivat/',
    },
  },
  pension: {
    answer: pensionAnswer,
    heading: 'Seuraavat maksupäivät',
    note:
      'Työeläkkeen maksupäivä vaihtelee eläkelaitoksittain, mutta useimmat maksavat sen kuun ensimmäisenä pankkipäivänä. Kela maksaa kansaneläkkeen, takuueläkkeen ja eläkkeensaajan asumistuen.',
    source: {
      label: 'Työeläke.fi: Eläkkeen maksaminen',
      url: 'https://www.tyoelake.fi/miten-haen-elaketta/elakkeen-maksaminen-ja-verotus/',
    },
  },
};
