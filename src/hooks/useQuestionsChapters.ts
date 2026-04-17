import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question, Chapter } from '@/types';

function rowToQuestion(row: any): Question {
  return {
    id: row.id,
    type: row.type,
    level: row.level,
    subject: row.subject,
    chapter: row.chapter,
    text: row.text,
    options: row.options || [],
    correct: row.correct,
    explanation: row.explanation || '',
    context: row.context || undefined,
  };
}

function questionToRow(q: Question) {
  return {
    id: q.id,
    type: q.type,
    level: q.level,
    subject: q.subject,
    chapter: q.chapter,
    text: q.text,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    context: q.context || null,
  };
}

export function useQuestionsChapters() {

  const fetchAllQuestions = useCallback(async (): Promise<Question[]> => {
    const { data, error } = await (supabase as any)
      .from('questions')
      .select('*');
    if (error) { console.error('Error fetching questions:', error); return []; }
    return (data || []).map(rowToQuestion);
  }, []);

  const fetchAllChapters = useCallback(async (): Promise<Chapter[]> => {
    const { data, error } = await (supabase as any)
      .from('chapters')
      .select('*')
      .order('level')
      .order('subject')
      .order('title');
    if (error) { console.error('Error fetching chapters:', error); return []; }
    return (data || []).map((r: any) => ({ level: r.level, subject: r.subject, title: r.title }));
  }, []);

  const upsertQuestion = useCallback(async (q: Question): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('questions')
      .upsert(questionToRow(q), { onConflict: 'id' });
    if (error) { console.error('Error upserting question:', error); return false; }
    return true;
  }, []);

  const deleteQuestion = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('questions')
      .delete()
      .eq('id', id);
    if (error) { console.error('Error deleting question:', error); return false; }
    return true;
  }, []);

  const upsertChapter = useCallback(async (c: Chapter): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('chapters')
      .upsert(
        { level: c.level, subject: c.subject, title: c.title },
        { onConflict: 'level,subject,title' }
      );
    if (error) { console.error('Error upserting chapter:', error); return false; }
    return true;
  }, []);

  const deleteChapter = useCallback(async (level: string, subject: string, title: string): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('chapters')
      .delete()
      .eq('level', level)
      .eq('subject', subject)
      .eq('title', title);
    if (error) { console.error('Error deleting chapter:', error); return false; }
    return true;
  }, []);

  // Seed la DB si elle est vide (premier lancement)
  const seedIfEmpty = useCallback(async (
    defaultQuestions: Question[],
    defaultChapters: Chapter[]
  ): Promise<void> => {
    // Vérifier si questions vides
    const { count: qCount } = await (supabase as any)
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if ((qCount ?? 0) === 0) {
      console.log(`Seeding ${defaultQuestions.length} questions...`);
      const BATCH = 100;
      for (let i = 0; i < defaultQuestions.length; i += BATCH) {
        const batch = defaultQuestions.slice(i, i + BATCH).map(questionToRow);
        const { error } = await (supabase as any).from('questions').insert(batch);
        if (error) console.error('Seed error (questions):', error);
      }
    }

    // Vérifier si chapitres vides
    const { count: cCount } = await (supabase as any)
      .from('chapters')
      .select('*', { count: 'exact', head: true });

    if ((cCount ?? 0) === 0) {
      console.log(`Seeding ${defaultChapters.length} chapters...`);
      const rows = defaultChapters.map(c => ({ level: c.level, subject: c.subject, title: c.title }));
      const { error } = await (supabase as any).from('chapters').insert(rows);
      if (error) console.error('Seed error (chapters):', error);
    }
  }, []);

  // Réinitialise TOUT depuis le code (bouton "Réinitialiser" prof)
  const resetFromCode = useCallback(async (
    defaultQuestions: Question[],
    defaultChapters: Chapter[]
  ): Promise<void> => {
    console.log('Resetting all questions and chapters from code...');

    // Supprimer tout
    await (supabase as any).from('questions').delete().neq('id', '');
    await (supabase as any).from('chapters').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Réinsérer
    const BATCH = 100;
    for (let i = 0; i < defaultQuestions.length; i += BATCH) {
      const batch = defaultQuestions.slice(i, i + BATCH).map(questionToRow);
      await (supabase as any).from('questions').insert(batch);
    }

    const rows = defaultChapters.map(c => ({ level: c.level, subject: c.subject, title: c.title }));
    await (supabase as any).from('chapters').insert(rows);

    console.log('Reset done.');
  }, []);

  return {
    fetchAllQuestions,
    fetchAllChapters,
    upsertQuestion,
    deleteQuestion,
    upsertChapter,
    deleteChapter,
    seedIfEmpty,
    resetFromCode,
  };
}
