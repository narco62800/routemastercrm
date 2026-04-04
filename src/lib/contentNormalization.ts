import { Chapter, Question } from '../types';

const FIRST_YEAR_LEVEL = '1ères CRM';
const FIRST_YEAR_SUBJECTS = ['RSE', 'Fiches écrites C', 'fiches orales C'] as const;

const LEGACY_SUBJECT_LABELS = new Set([
  'epreuve theorique generale',
  'conduite manoeuvres',
  'conduite manœuvres',
  'reglementation transport',
  'reglementation des transports',
  'logistique organisation',
  'logistique et organisation',
]);

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeFirstYearSubject(subject: string, chapterTitle: string) {
  const normalizedChapter = normalizeText(chapterTitle);
  const normalizedSubject = normalizeText(subject);

  if (normalizedChapter.startsWith('fiche orale')) {
    return 'fiches orales C';
  }

  if (normalizedChapter.startsWith('fiche')) {
    return 'Fiches écrites C';
  }

  if (normalizedSubject.includes('orale') || normalizedSubject.includes('manoeuvre') || normalizedSubject.includes('man uvre')) {
    return 'fiches orales C';
  }

  if (normalizedSubject.includes('ecrite') || normalizedSubject.includes('logistique')) {
    return 'Fiches écrites C';
  }

  return 'RSE';
}

export function normalizeSubjectKey(level: string, subject: string, chapterTitle: string) {
  if (level !== FIRST_YEAR_LEVEL) return subject;
  return normalizeFirstYearSubject(subject, chapterTitle);
}

export function normalizeStoredSubjectNames(
  savedNames: Record<string, string> | null,
  defaults: Record<string, string>
) {
  const merged = { ...defaults };

  if (!savedNames) return merged;

  for (const key of Object.keys(defaults)) {
    const savedValue = savedNames[key];

    if (typeof savedValue !== 'string' || !savedValue.trim()) continue;
    if (normalizeText(savedValue) === normalizeText(key)) continue;
    if (LEGACY_SUBJECT_LABELS.has(normalizeText(savedValue))) continue;

    merged[key] = savedValue;
  }

  return merged;
}

export function normalizeStoredSelectedSubject(
  level: string | null,
  subject: string | null,
  chapterTitle?: string | null
) {
  if (!level || !subject) return subject;
  if (level !== FIRST_YEAR_LEVEL) return subject;
  if (FIRST_YEAR_SUBJECTS.includes(subject as (typeof FIRST_YEAR_SUBJECTS)[number])) return subject;

  return normalizeSubjectKey(level, subject, chapterTitle ?? '');
}

export function normalizeStoredChapters(chapters: Chapter[]) {
  return chapters.map((chapter) => ({
    ...chapter,
    subject: normalizeSubjectKey(chapter.level, chapter.subject, chapter.title),
  }));
}

export function normalizeStoredQuestions(questions: Question[]) {
  return questions.map((question) => ({
    ...question,
    subject: normalizeSubjectKey(question.level, question.subject, question.chapter),
  }));
}