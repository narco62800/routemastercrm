import { Question } from '../types';

export const RSE_QUESTIONS: Question[] = [
  {
    id: "rse1",
    type: "qcm",
    level: "1ères CRM",
    subject: "RSE",
    chapter: "Chapitre 2 - Temps de conduite et repos",
    text: "Quelle est la durée maximale de conduite continue autorisée avant une pause ?",
    options: ["3h00", "4h00", "4h30", "5h00"],
    correct: 2,
    explanation: "Après une période de conduite de 4h30, le conducteur doit observer une pause ininterrompue d'au moins 45 minutes."
  },
  {
    id: "rse2",
    type: "qcm",
    level: "1ères CRM",
    subject: "RSE",
    chapter: "Chapitre 2 - Temps de conduite et repos",
    text: "Quelle est la durée minimale d'un repos journalier normal ?",
    options: ["9 heures", "10 heures", "11 heures", "12 heures"],
    correct: 2,
    explanation: "Le repos journalier normal est d'au moins 11 heures consécutives."
  },
  {
    id: "rse3",
    type: "qcm",
    level: "1ères CRM",
    subject: "RSE",
    chapter: "Chapitre 2 - Temps de conduite et repos",
    text: "Combien de fois par semaine un conducteur peut-il réduire son repos journalier à 9 heures ?",
    options: ["1 fois", "2 fois", "3 fois", "Jamais"],
    correct: 2,
    explanation: "Un conducteur peut réduire son repos journalier à 9 heures au maximum 3 fois entre deux repos hebdomadaires."
  },
  {
    id: "rse4",
    type: "qcm",
    level: "1ères CRM",
    subject: "RSE",
    chapter: "Chapitre 2 - Temps de conduite et repos",
    text: "Quelle est la durée maximale de conduite journalière autorisée ?",
    options: ["8 heures", "9 heures", "10 heures", "11 heures"],
    correct: 1,
    explanation: "La durée de conduite journalière ne doit pas dépasser 9 heures, avec une possibilité de passer à 10 heures deux fois par semaine."
  },
  {
    id: "rse5",
    type: "qcm",
    level: "1ères CRM",
    subject: "RSE",
    chapter: "Chapitre 2 - Temps de conduite et repos",
    text: "Quelle est la durée maximale de conduite hebdomadaire ?",
    options: ["48 heures", "56 heures", "60 heures", "90 heures"],
    correct: 1,
    explanation: "La durée de conduite hebdomadaire ne doit pas dépasser 56 heures."
  }
];
