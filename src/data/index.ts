import { Question, Chapter } from '../types';
import { INITIAL_CHAPTERS } from './chapters';
import { ETG_QUESTIONS } from './questions_etg';
import { RSE_QUESTIONS } from './questions_rse';
import { ECRITES_C_QUESTIONS } from './questions_ecrites_c';
import { ECRITES_CE_QUESTIONS } from './questions_ecrites_ce';
import { ORAL_QUESTIONS_1_2 } from './questions_orales_1_2';
import { ORAL_QUESTIONS_3_4 } from './questions_orales_3_4';
import { ORAL_QUESTIONS_5_6 } from './questions_orales_5_6';
import { ORAL_QUESTIONS_7_8 } from './questions_orales_7_8';
import { ORAL_QUESTIONS_9_10 } from './questions_orales_9_10';
import { ORAL_QUESTIONS_11_12 } from './questions_orales_11_12';
import { ALL_ORAL_CE_QUESTIONS } from './questions_orales_ce';

export const ALL_QUESTIONS: Question[] = [
  ...ETG_QUESTIONS,
  ...RSE_QUESTIONS,
  ...ECRITES_C_QUESTIONS,
  ...ECRITES_CE_QUESTIONS.map(q => ({ ...q, level: "Terminales CRM" })),
  ...ORAL_QUESTIONS_1_2,
  ...ORAL_QUESTIONS_3_4,
  ...ORAL_QUESTIONS_5_6,
  ...ORAL_QUESTIONS_7_8,
  ...ORAL_QUESTIONS_9_10,
  ...ORAL_QUESTIONS_11_12,
  ...ALL_ORAL_CE_QUESTIONS,
];

export { INITIAL_CHAPTERS };

// Initial subject names mapping
export const INITIAL_SUBJECT_NAMES: Record<string, string> = {
  "ETG": "ETG",
  "Technologie véhicule": "Technologie véhicule",
  "RSE": "RSE",
  "Fiches écrites C": "Fiches écrites C",
  "fiches orales C": "fiches orales C",
  "Fiches écrites CE": "Fiches écrites CE",
  "fiches orales CE": "fiches orales CE"
};
