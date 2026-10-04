import { supabase } from '@/integrations/supabase/client';
import { Chapter, Question } from '@/types';

const db = supabase as any;

/** Merge online overrides into the base question list shipped with the app. */
export async function fetchQuestionOverrides(base: Question[]): Promise<Question[] | null> {
  const { data, error } = await db.from('question_overrides').select('id,data,deleted');
  if (error) { console.error('fetch overrides', error); return null; }
  const map = new Map<string, any>((data || []).map((r: any) => [r.id, r]));
  const result: Question[] = [];
  base.forEach(q => {
    const o = map.get(q.id);
    if (!o) return result.push(q);
    map.delete(q.id);
    if (!o.deleted && o.data) result.push(o.data);
  });
  map.forEach(o => { if (!o.deleted && o.data) result.push(o.data); });
  return result;
}

/** Push changed / added / removed questions (compared by reference). */
export async function syncQuestionDiff(prev: Question[], next: Question[]) {
  const prevMap = new Map(prev.map(q => [q.id, q]));
  const nextIds = new Set(next.map(q => q.id));
  const now = new Date().toISOString();
  const rows: any[] = [];
  next.forEach(q => { if (prevMap.get(q.id) !== q) rows.push({ id: q.id, data: q, deleted: false, updated_at: now }); });
  prev.forEach(q => { if (!nextIds.has(q.id)) rows.push({ id: q.id, data: null, deleted: true, updated_at: now }); });
  if (!rows.length) return true;
  const { error } = await db.from('question_overrides').upsert(rows);
  if (error) { console.error('sync questions', error); return false; }
  return true;
}

export async function fetchContentState(): Promise<{ chapters?: Chapter[]; subjects?: Record<string, string> }> {
  const { data, error } = await db.from('content_state').select('key,data');
  if (error) { console.error('fetch content_state', error); return {}; }
  const out: any = {};
  (data || []).forEach((r: any) => { out[r.key] = r.data; });
  return out;
}

export async function saveContentState(key: 'chapters' | 'subjects', data: unknown) {
  const { error } = await db.from('content_state').upsert({ key, data, updated_at: new Date().toISOString() });
  if (error) { console.error('save content_state', error); return false; }
  return true;
}
