import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  BookOpen, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Fuel, 
  Trophy, 
  Home, 
  GraduationCap, 
  Edit3, 
  Save, 
  Plus, 
  Trash2, 
  Lock, 
  Eye, 
  X, 
  Paperclip, 
  EyeOff, 
  FileText,
  Loader2
} from 'lucide-react';
import { Question, Chapter, User } from '../types';
import { ALL_QUESTIONS, INITIAL_CHAPTERS, INITIAL_SUBJECT_NAMES } from '../data/index';
import { FUEL_PER_CORRECT_ANSWER, POINTS_PER_CORRECT_ANSWER, INITIAL_FUEL, MAX_FUEL, MAX_POINTS } from '../constants';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useProfiles';

const LEVELS = ['2ndes CRM', '1ères CRM', 'Terminales CRM'];
const COOLDOWN_MS = 48 * 60 * 60 * 1000;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RouteMaster() {
  const { fetchAllUsers, fetchUserByPseudo, upsertUser } = useProfiles();
  const [view, setView] = useState<'identification' | 'home' | 'levels' | 'subjects' | 'chapters' | 'quiz' | 'prof'>('identification');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const [subjectNames] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('routemaster_subject_names');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECT_NAMES;
  });

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('routemaster_chapters_v3');
    return saved ? JSON.parse(saved) : INITIAL_CHAPTERS;
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('routemaster_questions_v3');
    return saved ? JSON.parse(saved) : ALL_QUESTIONS;
  });

  const [chapterDocs, setChapterDocs] = useState<Record<string, { docUrl?: string; isVisible: boolean }>>(() => {
    const saved = localStorage.getItem('routemaster_chapter_meta');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('routemaster_chapter_meta', JSON.stringify(chapterDocs));
  }, [chapterDocs]);

  useEffect(() => {
    localStorage.setItem('routemaster_chapters_v3', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    localStorage.setItem('routemaster_questions_v3', JSON.stringify(questions));
  }, [questions]);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('routemaster_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('routemaster_user', JSON.stringify(user));
      upsertUser(user);
    }
  }, [user, upsertUser]);

  useEffect(() => {
    if (user && view === 'identification') {
      setView('home');
    }
  }, [user, view]);

  const [pseudoInput, setPseudoInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [levelInput, setLevelInput] = useState('2ndes CRM');
  const [profCodeInput, setProfCodeInput] = useState('');
  const [isProfAuthenticated, setIsProfAuthenticated] = useState(false);

  // Quiz State
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Actions Chapitres
  const [pdfViewer, setPdfViewer] = useState<{ title: string; url: string } | null>(null);
  const [uploadingTitle, setUploadingTitle] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const getChapterKey = (c: { level: string; subject: string; title: string }) => {
    return c.level + '__' + c.subject + '__' + c.title;
  };

  const toggleChapterVisibility = (c: Chapter) => {
    const key = getChapterKey(c);
    const current = chapterDocs[key]?.isVisible ?? true;
    const nextVal = !current;
    
    setChapterDocs(prev => ({
      ...prev,
      [key]: { ...prev[key], isVisible: nextVal }
    }));
  };

  const handleUploadPDF = async (c: Chapter, file: File) => {
    const key = getChapterKey(c);
    setUploadingTitle(c.title);
    try {
      const cleanName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const { error: uploadError } = await supabase.storage.from('cours').upload(cleanName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('cours').getPublicUrl(cleanName);
      const publicUrl = data.publicUrl;

      setChapterDocs(prev => ({
        ...prev,
        [key]: { ...prev[key], docUrl: publicUrl, isVisible: prev[key]?.isVisible ?? true }
      }));

      alert('Document PDF joint avec succès !');
    } catch (err: any) {
      console.error(err);
      alert('Erreur upload : ' + err.message);
    } finally {
      setUploadingTitle(null);
    }
  };

  const handleRenameChapter = (c: Chapter, newTitle: string) => {
    const title = newTitle.trim();
    if (!title || title === c.title) { setRenamingTitle(null); return; }

    const oldKey = getChapterKey(c);
    const newKey = getChapterKey({ ...c, title });

    setChapters(prev => prev.map(ch =>
      ch.level === c.level && ch.subject === c.subject && ch.title === c.title ? { ...ch, title } : ch
    ));
    setQuestions(prev => prev.map(q =>
      q.level === c.level && q.subject === c.subject && q.chapter === c.title ? { ...q, chapter: title } : q
    ));

    setChapterDocs(prev => {
      const old = prev[oldKey];
      const next = { ...prev };
      delete next[oldKey];
      if (old) next[newKey] = old;
      return next;
    });

    setRenamingTitle(null);
  };

  const handleLogin = async () => {
    if (!pseudoInput.trim() || !passwordInput.trim()) return;
    const existingUser = await fetchUserByPseudo(pseudoInput);
    if (existingUser) {
      if (existingUser.password === passwordInput) {
        setUser(existingUser);
        setView('home');
      } else {
        alert('Mot de passe incorrect');
      }
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      pseudo: pseudoInput,
      password: passwordInput,
      level: levelInput,
      points: 0,
      fuel: INITIAL_FUEL,
      vehicleOwned: false,
      vehicleType: 'none',
      vehicleModel: 'Aucun',
      answeredQuestions: {},
      ownedItems: [],
      customize: {
        paintColor: '#ffffff', paintFinish: 'glossy', wheelType: 'standard',
        hasBullbar: false, hasSpoiler: false, hasRunningBoard: false, hasVisor: false,
        hasBeacons: false, hasLightBar: false, hasXenon: false,
        hasTuningBumper: false, hasNeonKit: false, hasWideBodyKit: false, hasHood: false, hasExhaust: false,
        cabinStripe: null, cabinSticker: null, trailerColor: '#ffffff', trailerLogo: null
      },
      completedChapters: []
    };
    await upsertUser(newUser);
    setUser(newUser);
    setView('home');
  };

  const handleLevelSelect = (level: string) => { setSelectedLevel(level); setView('subjects'); };
  const handleSubjectSelect = (subject: string) => { setSelectedSubject(subject); setView('chapters'); };

  const handleChapterSelect = (chapterTitle: string) => {
    setSelectedChapter(chapterTitle);
    const now = Date.now();
    const chapterQuestions = questions.filter(q => 
      q.level === selectedLevel && q.subject === selectedSubject && q.chapter === chapterTitle
    );
    const available = chapterQuestions.filter(q => {
      const answeredAt = user?.answeredQuestions[q.id];
      if (!answeredAt || typeof answeredAt !== 'number') return true;
      return (now - answeredAt) >= COOLDOWN_MS;
    });

    setCurrentQuestions(shuffleArray(available));
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setView('quiz');
  };

  const handleAnswer = (optionIndex: number) => {
    if (!user) return;
    const question = currentQuestions[currentQuestionIndex];
    const correct = optionIndex === question.correct;
    setIsCorrect(correct);
    setShowResult(true);

    const updatedAnswered = { ...user.answeredQuestions, [question.id]: Date.now() };

    if (correct) {
      setQuizScore(prev => prev + 1);
      setUser(prev => prev ? ({
        ...prev,
        fuel: Math.min(prev.fuel + FUEL_PER_CORRECT_ANSWER, MAX_FUEL),
        points: Math.min(prev.points + POINTS_PER_CORRECT_ANSWER, MAX_POINTS),
        answeredQuestions: updatedAnswered
      }) : null);
    } else {
      setUser(prev => prev ? ({ ...prev, answeredQuestions: updatedAnswered }) : null);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setIsCorrect(null);
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleProfAccess = () => {
    if (profCodeInput === '021285') {
      setIsProfAuthenticated(true);
    } else {
      alert('Code incorrect');
    }
  };

  const goBack = () => {
    switch (view) {
      case 'levels': setView('home'); break;
      case 'subjects': setView('levels'); break;
      case 'chapters': setView('subjects'); break;
      case 'quiz': setView('chapters'); break;
      case 'prof': setView(user ? 'home' : 'identification'); break;
      default: setView('home');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {view !== 'identification' && view !== 'home' && (
              <button onClick={goBack} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(user ? 'home' : 'identification')}>
              <Truck className="text-emerald-500 w-7 h-7" />
              <h1 className="text-lg font-bold text-white uppercase italic">RouteMaster <span className="text-emerald-500">CRM</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
                  <Fuel className="text-orange-500 w-3.5 h-3.5" />
                  <span className="text-xs font-mono font-bold text-white">{user.fuel}L</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
                  <Trophy className="text-yellow-500 w-3.5 h-3.5" />
                  <span className="text-xs font-mono font-bold text-white">{user.points} pts</span>
                </div>
              </div>
            )}
            <button onClick={() => setView('prof')} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-24 pt-4">
        {view === 'identification' && (
          <div className="flex flex-col items-center justify-center py-12 gap-6 text-center max-w-sm mx-auto">
            <Truck className="w-24 h-24 text-emerald-500" />
            <h2 className="text-3xl font-black text-white uppercase italic">Identification</h2>
            <input type="text" placeholder="Votre Pseudo" value={pseudoInput} onChange={e => setPseudoInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white" />
            <input type="password" placeholder="Mot de passe" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white" />
            <select value={levelInput} onChange={e => setLevelInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white">
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={handleLogin} className="w-full py-3.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400">CONNEXION</button>
          </div>
        )}

        {view === 'home' && (
          <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
            <Truck className="w-24 h-24 text-emerald-500" />
            <h2 className="text-3xl font-black text-white uppercase italic">Prêt pour la route ?</h2>
            <button onClick={() => setView('levels')} className="px-8 py-4 bg-emerald-500 text-black font-bold text-lg rounded-xl hover:bg-emerald-400">
              COMMENCER LA FORMATION <ChevronRight className="inline ml-1" />
            </button>
          </div>
        )}

        {view === 'levels' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Choisissez votre niveau</h2>
            {LEVELS.map(level => (
              <button key={level} onClick={() => handleLevelSelect(level)} className="w-full flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-emerald-500 transition-all text-white font-bold text-lg">
                {level} <ChevronRight className="text-zinc-600" />
              </button>
            ))}
          </div>
        )}

        {view === 'subjects' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Matières ({selectedLevel})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(new Set(chapters.filter(c => c.level === selectedLevel).map(c => c.subject))).map(subject => (
                <button key={subject} onClick={() => handleSubjectSelect(subject)} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-emerald-500 text-left font-bold text-lg text-white">
                  {subjectNames[subject] || subject}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'chapters' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Chapitres</h2>
            <div className="space-y-3">
              {chapters.filter(c => c.level === selectedLevel && c.subject === selectedSubject && (chapterDocs[getChapterKey(c)]?.isVisible !== false)).map(c => {
                const doc = chapterDocs[getChapterKey(c)]?.docUrl;
                return (
                  <div key={c.title} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-850">
                    <button onClick={() => handleChapterSelect(c.title)} className="text-left flex-1 font-medium text-white">
                      {c.title}
                    </button>
                    {doc && (
                      <button 
                        onClick={() => setPdfViewer({ title: c.title, url: doc + '#toolbar=0&navpanes=0&scrollbar=0' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold mr-3"
                      >
                        <FileText className="w-4 h-4" /> Consulter le cours
                      </button>
                    )}
                    <ChevronRight className="text-zinc-600 w-5 h-5 cursor-pointer" onClick={() => handleChapterSelect(c.title)} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ESPACE PROFESSEUR */}
        {view === 'prof' && (
          <div className="space-y-6">
            {!isProfAuthenticated ? (
              <div className="flex flex-col items-center py-16 gap-4 text-center max-w-xs mx-auto">
                <Lock className="w-12 h-12 text-zinc-600" />
                <h2 className="text-xl font-bold text-white">Accès Professeur</h2>
                <input type="password" maxLength={6} placeholder="••••••" value={profCodeInput} onChange={e => setProfCodeInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center text-xl text-white tracking-widest" />
                <button onClick={handleProfAccess} className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl">DÉVERROUILLER</button>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Espace Professeur</h2>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white">Gestion des Chapitres</h3>
                  <div className="divide-y divide-zinc-800">
                    {chapters.map(c => {
                      const key = getChapterKey(c);
                      const isVis = chapterDocs[key]?.isVisible ?? true;
                      const hasDoc = !!chapterDocs[key]?.docUrl;
                      const isRenaming = renamingTitle === c.title;

                      return (
                        <div key={c.title} className="py-3 flex items-center justify-between gap-2">
                          <div className="flex-1">
                            {isRenaming ? (
                              <div className="flex items-center gap-2">
                                <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)} className="bg-zinc-800 border border-emerald-500 px-3 py-1 text-white rounded-lg text-sm" autoFocus />
                                <button onClick={() => handleRenameChapter(c, renameValue)} className="p-1 bg-emerald-500 text-black rounded"><Save className="w-4 h-4" /></button>
                                <button onClick={() => setRenamingTitle(null)} className="p-1 bg-zinc-700 text-white rounded"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-white font-medium text-sm md:text-base">{c.title}</p>
                                <p className="text-zinc-500 text-[11px] uppercase tracking-wider">{c.level} • {c.subject}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => toggleChapterVisibility(c)}
                              className={'p-2 rounded-lg transition-colors ' + (isVis ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-600 hover:bg-zinc-800')}
                              title={isVis ? "Visible (cliquer pour masquer)" : "Masqué (cliquer pour publier)"}
                            >
                              {isVis ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            <label 
                              className={'p-2 rounded-lg cursor-pointer transition-colors ' + (hasDoc ? 'text-blue-400 hover:bg-blue-500/10' : 'text-zinc-500 hover:bg-zinc-800')}
                              title={hasDoc ? "Document joint (cliquer pour remplacer)" : "Joindre un PDF"}
                            >
                              {uploadingTitle === c.title ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Paperclip className="w-4 h-4" />}
                              <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPDF(c, f); }} />
                            </label>

                            <button 
                              onClick={() => { setRenamingTitle(c.title); setRenameValue(c.title); }}
                              className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg"
                              title="Renommer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={() => setChapters(prev => prev.filter(ch => ch.title !== c.title))}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'quiz' && currentQuestions.length > 0 && (
          <div className="space-y-6">
            {!quizFinished ? (
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
                <h3 className="text-xl font-bold text-white">{currentQuestions[currentQuestionIndex].text}</h3>
                <div className="space-y-3">
                  {currentQuestions[currentQuestionIndex].options.map((opt, idx) => (
                    <button 
                      key={idx} 
                      disabled={showResult} 
                      onClick={() => handleAnswer(idx)}
                      className={'w-full p-4 rounded-xl text-left border ' + (showResult ? (idx === currentQuestions[currentQuestionIndex].correct ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-800 text-zinc-600') : 'border-zinc-700 bg-zinc-800 text-white hover:border-emerald-500')}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {showResult && (
                  <button onClick={nextQuestion} className="w-full py-3.5 bg-emerald-500 text-black font-bold rounded-xl">
                    {currentQuestionIndex + 1 === currentQuestions.length ? 'TERMINER' : 'SUIVANT'}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Score : {quizScore} / {currentQuestions.length}</h2>
                <button onClick={() => setView('chapters')} className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl">RETOUR</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* LISEUSE PDF SÉCURISÉE */}
      {pdfViewer && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col p-3 md:p-6" onClick={() => setPdfViewer(null)}>
          <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-t-2xl max-w-5xl w-full mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-white font-bold">
              <FileText className="text-emerald-500" /> {pdfViewer.title}
            </div>
            <button onClick={() => setPdfViewer(null)} className="p-1 text-zinc-400 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 bg-zinc-900 border-x border-b border-zinc-800 rounded-b-2xl overflow-hidden max-w-5xl w-full mx-auto" onClick={e => e.stopPropagation()}>
            <iframe src={pdfViewer.url} className="w-full h-full border-0 select-none" onContextMenu={e => e.preventDefault()} />
          </div>
        </div>
      )}

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 p-3 flex justify-around z-50">
          <button onClick={() => setView('home')} className={'p-2 ' + (view === 'home' ? 'text-emerald-500' : 'text-zinc-500')}><Home className="w-6 h-6" /></button>
          <button onClick={() => setView('levels')} className={'p-2 ' + (['levels', 'subjects', 'chapters', 'quiz'].includes(view) ? 'text-emerald-500' : 'text-zinc-500')}><GraduationCap className="w-6 h-6" /></button>
          <button onClick={() => setView('prof')} className={'p-2 ' + (view === 'prof' ? 'text-emerald-500' : 'text-zinc-500')}><Settings className="w-6 h-6" /></button>
        </nav>
      )}
    </div>
  );
}
