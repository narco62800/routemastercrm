import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Chapter } from '@/types';

export interface ChapterMetaValue {
  documentUrl: string | null;
  estVisible: boolean;
}

export const chapterKey = (c: { level: string; subject: string; title: string }) =>
  `${c.level}|${c.subject}|${c.title}`;

export function useChapterMeta() {
  const [metaMap, setMetaMap] = useState<Record<string, ChapterMetaValue>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await (supabase as any).from('chapter_meta').select('*');
    if (error) {
      console.error('Error fetching chapter_meta:', error);
      setLoading(false);
      return;
    }
    const map: Record<string, ChapterMetaValue> = {};
    (data || []).forEach((row: any) => {
      map[chapterKey(row)] = { documentUrl: row.document_url, estVisible: row.est_visible };
    });
    setMetaMap(map);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const upsertMeta = useCallback(async (c: Chapter, values: Partial<ChapterMetaValue>) => {
    const key = chapterKey(c);
    const current = metaMap[key] || { documentUrl: null, estVisible: true };
    const next = { ...current, ...values };
    const { error } = await (supabase as any).from('chapter_meta').upsert({
      level: c.level,
      subject: c.subject,
      title: c.title,
      document_url: next.documentUrl,
      est_visible: next.estVisible,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'level,subject,title' });
    if (error) {
      console.error('Error saving chapter_meta:', error);
      return false;
    }
    setMetaMap(prev => ({ ...prev, [key]: next }));
    return true;
  }, [metaMap]);

  const uploadDocument = useCallback(async (c: Chapter, file: File) => {
    const safe = `${c.level}-${c.subject}-${c.title}`.replace(/[^a-zA-Z0-9-_]/g, '_');
    const path = `${safe}-${Date.now()}.pdf`;
    const { error } = await supabase.storage.from('cours').upload(path, file, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (error) {
      console.error('Error uploading course document:', error);
      return false;
    }
    return upsertMeta(c, { documentUrl: path });
  }, [upsertMeta]);

  const removeDocument = useCallback(async (c: Chapter) => {
    const path = metaMap[chapterKey(c)]?.documentUrl;
    if (path) await supabase.storage.from('cours').remove([path]);
    return upsertMeta(c, { documentUrl: null });
  }, [metaMap, upsertMeta]);

  const setVisibility = useCallback(async (c: Chapter, estVisible: boolean) =>
    upsertMeta(c, { estVisible }), [upsertMeta]);

  const renameChapter = useCallback(async (c: Chapter, newTitle: string) => {
    const oldKey = chapterKey(c);
    const meta = metaMap[oldKey];
    if (meta) {
      await (supabase as any)
        .from('chapter_meta')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('level', c.level).eq('subject', c.subject).eq('title', c.title);
      setMetaMap(prev => {
        const next = { ...prev };
        delete next[oldKey];
        next[chapterKey({ ...c, title: newTitle })] = meta;
        return next;
      });
    }
    return true;
  }, [metaMap]);

  const getSignedUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage.from('cours').createSignedUrl(path, 3600);
    if (error) {
      console.error('Error creating signed url:', error);
      return null;
    }
    return data?.signedUrl ?? null;
  }, []);

  return { metaMap, loading, refresh, uploadDocument, removeDocument, setVisibility, renameChapter, getSignedUrl };
}
