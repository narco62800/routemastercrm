import { useMemo, useState } from 'react';
import { ChevronRight, Plus, Edit3, Trash2, Save, X, Eye, EyeOff, FileText, Check } from 'lucide-react';
import { Chapter, Question } from '../types';

interface Props {
  levels: string[];
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  subjectNames: Record<string, string>;
  setSubjectNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isVisible: (c: Chapter) => boolean;
  toggleVisibility: (c: Chapter) => void;
  openDoc: (c: Chapter) => void;
}

const lc = (s: string) => s.trim().toLowerCase();
const emptyQ = { text: '', options: ['', '', '', ''], correct: 0, explanation: '' };

export default function ProfManager(p: Props) {
  const [level, setLevel] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [qDraft, setQDraft] = useState<{ id: string | null; text: string; options: string[]; correct: number; explanation: string } | null>(null);

  const subjects = useMemo(() => {
    if (!level) return [];
    const set = new Map<string, string>();
    p.chapters.filter(c => c.level === level).forEach(c => { if (!set.has(lc(c.subject))) set.set(lc(c.subject), c.subject); });
    p.questions.filter(q => q.level === level).forEach(q => { if (!set.has(lc(q.subject))) set.set(lc(q.subject), q.subject); });
    return [...set.values()];
  }, [level, p.chapters, p.questions]);

  const chaptersList = useMemo(() => {
    if (!level || !subject) return [];
    const list = p.chapters.filter(c => c.level === level && lc(c.subject) === lc(subject));
    const titles = new Set(list.map(c => c.title));
    p.questions.filter(q => q.level === level && lc(q.subject) === lc(subject)).forEach(q => {
      if (!titles.has(q.chapter)) { titles.add(q.chapter); list.push({ level, subject, title: q.chapter }); }
    });
    return list;
  }, [level, subject, p.chapters, p.questions]);

  const chapterQs = useMemo(() => {
    if (!level || !subject || !chapter) return [];
    return p.questions.filter(q => q.level === level && lc(q.subject) === lc(subject) && q.chapter === chapter);
  }, [level, subject, chapter, p.questions]);

  const countQ = (s: string, ch?: string) => p.questions.filter(q => q.level === level && lc(q.subject) === lc(s) && (ch === undefined || q.chapter === ch)).length;
  const label = (s: string) => p.subjectNames[s] || s;

  // ---------- Matières ----------
  const addSubject = () => {
    const n = newName.trim(); if (!n || !level) return;
    if (subjects.some(s => lc(s) === lc(n))) return alert('Cette matière existe déjà.');
    p.setSubjectNames(prev => ({ ...prev, [n]: n }));
    p.setChapters(prev => [...prev, { level, subject: n, title: 'Chapitre 1' }]);
    setNewName('');
  };
  const renameSubject = (old: string) => {
    const n = editVal.trim(); setEditKey(null);
    if (!n || n === old || !level) return;
    p.setChapters(prev => prev.map(c => c.level === level && lc(c.subject) === lc(old) ? { ...c, subject: n } : c));
    p.setQuestions(prev => prev.map(q => q.level === level && lc(q.subject) === lc(old) ? { ...q, subject: n } : q));
    p.setSubjectNames(prev => { const x = { ...prev }; delete x[old]; x[n] = n; return x; });
  };
  const deleteSubject = (s: string) => {
    if (!level || !confirm(`Supprimer la matière "${label(s)}" du niveau ${level} et toutes ses questions ?`)) return;
    p.setChapters(prev => prev.filter(c => !(c.level === level && lc(c.subject) === lc(s))));
    p.setQuestions(prev => prev.filter(q => !(q.level === level && lc(q.subject) === lc(s))));
  };

  // ---------- Chapitres ----------
  const addChapter = () => {
    const n = newName.trim(); if (!n || !level || !subject) return;
    if (chaptersList.some(c => c.title === n)) return alert('Ce chapitre existe déjà.');
    p.setChapters(prev => [...prev, { level, subject, title: n }]);
    setNewName('');
  };
  const renameChapter = (old: string) => {
    const n = editVal.trim(); setEditKey(null);
    if (!n || n === old || !level || !subject) return;
    const match = (c: { level: string; subject: string }) => c.level === level && lc(c.subject) === lc(subject);
    p.setChapters(prev => prev.some(c => match(c) && c.title === old)
      ? prev.map(c => match(c) && c.title === old ? { ...c, title: n } : c)
      : [...prev, { level, subject, title: n }]);
    p.setQuestions(prev => prev.map(q => match(q) && q.chapter === old ? { ...q, chapter: n } : q));
  };
  const deleteChapter = (t: string) => {
    if (!level || !subject || !confirm(`Supprimer le chapitre "${t}" et ses questions ?`)) return;
    const match = (c: { level: string; subject: string }) => c.level === level && lc(c.subject) === lc(subject);
    p.setChapters(prev => prev.filter(c => !(match(c) && c.title === t)));
    p.setQuestions(prev => prev.filter(q => !(match(q) && q.chapter === t)));
  };

  // ---------- Questions ----------
  const saveQuestion = () => {
    if (!qDraft || !level || !subject || !chapter) return;
    const opts = qDraft.options.map(o => o.trim()).filter(Boolean);
    if (!qDraft.text.trim() || opts.length < 2) return alert('Il faut un énoncé et au moins 2 réponses.');
    const correctText = qDraft.options[qDraft.correct]?.trim();
    const correct = Math.max(0, opts.indexOf(correctText));
    if (qDraft.id) {
      p.setQuestions(prev => prev.map(q => q.id === qDraft.id ? { ...q, text: qDraft.text.trim(), options: opts, correct, explanation: qDraft.explanation.trim() } : q));
    } else {
      p.setQuestions(prev => [...prev, {
        id: `custom_${Date.now()}`, type: 'qcm', level, subject, chapter,
        text: qDraft.text.trim(), options: opts, correct, explanation: qDraft.explanation.trim(),
      }]);
    }
    setQDraft(null);
  };
  const deleteQuestion = (id: string) => {
    if (!confirm('Supprimer cette question ?')) return;
    p.setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const go = (l: string | null, s: string | null, c: string | null) => {
    setLevel(l); setSubject(s); setChapter(c); setNewName(''); setEditKey(null); setQDraft(null);
  };

  const card = 'bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4';
  const input = 'bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm';
  const iconBtn = 'p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800';

  const renameRow = (onSave: () => void) => (
    <div className="flex items-center gap-2 flex-1">
      <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSave()} className={input + ' flex-1 border-emerald-500'} />
      <button onClick={onSave} className="p-1.5 bg-emerald-500 text-black rounded"><Save className="w-4 h-4" /></button>
      <button onClick={() => setEditKey(null)} className="p-1.5 bg-zinc-700 text-white rounded"><X className="w-4 h-4" /></button>
    </div>
  );

  const addRow = (placeholder: string, onAdd: () => void) => (
    <div className="flex gap-2">
      <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()} placeholder={placeholder} className={input + ' flex-1'} />
      <button onClick={onAdd} className="px-4 bg-emerald-500 text-black font-bold rounded-xl flex items-center gap-1"><Plus className="w-4 h-4" /> Ajouter</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Fil d'Ariane */}
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button onClick={() => go(null, null, null)} className="text-emerald-400 hover:underline">Niveaux</button>
        {level && <><ChevronRight className="w-4 h-4 text-zinc-600" /><button onClick={() => go(level, null, null)} className="text-emerald-400 hover:underline">{level}</button></>}
        {subject && <><ChevronRight className="w-4 h-4 text-zinc-600" /><button onClick={() => go(level, subject, null)} className="text-emerald-400 hover:underline">{label(subject)}</button></>}
        {chapter && <><ChevronRight className="w-4 h-4 text-zinc-600" /><span className="text-white">{chapter}</span></>}
      </div>

      {/* 1. Niveaux */}
      {!level && (
        <div className={card}>
          <h3 className="text-lg font-bold text-white">1. Choisissez un niveau</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {p.levels.map(l => (
              <button key={l} onClick={() => go(l, null, null)} className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-bold hover:border-emerald-500">{l}</button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Matières */}
      {level && !subject && (
        <div className={card}>
          <h3 className="text-lg font-bold text-white">2. Matières — {level}</h3>
          {addRow('Nouvelle matière…', addSubject)}
          <div className="divide-y divide-zinc-800">
            {subjects.length === 0 && <p className="text-zinc-500 text-sm py-3">Aucune matière pour ce niveau.</p>}
            {subjects.map(s => (
              <div key={s} className="py-2 flex items-center gap-2">
                {editKey === 's:' + s ? renameRow(() => renameSubject(s)) : (
                  <button onClick={() => go(level, s, null)} className="flex-1 text-left">
                    <p className="text-white font-medium">{label(s)}</p>
                    <p className="text-zinc-500 text-xs">{countQ(s)} questions</p>
                  </button>
                )}
                <button onClick={() => { setEditKey('s:' + s); setEditVal(label(s)); }} className={iconBtn} title="Renommer"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => deleteSubject(s)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Chapitres */}
      {level && subject && !chapter && (
        <div className={card}>
          <h3 className="text-lg font-bold text-white">3. Chapitres — {label(subject)}</h3>
          {addRow('Nouveau chapitre…', addChapter)}
          <div className="divide-y divide-zinc-800">
            {chaptersList.length === 0 && <p className="text-zinc-500 text-sm py-3">Aucun chapitre.</p>}
            {chaptersList.map(c => {
              const vis = p.isVisible(c);
              return (
                <div key={c.title} className="py-2 flex items-center gap-1">
                  {editKey === 'c:' + c.title ? renameRow(() => renameChapter(c.title)) : (
                    <button onClick={() => go(level, subject, c.title)} className="flex-1 text-left">
                      <p className="text-white font-medium">{c.title} {!vis && <span className="text-xs text-zinc-500">(masqué)</span>}</p>
                      <p className="text-zinc-500 text-xs">{countQ(subject, c.title)} questions</p>
                    </button>
                  )}
                  <button onClick={() => p.toggleVisibility(c)} className={iconBtn} title="Visibilité">{vis ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                  <button onClick={() => p.openDoc(c)} className={iconBtn} title="Cours"><FileText className="w-4 h-4" /></button>
                  <button onClick={() => { setEditKey('c:' + c.title); setEditVal(c.title); }} className={iconBtn} title="Renommer"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteChapter(c.title)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Questions */}
      {level && subject && chapter && (
        <div className={card}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">4. Questions — {chapter} ({chapterQs.length})</h3>
            {!qDraft && <button onClick={() => setQDraft({ id: null, ...emptyQ, options: [...emptyQ.options] })} className="px-3 py-2 bg-emerald-500 text-black font-bold rounded-xl flex items-center gap-1 text-sm"><Plus className="w-4 h-4" /> Question</button>}
          </div>

          {qDraft && (
            <div className="bg-zinc-800/60 border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <label className="text-xs text-zinc-400 uppercase font-bold">Énoncé</label>
              <textarea value={qDraft.text} onChange={e => setQDraft({ ...qDraft, text: e.target.value })} rows={3} className={input + ' w-full'} />
              <label className="text-xs text-zinc-400 uppercase font-bold">Réponses (cochez la bonne réponse)</label>
              {qDraft.options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setQDraft({ ...qDraft, correct: i })} className={'w-8 h-8 shrink-0 rounded-full border flex items-center justify-center ' + (qDraft.correct === i ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-600 text-zinc-500')} title="Bonne réponse">
                    {qDraft.correct === i ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                  </button>
                  <input value={o} onChange={e => { const opts = [...qDraft.options]; opts[i] = e.target.value; setQDraft({ ...qDraft, options: opts }); }} placeholder={`Réponse ${String.fromCharCode(65 + i)}`} className={input + ' flex-1'} />
                  {qDraft.options.length > 2 && (
                    <button onClick={() => { const opts = qDraft.options.filter((_, j) => j !== i); setQDraft({ ...qDraft, options: opts, correct: qDraft.correct === i ? 0 : qDraft.correct > i ? qDraft.correct - 1 : qDraft.correct }); }} className="p-1.5 text-zinc-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              {qDraft.options.length < 6 && <button onClick={() => setQDraft({ ...qDraft, options: [...qDraft.options, ''] })} className="text-emerald-400 text-sm">+ Ajouter une réponse</button>}
              <label className="text-xs text-zinc-400 uppercase font-bold block">Explication</label>
              <textarea value={qDraft.explanation} onChange={e => setQDraft({ ...qDraft, explanation: e.target.value })} rows={2} className={input + ' w-full'} />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setQDraft(null)} className="px-4 py-2 bg-zinc-700 text-white rounded-xl text-sm">Annuler</button>
                <button onClick={saveQuestion} className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl text-sm flex items-center gap-1"><Save className="w-4 h-4" /> Enregistrer</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {chapterQs.length === 0 && <p className="text-zinc-500 text-sm">Aucune question dans ce chapitre.</p>}
            {chapterQs.map((q, n) => (
              <div key={q.id} className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-white text-sm font-medium">{n + 1}. {q.text}</p>
                  <button onClick={() => setQDraft({ id: q.id, text: q.text, options: [...q.options], correct: q.correct, explanation: q.explanation || '' })} className={iconBtn} title="Modifier"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteQuestion(q.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {q.options.map((o, i) => (
                    <li key={i} className={'text-xs ' + (i === q.correct ? 'text-emerald-400 font-bold' : 'text-zinc-400')}>{String.fromCharCode(65 + i)}. {o}{i === q.correct && ' ✓'}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
