import { describe, expect, it } from 'vitest';
import {
  normalizeStoredChapters,
  normalizeStoredQuestions,
  normalizeStoredSelectedSubject,
  normalizeStoredSubjectNames,
} from '../lib/contentNormalization';

describe('content normalization', () => {
  it('restores canonical 1ères CRM subjects from legacy chapter labels', () => {
    expect(
      normalizeStoredChapters([
        { level: '1ères CRM', subject: 'logistique & organisation', title: 'Fiche 3' },
        { level: '1ères CRM', subject: 'conduite & manoeuvres', title: 'fiche orale 2' },
        { level: '1ères CRM', subject: 'epreuve théorique générale', title: 'Chapitre 2 - Temps de conduite et repos' },
      ])
    ).toEqual([
      { level: '1ères CRM', subject: 'Fiches écrites C', title: 'Fiche 3' },
      { level: '1ères CRM', subject: 'fiches orales C', title: 'fiche orale 2' },
      { level: '1ères CRM', subject: 'RSE', title: 'Chapitre 2 - Temps de conduite et repos' },
    ]);
  });

  it('restores canonical 1ères CRM subjects for stored questions', () => {
    const normalized = normalizeStoredQuestions([
      {
        id: '1',
        type: 'qcm',
        level: '1ères CRM',
        subject: 'réglementation transport',
        chapter: 'Chapitre 2 - Temps de conduite et repos',
        text: 'Question',
        options: ['A', 'B'],
        correct: 0,
        explanation: 'Explication',
      },
    ]);

    expect(normalized[0].subject).toBe('RSE');
  });

  it('ignores legacy display names while keeping real custom labels', () => {
    const result = normalizeStoredSubjectNames(
      {
        RSE: 'réglementation transport',
        ETG: 'Code de la route',
      },
      {
        ETG: 'ETG',
        RSE: 'RSE',
        'Fiches écrites C': 'Fiches écrites C',
        'fiches orales C': 'fiches orales C',
      }
    );

    expect(result.RSE).toBe('RSE');
    expect(result.ETG).toBe('Code de la route');
  });

  it('normalizes the selected 1ères CRM subject from session storage', () => {
    expect(
      normalizeStoredSelectedSubject('1ères CRM', 'conduite & manoeuvres', 'fiche orale 8')
    ).toBe('fiches orales C');
  });
});