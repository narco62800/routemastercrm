import React, { useState, useEffect } from 'react';
import { 
  Truck, BookOpen, Settings, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, Fuel, Trophy, User as UserIcon,
  Home, GraduationCap, Edit3, Save, ShoppingBag, ListOrdered,
  Plus, Trash2, Lock, Unlock, Share2, QrCode, LogOut, Download,
  Sparkles, AlertTriangle
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, Chapter, User } from '../types';
import { ALL_QUESTIONS, INITIAL_CHAPTERS, INITIAL_SUBJECT_NAMES } from '../data/index';
import { FUEL_PER_CORRECT_ANSWER, INITIAL_FUEL, MAX_FUEL } from '../constants';

const LEVELS = ['2ndes CRM', '1ères CRM', 'Terminales CRM'];
const QUESTIONS_VERSION = 'v1';

const SHOP_ITEMS = [
  { id: 'veh_car',        name: 'Voiture de Tourisme',  price: 1000,  type: 'vehicle',   vehicleType: 'car',         color: undefined },
  { id: 'veh_truck',      name: 'Porteur (Camion)',      price: 5000,  type: 'vehicle',   vehicleType: 'truck',       color: undefined },
  { id: 'veh_articulated',name: 'Ensemble Articulé',     price: 15000, type: 'vehicle',   vehicleType: 'articulated', color: undefined },
  { id: 'paint_red',      name: 'Peinture Rouge',        price: 500,   type: 'paint',     vehicleType: undefined,     color: '#ff0000' },
  { id: 'paint_blue',     name: 'Peinture Bleue',        price: 500,   type: 'paint',     vehicleType: undefined,     color: '#0000ff' },
  { id: 'paint_gold',     name: 'Peinture Or',           price: 2000,  type: 'paint',     vehicleType: undefined,     color: '#ffd700' },
  { id: 'beacons',        name: 'Gyrophares',            price: 1500,  type: 'accessory', vehicleType: undefined,     color: undefined },
  { id: 'bullbar',        name: 'Pare-buffle',           price: 1200,  type: 'accessory', vehicleType: undefined,     color: undefined },
  { id: 'lightbar',       name: 'Rampe de phares',       price: 1800,  type: 'accessory', vehicleType: undefined,     color: undefined },
];

type ViewType = 'identification'|'home'|'levels'|'subjects'|'chapters'|'quiz'|'prof'|'ranking'|'shop';

export default function RouteMaster() {
  const [view, setView] = useState<ViewType>(() =>
    (sessionStorage.getItem('routemaster_view') as ViewType) || 'identification'
  );
  const [selectedLevel,   setSelectedLevel]   = useState<string|null>(() => sessionStorage.getItem('routemaster_selected_level'));
  const [selectedSubject, setSelectedSubject] = useState<string|null>(() => sessionStorage.getItem('routemaster_selected_subject'));
  const [selectedChapter, setSelectedChapter] = useState<string|null>(() => sessionStorage.getItem('routemaster_selected_chapter'));

  const [subjectNames, setSubjectNames] = useState<Record<string,string>>(() => {
    const s = localStorage.getItem('routemaster_subject_names');
    return s ? JSON.parse(s) : INITIAL_SUBJECT_NAMES;
  });
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const s = localStorage.getItem('routemaster_chapters_v3');
    return s ? JSON.parse(s) : INITIAL_CHAPTERS;
  });
  const [questions, setQuestions] = useState<Question[]>(() => {
    const ver = localStorage.getItem('routemaster_questions_ver');
    if (ver === QUESTIONS_VERSION) {
      const s = localStorage.getItem('routemaster_questions_v3');
      if (s) return JSON.parse(s);
    }
    localStorage.setItem('routemaster_questions_ver', QUESTIONS_VERSION);
    return ALL_QUESTIONS;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const s = localStorage.getItem('routemaster_users');
    return s ? JSON.parse(s) : [];
  });
  const [user, setUser] = useState<User|null>(() => {
    const s = localStorage.getItem('routemaster_user');
    return s ? JSON.parse(s) : null;
  });

  useEffect(() => { localStorage.setItem('routemaster_chapters_v3',    JSON.stringify(chapters)); },     [chapters]);
  useEffect(() => { localStorage.setItem('routemaster_questions_v3',   JSON.stringify(questions)); },    [questions]);
  useEffect(() => { localStorage.setItem('routemaster_subject_names',  JSON.stringify(subjectNames)); }, [subjectNames]);
  useEffect(() => { localStorage.setItem('routemaster_users',          JSON.stringify(users)); },        [users]);
  useEffect(() => { if (user) localStorage.setItem('routemaster_user', JSON.stringify(user)); },         [user]);
  useEffect(() => { sessionStorage.setItem('routemaster_view', view); }, [view]);
  useEffect(() => { selectedLevel   ? sessionStorage.setItem('routemaster_selected_level',   selectedLevel)   : sessionStorage.removeItem('routemaster_selected_level');   }, [selectedLevel]);
  useEffect(() => { selectedSubject ? sessionStorage.setItem('routemaster_selected_subject', selectedSubject) : sessionStorage.removeItem('routemaster_selected_subject'); }, [selectedSubject]);
  useEffect(() => { selectedChapter ? sessionStorage.setItem('routemaster_selected_chapter', selectedChapter) : sessionStorage.removeItem('routemaster_selected_chapter'); }, [selectedChapter]);
  useEffect(() => { if (user && view === 'identification') setView('home'); }, [user, view]);
  useEffect(() => {
    if (user) setUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      return exists ? prev.map(u => u.id === user.id ? user : u) : [...prev, user];
    });
  }, [user]);

  const [pseudoInput,   setPseudoInput]   = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [levelInput,    setLevelInput]    = useState('2ndes CRM');
  const [profCodeInput, setProfCodeInput] = useState('');
  const [isProfAuthenticated, setIsProfAuthenticated] = useState(() =>
    sessionStorage.getItem('routemaster_prof_auth') === 'true'
  );

  const [currentQuestions,     setCurrentQuestions]     = useState<Question[]>(() => { const s = sessionStorage.getItem('routemaster_current_questions'); return s ? JSON.parse(s) : []; });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => { const s = sessionStorage.getItem('routemaster_quiz_index'); return s ? parseInt(s) : 0; });
  const [showResult,     setShowResult]     = useState(false);
  const [isCorrect,      setIsCorrect]      = useState<boolean|null>(null);
  const [selectedOption, setSelectedOption] = useState<number|null>(null);
  const [quizFinished, setQuizFinished] = useState(() => sessionStorage.getItem('routemaster_quiz_finished') === 'true');
  const [quizScore,    setQuizScore]    = useState(() => { const s = sessionStorage.getItem('routemaster_quiz_score'); return s ? parseInt(s) : 0; });
  useEffect(() => { sessionStorage.setItem('routemaster_current_questions', JSON.stringify(currentQuestions)); }, [currentQuestions]);
  useEffect(() => { sessionStorage.setItem('routemaster_quiz_index',        currentQuestionIndex.toString()); }, [currentQuestionIndex]);
  useEffect(() => { sessionStorage.setItem('routemaster_quiz_finished',     quizFinished.toString()); }, [quizFinished]);
  useEffect(() => { sessionStorage.setItem('routemaster_quiz_score',        quizScore.toString()); }, [quizScore]);

  const [aiExplanation, setAiExplanation] = useState<string|null>(null);
  const [isLoadingAI,   setIsLoadingAI]   = useState(false);

  const [editingSubject, setEditingSubject] = useState<string|null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [profTab, setProfTab] = useState<'subjects'|'chapters'|'questions'|'share'|'users'>(() =>
    (sessionStorage.getItem('routemaster_prof_tab') as 'subjects'|'chapters'|'questions'|'share'|'users') || 'subjects'
  );
  const [newChapter, setNewChapter] = useState(() => {
    const s = sessionStorage.getItem('routemaster_new_chapter');
    return s ? JSON.parse(s) : { level: '2ndes CRM', subject: 'ETG', title: '' };
  });
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>(() => {
    const s = sessionStorage.getItem('routemaster_new_question');
    return s ? JSON.parse(s) : { type: 'qcm', level: '2ndes CRM', subject: 'ETG', chapter: '', text: '', options: ['','','',''], correct: 0, explanation: '' };
  });
  useEffect(() => { sessionStorage.setItem('routemaster_new_chapter',  JSON.stringify(newChapter)); },  [newChapter]);
  useEffect(() => { sessionStorage.setItem('routemaster_new_question', JSON.stringify(newQuestion)); }, [newQuestion]);

  const [shareUrl,             setShareUrl]             = useState(window.location.origin);
  const [shortUrl,             setShortUrl]             = useState('');
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false);
  const [copySuccess,          setCopySuccess]          = useState(false);

  // Handlers
  const handleLogin = () => {
    if (!pseudoInput.trim() || !passwordInput.trim()) return;
    const existing = users.find(u => u.pseudo === pseudoInput);
    if (existing) {
      if (existing.password === passwordInput) { setUser(existing); setView('home'); return; }
      alert('Mot de passe incorrect'); return;
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9), pseudo: pseudoInput, password: passwordInput, level: levelInput,
      points: 0, fuel: INITIAL_FUEL, vehicleOwned: false, vehicleType: 'none', vehicleModel: 'Aucun',
      answeredQuestions: {}, ownedItems: [],
      customize: { paintColor: '#ffffff', paintFinish: 'glossy', wheelType: 'standard', hasBullbar: false, hasSpoiler: false, hasRunningBoard: false, hasVisor: false, hasBeacons: false, hasLightBar: false, hasXenon: false, cabinStripe: null, cabinSticker: null, trailerColor: '#ffffff', trailerLogo: null },
      completedChapters: []
    };
    setUser(newUser); setView('home');
  };

  const handleLevelSelect   = (level: string)  => { setSelectedLevel(level);     setView('subjects'); };
  const handleSubjectSelect = (subject: string) => { setSelectedSubject(subject); setView('chapters'); };
  const handleChapterSelect = (chapterTitle: string) => {
    setSelectedChapter(chapterTitle);
    setCurrentQuestions(questions.filter(q => q.level === selectedLevel && q.subject === selectedSubject && q.chapter === chapterTitle));
    setCurrentQuestionIndex(0); setQuizScore(0); setQuizFinished(false); setAiExplanation(null); setSelectedOption(null);
    setView('quiz');
  };

  const handleAnswer = (optionIndex: number) => {
    if (!user) return;
    const question = currentQuestions[currentQuestionIndex];
    const correct  = optionIndex === question.correct;
    setIsCorrect(correct); setShowResult(true); setAiExplanation(null); setSelectedOption(optionIndex);
    setUser(prev => prev ? ({
      ...prev,
      fuel:   correct ? Math.min(prev.fuel + FUEL_PER_CORRECT_ANSWER, MAX_FUEL) : prev.fuel,
      points: correct ? prev.points + 10 : prev.points,
      answeredQuestions: { ...prev.answeredQuestions, [question.id]: (prev.answeredQuestions[question.id] ?? 0) + 1 }
    }) : null);
    if (correct) setQuizScore(prev => prev + 1);
  };

  const nextQuestion = () => {
    setShowResult(false); setIsCorrect(null); setAiExplanation(null); setSelectedOption(null);
    currentQuestionIndex + 1 < currentQuestions.length ? setCurrentQuestionIndex(prev => prev + 1) : setQuizFinished(true);
  };

  const handleAskAI = async () => {
    const question = currentQuestions[currentQuestionIndex];
    if (!question) return;
    setIsLoadingAI(true); setAiExplanation(null);
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Tu es un formateur expert en transport routier pour des élèves de Bac Pro CRM (Conducteur Routier de Marchandises) en France.
Un élève vient de se tromper à cette question. Explique-lui de façon claire, précise et pédagogique pourquoi la bonne réponse est "${question.options[question.correct]}".

Question : ${question.text}
Options proposées : ${question.options.map((o, i) => `${i + 1}. ${o}`).join(' | ')}
Bonne réponse : ${question.options[question.correct]}
Explication fournie : ${question.explanation || 'Aucune'}

Réponds en 3 à 5 phrases. Vocabulaire adapté à un lycéen. Si applicable, cite le règlement ou article concerné (EU 561/2006, Code de la route, RSE, etc.). Ne répète pas la question.`
      });
      setAiExplanation(response.text ?? 'Aucune explication générée.');
    } catch (err) {
      console.error('Gemini error:', err);
      setAiExplanation("⚠️ Impossible de contacter l'IA. Vérifiez que la clé API Gemini est configurée (VITE_GEMINI_API_KEY).");
    } finally { setIsLoadingAI(false); }
  };

  const handleRenameSubject = (subjectKey: string) => { setSubjectNames(prev => ({ ...prev, [subjectKey]: newSubjectName })); setEditingSubject(null); };
  const handleAddChapter    = () => { if (!newChapter.title.trim()) return; setChapters(prev => [...prev, { ...newChapter }]); setNewChapter({ ...newChapter, title: '' }); };
  const handleDeleteChapter  = (chapter: Chapter) => setChapters(prev => prev.filter(c => !(c.title === chapter.title && c.level === chapter.level && c.subject === chapter.subject)));
  const handleAddQuestion    = () => { if (!newQuestion.text?.trim()) return; const q: Question = { ...newQuestion as Question, id: Math.random().toString(36).substr(2, 9) }; setQuestions(prev => [...prev, q]); setNewQuestion({ ...newQuestion, text: '', options: ['','','',''], explanation: '' }); };
  const handleDeleteQuestion = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id));
  const handleDeleteUser     = (userId: string) => { if (!window.confirm('Supprimer cet utilisateur ?')) return; setUsers(prev => prev.filter(u => u.id !== userId)); if (user?.id === userId) { setUser(null); setView('identification'); } };

  const handleBuyItem = (item: typeof SHOP_ITEMS[0]) => {
    if (!user || user.points < item.price || user.ownedItems.includes(item.id)) return;
    setUser(prev => {
      if (!prev) return null;
      const updates: Partial<User> = { points: prev.points - item.price, ownedItems: [...prev.ownedItems, item.id] };
      if (item.type === 'vehicle') { updates.vehicleOwned = true; updates.vehicleType = item.vehicleType!; updates.vehicleModel = item.name; }
      if (item.type === 'paint' && item.color) updates.customize = { ...prev.customize, paintColor: item.color };
      if (item.id === 'beacons')  updates.customize = { ...(updates.customize || prev.customize), hasBeacons: true };
      if (item.id === 'bullbar')  updates.customize = { ...(updates.customize || prev.customize), hasBullbar: true };
      if (item.id === 'lightbar') updates.customize = { ...(updates.customize || prev.customize), hasLightBar: true };
      return { ...prev, ...updates };
    });
  };

  const handleProfAccess = () => {
    if (profCodeInput === '021285') {
      setIsProfAuthenticated(true); sessionStorage.setItem('routemaster_prof_auth', 'true');
    } else { alert('Code incorrect'); }
  };

  const goBack = () => {
    switch (view) {
      case 'levels':   setView('home'); break;
      case 'subjects': setView('levels'); break;
      case 'chapters': setView('subjects'); break;
      case 'quiz':     setView('chapters'); break;
      case 'shop':     setView('home'); break;
      case 'ranking':  setView('home'); break;
      case 'prof':     setView(user ? 'home' : 'identification'); setIsProfAuthenticated(false); setProfCodeInput(''); sessionStorage.removeItem('routemaster_prof_auth'); break;
      default:         setView('home');
    }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }
    catch { alert('Copiez manuellement : ' + shareUrl); }
  };
  const handleNativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'RouteMaster CRM 2026', text: "Entraîne-toi pour le Bac Pro CRM !", url: shareUrl }); }
      catch { /* cancelled */ }
    } else { handleCopy(); }
  };
  const handleGenerateShortUrl = async () => {
    if (isGeneratingShortUrl) return;
    setIsGeneratingShortUrl(true);
    try {
      const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://is.gd/create.php?format=json&url=${encodeURIComponent(shareUrl)}`)}`);
      if (!r.ok) throw new Error();
      const d = await r.json(); const p = JSON.parse(d.contents);
      if (p.shorturl) { setShortUrl(p.shorturl); return; }
      throw new Error();
    } catch {
      try {
        const r2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(shareUrl)}`)}`);
        const d2 = await r2.json();
        if (d2.contents?.startsWith('http')) { setShortUrl(d2.contents); return; }
        throw new Error();
      } catch { alert('Impossible de générer un lien court. Copiez le lien complet.'); }
    } finally { setIsGeneratingShortUrl(false); }
  };

  // Views
  const IdentificationView = () => (
    <div className="flex flex-col items-center justify-center py-8 md:py-12 gap-6 md:gap-8 text-center min-h-[80vh] px-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
        <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full" />
        <Truck className="w-24 h-24 md:w-32 md:h-32 text-primary relative" />
      </motion.div>
      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-black text-card-foreground uppercase italic tracking-tight">Identification</h2>
        <p className="text-muted-foreground text-sm md:text-base">Créez ou connectez-vous à votre profil.</p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <input type="text" placeholder="Votre Pseudo" value={pseudoInput} onChange={e => setPseudoInput(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-card-foreground focus:outline-none focus:border-primary transition-colors text-sm md:text-base" />
        <input type="password" placeholder="Mot de passe" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-card-foreground focus:outline-none focus:border-primary transition-colors text-sm md:text-base" />
        <div className="space-y-1 text-left">
          <label className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase ml-1">Votre Classe</label>
          <select value={levelInput} onChange={e => setLevelInput(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-card-foreground focus:outline-none focus:border-primary transition-colors text-sm md:text-base">
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button onClick={handleLogin}
          className="w-full py-3 md:py-4 bg-primary text-primary-foreground font-bold text-lg md:text-xl rounded-xl hover:opacity-90 transition-all glow-primary">
          SE CONNECTER / S'INSCRIRE
        </button>
        <div className="pt-4">
          <button onClick={() => setView('prof')}
            className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto">
            <Settings className="w-4 h-4" /> Accès Professeur
          </button>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-card border-b border-border p-3 md:p-4 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2">
            {view !== 'identification' && view !== 'home' && (
              <button onClick={goBack} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-card-foreground">
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(user ? 'home' : 'identification')}>
              <Truck className="text-primary w-6 h-6 md:w-8 md:h-8" />
              <h1 className="text-lg md:text-xl font-bold tracking-tighter text-card-foreground uppercase italic">RouteMaster <span className="text-primary">CRM</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user && view === 'identification' && <button onClick={() => setView('prof')} className="p-2 hover:bg-secondary rounded-full text-muted-foreground sm:hidden"><Settings className="w-5 h-5" /></button>}
            {user && (
              <div className="flex sm:hidden items-center gap-2">
                <button onClick={() => setView('prof')} className="p-2 hover:bg-secondary rounded-full text-muted-foreground"><Settings className="w-5 h-5" /></button>
                <button onClick={() => { setUser(null); setView('identification'); }} className="p-2 hover:bg-secondary rounded-full text-muted-foreground"><LogOut className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-secondary px-2 md:px-3 py-1 rounded-full border border-border">
                <Fuel className="text-fuel w-3.5 h-3.5" />
                <span className="text-xs md:text-sm font-mono font-bold text-card-foreground">{user.fuel}L</span>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary px-2 md:px-3 py-1 rounded-full border border-border">
                <Trophy className="text-trophy w-3.5 h-3.5" />
                <span className="text-xs md:text-sm font-mono font-bold text-card-foreground">{user.points} pts</span>
              </div>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => setView('prof')} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-card-foreground" title="Espace Prof"><Settings className="w-5 h-5" /></button>
            {user && <button onClick={() => { setUser(null); setView('identification'); }} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-destructive" title="Déconnexion"><LogOut className="w-5 h-5" /></button>}
          </div>
        </div>
      </div>
    </header>
  );

  const HomeView = () => (
    <div className="flex flex-col items-center justify-center py-6 md:py-12 gap-6 md:gap-8 text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
        <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full" />
        <Truck className="w-24 h-24 md:w-32 md:h-32 text-primary relative" />
      </motion.div>
      <div className="space-y-2 px-4">
        <h2 className="text-3xl md:text-4xl font-black text-card-foreground uppercase italic tracking-tight leading-tight">Prêt pour la route ?</h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">Entraînez-vous pour votre Bac Pro CRM avec nos fiches et questions interactives.</p>
      </div>
      <button onClick={() => setView('levels')}
        className="group relative px-6 md:px-8 py-3 md:py-4 bg-primary text-primary-foreground font-bold text-lg md:text-xl rounded-xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 glow-primary">
        COMMENCER LA FORMATION <ChevronRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mt-8 md:mt-12">
        {[
          { icon: BookOpen,      title: "Fiches Orales",  desc: "12 fiches complètes" },
          { icon: GraduationCap, title: "Code ETG",       desc: "Permis B & Lourd" },
          { icon: Edit3,         title: "Fiches Écrites", desc: "Plateau C & CE" }
        ].map((item, i) => (
          <div key={i} className="bg-card/50 border border-border p-5 md:p-6 rounded-2xl hover:border-primary/50 transition-colors text-left sm:text-center">
            <item.icon className="w-6 h-6 md:w-8 md:h-8 text-primary mb-3 md:mb-4 mx-0 sm:mx-auto" />
            <h3 className="text-card-foreground font-bold text-base md:text-lg">{item.title}</h3>
            <p className="text-muted-foreground text-xs md:text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const LevelsView = () => (
    <div className="space-y-6 md:space-y-8 py-4 md:py-8">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={() => setView('home')} className="p-2 hover:bg-secondary rounded-full text-muted-foreground"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
        <h2 className="text-xl md:text-2xl font-bold text-card-foreground">Choisissez votre niveau</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {LEVELS.map(level => (
          <button key={level} onClick={() => handleLevelSelect(level)}
            className="flex items-center justify-between p-4 md:p-6 bg-card border border-border rounded-xl md:rounded-2xl hover:border-primary transition-all group">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center text-primary font-bold text-lg md:text-xl">{level.charAt(0)}</div>
              <span className="text-lg md:text-xl font-bold text-card-foreground">{level}</span>
            </div>
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );

  const SubjectsView = () => {
    const subjects: string[] = Array.from(new Set(chapters.filter(c => c.level === selectedLevel).map(c => c.subject)));
    return (
      <div className="space-y-6 md:space-y-8 py-4 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setView('levels')} className="p-2 hover:bg-secondary rounded-full text-muted-foreground"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
          <div>
            <p className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest">{selectedLevel}</p>
            <h2 className="text-xl md:text-2xl font-bold text-card-foreground">Matières disponibles</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {subjects.map(subject => (
            <button key={subject} onClick={() => handleSubjectSelect(subject)}
              className="p-4 md:p-6 bg-card border border-border rounded-xl md:rounded-2xl hover:border-primary transition-all text-left group">
              <h3 className="text-lg md:text-xl font-bold text-card-foreground mb-1 md:mb-2">{subjectNames[subject] || subject}</h3>
              <p className="text-muted-foreground text-xs md:text-sm">{chapters.filter(c => c.level === selectedLevel && c.subject === subject).length} chapitres</p>
              <div className="mt-3 md:mt-4 flex justify-end">
                <span className="text-primary text-xs md:text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Explorer <ChevronRight className="w-4 h-4" /></span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const ChaptersView = () => {
    const currentChapters = chapters.filter(c => c.level === selectedLevel && c.subject === selectedSubject);
    return (
      <div className="space-y-6 md:space-y-8 py-4 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setView('subjects')} className="p-2 hover:bg-secondary rounded-full text-muted-foreground"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
          <div>
            <p className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest">{selectedLevel} • {subjectNames[selectedSubject!] || selectedSubject}</p>
            <h2 className="text-xl md:text-2xl font-bold text-card-foreground">Chapitres</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:gap-3">
          {currentChapters.map(chapter => (
            <button key={chapter.title} onClick={() => handleChapterSelect(chapter.title)}
              className="flex items-center justify-between p-3 md:p-4 bg-card/50 border border-border rounded-xl hover:bg-secondary transition-colors text-left">
              <span className="text-card-foreground font-medium text-sm md:text-base">{chapter.title}</span>
              <ChevronRight className="text-muted-foreground w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const QuizView = () => {
    if (currentQuestions.length === 0) return (
      <div className="py-20 text-center space-y-4">
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto" />
        <h3 className="text-xl font-bold text-card-foreground">Aucune question disponible</h3>
        <p className="text-muted-foreground">Ce chapitre n'a pas encore de questions.</p>
        <button onClick={() => setView('chapters')} className="text-primary font-bold">Retour</button>
      </div>
    );

    if (quizFinished) return (
      <div className="py-12 text-center space-y-8">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-card-foreground uppercase italic">Session Terminée !</h2>
          <p className="text-muted-foreground">Score : <span className="text-primary font-bold">{quizScore} / {currentQuestions.length}</span></p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl max-w-sm mx-auto">
          <div className="flex justify-between items-center mb-4"><span className="text-muted-foreground">Gazole gagné</span><span className="text-fuel font-bold">+{quizScore * FUEL_PER_CORRECT_ANSWER}L</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Points gagnés</span><span className="text-trophy font-bold">+{quizScore * 10} pts</span></div>
        </div>
        <button onClick={() => setView('chapters')} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all">RETOUR AUX CHAPITRES</button>
      </div>
    );

    const question = currentQuestions[currentQuestionIndex];
    return (
      <div className="max-w-2xl mx-auto py-4 md:py-8 space-y-6 md:space-y-8">
        <div className="flex justify-between items-center px-2">
          <span className="text-muted-foreground text-[10px] md:text-sm font-mono uppercase tracking-wider">QUESTION {currentQuestionIndex + 1} / {currentQuestions.length}</span>
          <div className="w-24 md:w-32 h-1.5 md:h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }} />
          </div>
        </div>
        <div className="bg-card border border-border p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl">
          <h3 className="text-lg md:text-2xl font-bold text-card-foreground mb-6 md:mb-8 leading-tight">{question.text}</h3>
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, idx) => (
              <button key={idx} disabled={showResult} onClick={() => handleAnswer(idx)}
                className={`p-3 md:p-4 rounded-xl text-left border transition-all flex justify-between items-center text-sm md:text-base ${
                  showResult
                    ? idx === question.correct
                      ? 'bg-primary/20 border-primary text-primary'
                      : idx === selectedOption
                        ? 'bg-destructive/20 border-destructive text-destructive'
                        : 'bg-secondary/50 border-border text-muted-foreground'
                    : 'bg-secondary border-border text-card-foreground hover:border-primary hover:bg-secondary/80'
                }`}>
                <span className="flex-1">{option}</span>
                {showResult && idx === question.correct && <CheckCircle2 className="w-5 h-5 ml-2 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className={`p-5 md:p-6 rounded-2xl border ${isCorrect ? 'bg-primary/10 border-primary/50' : 'bg-destructive/10 border-destructive/50'}`}>
              <div className="flex items-center gap-3 mb-2">
                {isCorrect ? <CheckCircle2 className="text-primary" /> : <XCircle className="text-destructive" />}
                <span className={`font-bold text-sm md:text-base ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
                  {isCorrect ? 'Excellent !' : 'Oups, pas tout à fait...'}
                </span>
              </div>
              <p className="text-foreground text-xs md:text-sm mb-4 leading-relaxed">{question.explanation}</p>

              {!isCorrect && (
                <div className="mb-4">
                  {aiExplanation ? (
                    <div className="bg-card border border-ai-purple/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-ai-purple flex-shrink-0" />
                        <span className="text-ai-purple font-bold text-xs uppercase tracking-wider">Explication IA Gemini</span>
                      </div>
                      <p className="text-foreground text-xs md:text-sm leading-relaxed">{aiExplanation}</p>
                    </div>
                  ) : (
                    <button onClick={handleAskAI} disabled={isLoadingAI}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all w-full justify-center border ${
                        isLoadingAI ? 'bg-secondary text-muted-foreground border-border cursor-not-allowed' : 'bg-ai-purple/10 border-ai-purple/30 text-ai-purple hover:bg-ai-purple/20'
                      }`}>
                      {isLoadingAI
                        ? <><span className="w-4 h-4 border-2 border-ai-purple border-t-transparent rounded-full animate-spin inline-block" /> Gemini réfléchit...</>
                        : <><Sparkles className="w-4 h-4" /> Demander une explication à l'IA</>
                      }
                    </button>
                  )}
                </div>
              )}

              <button onClick={nextQuestion} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all text-sm md:text-base">
                {currentQuestionIndex + 1 === currentQuestions.length ? 'VOIR LE RÉSULTAT' : 'QUESTION SUIVANTE'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const RankingView = () => {
    const sorted = [...users].sort((a, b) => b.points - a.points);
    return (
      <div className="space-y-6 md:space-y-8 py-4 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setView('home')} className="p-2 hover:bg-secondary rounded-full text-muted-foreground"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
          <h2 className="text-xl md:text-2xl font-bold text-card-foreground">Classement Général</h2>
        </div>
        <div className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucun utilisateur enregistré.</div>
          ) : sorted.map((r, i) => (
            <div key={r.id} className={`flex items-center justify-between p-3 md:p-4 border-b border-border last:border-0 ${r.pseudo === user?.pseudo ? 'bg-primary/10' : ''}`}>
              <div className="flex items-center gap-3 md:gap-4">
                <span className={`w-6 md:w-8 text-center font-bold text-sm md:text-base ${i === 0 ? 'text-trophy' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-fuel' : 'text-muted-foreground'}`}>#{i + 1}</span>
                <div>
                  <p className="text-card-foreground font-bold text-sm md:text-base">{r.pseudo}</p>
                  <p className="text-muted-foreground text-[10px] md:text-xs">{r.level}</p>
                </div>
              </div>
              <span className="text-primary font-mono font-bold text-sm md:text-base">{r.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ShopView = () => {
    const available = SHOP_ITEMS.filter(item => !user?.vehicleOwned ? item.type === 'vehicle' : true);
    return (
      <div className="space-y-6 md:space-y-8 py-4 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setView('home')} className="p-2 hover:bg-secondary rounded-full text-muted-foreground"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
          <h2 className="text-xl md:text-2xl font-bold text-card-foreground">Boutique</h2>
        </div>
        {!user?.vehicleOwned && (
          <div className="bg-fuel/10 border border-fuel/50 p-3 md:p-4 rounded-xl text-fuel text-xs md:text-sm font-medium">
            Achetez d'abord un véhicule pour accéder aux accessoires et peintures.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map(item => {
            const owned     = user?.ownedItems.includes(item.id) ?? false;
            const canAfford = (user?.points ?? 0) >= item.price;
            return (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
                <div className="w-full aspect-video bg-secondary rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-card-foreground">{item.name}</h3>
                    <span className="text-trophy font-bold text-sm">{item.price} pts</span>
                  </div>
                  {owned && <span className="text-xs text-primary font-bold">✓ Déjà possédé</span>}
                </div>
                <button onClick={() => handleBuyItem(item)} disabled={owned || !canAfford}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    owned ? 'bg-secondary text-primary cursor-not-allowed'
                      : canAfford ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'bg-secondary text-muted-foreground cursor-not-allowed'
                  }`}>
                  {owned ? 'POSSÉDÉ' : canAfford ? 'ACHETER' : 'PTS INSUFFISANTS'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ProfView = () => {
    const subjects: string[] = Object.keys(subjectNames);
    if (!isProfAuthenticated) return (
      <div className="flex flex-col items-center justify-center py-12 md:py-24 gap-6 md:gap-8 text-center px-4">
        <Lock className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-card-foreground">Accès Restreint</h2>
          <p className="text-muted-foreground text-sm md:text-base">Entrez le code à 6 chiffres pour accéder à l'espace prof.</p>
        </div>
        <div className="flex gap-2 w-full max-w-xs justify-center">
          <input type="password" maxLength={6} placeholder="••••••" value={profCodeInput} onChange={e => setProfCodeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleProfAccess()}
            className="bg-card border border-border rounded-xl px-4 py-3 text-card-foreground text-center text-xl md:text-2xl tracking-widest focus:outline-none focus:border-primary w-32 md:w-48" />
          <button onClick={handleProfAccess} className="bg-primary text-primary-foreground p-3 md:p-4 rounded-xl hover:opacity-90 transition-colors"><Unlock className="w-5 h-5 md:w-6 md:h-6" /></button>
        </div>
      </div>
    );

    return (
      <div className="space-y-8 py-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('home')} className="p-2 hover:bg-secondary rounded-full text-muted-foreground"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-2xl font-bold text-card-foreground">Espace Professeur</h2>
        </div>
        <div className="flex flex-wrap gap-2 p-1 bg-card rounded-xl border border-border">
          {(['subjects', 'chapters', 'questions', 'users', 'share'] as const).map(tab => (
            <button key={tab} onClick={() => { setProfTab(tab); sessionStorage.setItem('routemaster_prof_tab', tab); }}
              className={`flex-1 min-w-[80px] py-2 rounded-lg font-bold text-[10px] md:text-sm transition-all ${profTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-card-foreground'}`}>
              {tab === 'subjects' ? 'Matières' : tab === 'chapters' ? 'Chapitres' : tab === 'questions' ? 'Questions' : tab === 'users' ? 'Utilisateurs' : 'Partager'}
            </button>
          ))}
        </div>

        {profTab === 'subjects' && (
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
            <h3 className="text-lg font-bold text-card-foreground mb-4 md:mb-6 flex items-center gap-2"><Edit3 className="text-primary w-5 h-5" /> Gestion des Matières</h3>
            <div className="space-y-3 md:space-y-4">
              {subjects.map(subject => (
                <div key={subject} className="flex items-center justify-between p-3 md:p-4 bg-secondary/50 rounded-xl border border-border">
                  {editingSubject === subject ? (
                    <div className="flex gap-2 w-full">
                      <input type="text" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} autoFocus
                        className="bg-card border border-muted-foreground rounded-lg px-3 py-1.5 text-card-foreground flex-1 focus:outline-none focus:border-primary text-sm" />
                      <button onClick={() => handleRenameSubject(subject)} className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingSubject(null)} className="p-2 bg-secondary text-card-foreground rounded-lg hover:opacity-80"><XCircle className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-card-foreground font-medium text-sm md:text-base">{subjectNames[subject] || subject}</span>
                      <button onClick={() => { setEditingSubject(subject); setNewSubjectName(subjectNames[subject] || subject); }} className="text-muted-foreground hover:text-primary transition-colors p-1"><Edit3 className="w-4 h-4 md:w-5 md:h-5" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profTab === 'chapters' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
              <h3 className="text-lg font-bold text-card-foreground mb-4">Ajouter un Chapitre</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                <select value={newChapter.level} onChange={e => setNewChapter({...newChapter, level: e.target.value})} className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-card-foreground text-sm">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={newChapter.subject} onChange={e => setNewChapter({...newChapter, subject: e.target.value})} className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-card-foreground text-sm">
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Titre du chapitre" value={newChapter.title}
                  onChange={e => setNewChapter({...newChapter, title: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-card-foreground text-sm" />
                <button onClick={handleAddChapter} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-colors"><Plus className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {chapters.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">Aucun chapitre.</div> : (
                chapters.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="text-card-foreground font-medium text-sm md:text-base">{c.title}</p>
                      <p className="text-muted-foreground text-[10px] md:text-xs uppercase tracking-wider">{c.level} • {c.subject}</p>
                    </div>
                    <button onClick={() => handleDeleteChapter(c)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {profTab === 'questions' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
              <h3 className="text-lg font-bold text-card-foreground mb-4">Ajouter une Question</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                <select value={newQuestion.level} onChange={e => setNewQuestion({...newQuestion, level: e.target.value})} className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-card-foreground text-sm">{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select>
                <select value={newQuestion.subject} onChange={e => setNewQuestion({...newQuestion, subject: e.target.value})} className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-card-foreground text-sm">{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
                <select value={newQuestion.chapter} onChange={e => setNewQuestion({...newQuestion, chapter: e.target.value})} className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-card-foreground text-sm">
                  <option value="">Choisir un chapitre</option>
                  {chapters.filter(c => c.level === newQuestion.level && c.subject === newQuestion.subject).map(c => <option key={c.title} value={c.title}>{c.title}</option>)}
                </select>
              </div>
              <textarea placeholder="Texte de la question" value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-card-foreground mb-4 h-24 text-sm resize-none" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                {newQuestion.options?.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="text" placeholder={`Option ${idx + 1}`} value={opt}
                      onChange={e => { const opts = [...(newQuestion.options || [])]; opts[idx] = e.target.value; setNewQuestion({...newQuestion, options: opts}); }}
                      className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-card-foreground text-sm" />
                    <button onClick={() => setNewQuestion({...newQuestion, correct: idx})}
                      className={`p-2.5 rounded-xl border transition-all ${newQuestion.correct === idx ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}>
                      {newQuestion.correct === idx ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
              </div>
              <textarea placeholder="Explication (optionnel)" value={newQuestion.explanation} onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-card-foreground mb-4 h-20 text-sm resize-none" />
              <button onClick={handleAddQuestion} className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-colors">AJOUTER LA QUESTION</button>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {questions.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">Aucune question.</div> : (
                questions.map(q => (
                  <div key={q.id} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="text-card-foreground font-medium line-clamp-1 text-sm md:text-base">{q.text}</p>
                      <p className="text-muted-foreground text-[10px] md:text-xs uppercase tracking-wider">{q.level} • {q.subject} • {q.chapter}</p>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {profTab === 'users' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-card-foreground flex items-center gap-2"><UserIcon className="text-primary w-5 h-5" /> Gestion des Utilisateurs</h3>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">{users.length} Utilisateurs</span>
              </div>
              <div className="bg-background/50 rounded-xl border border-border overflow-hidden">
                {users.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">Aucun utilisateur.</div> : (
                  <div className="divide-y divide-border">
                    {users.sort((a, b) => b.points - a.points).map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 hover:bg-card/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">{u.pseudo.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="text-card-foreground font-bold text-sm md:text-base flex items-center gap-2">{u.pseudo}{u.id === user?.id && <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">Moi</span>}</p>
                            <p className="text-muted-foreground text-[10px] md:text-xs uppercase tracking-wider">{u.level} • {u.points} pts</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteUser(u.id)} className="text-muted-foreground hover:text-destructive p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {profTab === 'share' && (
          <div className="space-y-5">
            <div className="bg-fuel/10 border border-fuel/40 rounded-xl p-4 flex gap-3 items-start">
              <AlertTriangle className="text-fuel w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-fuel space-y-1">
                <p className="font-bold">Partage de l'application</p>
                <p>Partagez cette application avec vos élèves. Pour un accès direct, déployez-la puis collez l'URL publique ci-dessous. Le bouton "Partager (mobile)" utilise le partage natif iOS/Android.</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col items-center gap-6 text-center">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-card-foreground flex items-center justify-center gap-2"><QrCode className="text-primary w-5 h-5" /> QR Code à afficher en classe</h3>
                <p className="text-muted-foreground text-xs md:text-sm">Scannable nativement avec l'appareil photo iPhone (iOS 11+) et Android.</p>
              </div>
              <div className="bg-card-foreground p-3 md:p-4 rounded-xl md:rounded-2xl shadow-2xl">
                <QRCodeCanvas id="qr-code-canvas" value={shareUrl} size={typeof window !== 'undefined' && window.innerWidth < 640 ? 200 : 256} level="M" includeMargin={true} />
              </div>
              <div className="space-y-4 w-full max-w-md">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase ml-1">URL de l'application</label>
                  <input type="text" value={shareUrl} onChange={e => { setShareUrl(e.target.value); setShortUrl(''); }}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-card-foreground text-[10px] md:text-sm font-mono focus:outline-none focus:border-primary" />
                </div>
                {shortUrl ? (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Lien court — à écrire au tableau</p>
                    <p className="text-xl md:text-2xl font-bold text-primary tracking-wider select-all">{shortUrl}</p>
                    <button onClick={() => setShortUrl('')} className="text-xs text-muted-foreground mt-2 underline">Réinitialiser</button>
                  </div>
                ) : (
                  <button onClick={handleGenerateShortUrl} disabled={isGeneratingShortUrl}
                    className={`w-full py-2 rounded-xl font-bold text-sm border transition-colors ${isGeneratingShortUrl ? 'bg-secondary text-muted-foreground border-border cursor-not-allowed' : 'bg-secondary text-primary hover:bg-surface-hover border-border'}`}>
                    {isGeneratingShortUrl ? 'Génération en cours...' : 'Générer un lien court (à écrire au tableau)'}
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCopy}
                    className="flex items-center justify-center gap-2 py-3 bg-secondary text-card-foreground rounded-xl hover:bg-surface-hover transition-colors font-bold text-sm">
                    {copySuccess ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
                    {copySuccess ? 'Copié !' : 'Copier le lien'}
                  </button>
                  <button onClick={handleNativeShare}
                    className="flex items-center justify-center gap-2 py-3 bg-ai-purple/10 text-ai-purple rounded-xl hover:bg-ai-purple/20 transition-colors font-bold text-sm border border-ai-purple/30">
                    <Share2 className="w-4 h-4" /> Partager (mobile)
                  </button>
                </div>
                <button onClick={() => { const c = document.getElementById('qr-code-canvas') as HTMLCanvasElement; if (c) { const a = document.createElement('a'); a.download = 'routemaster-qr.png'; a.href = c.toDataURL('image/png'); a.click(); } }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-colors font-bold text-sm">
                  <Download className="w-4 h-4" /> Télécharger le QR Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {Header()}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {view === 'identification' && IdentificationView()}
            {view === 'home'           && HomeView()}
            {view === 'levels'         && LevelsView()}
            {view === 'subjects'       && SubjectsView()}
            {view === 'chapters'       && ChaptersView()}
            {view === 'quiz'           && QuizView()}
            {view === 'prof'           && ProfView()}
            {view === 'ranking'        && RankingView()}
            {view === 'shop'           && ShopView()}
          </motion.div>
        </AnimatePresence>
      </main>
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border p-2 flex justify-around items-center z-50">
          <button onClick={() => setView('home')}    className={`p-2 rounded-xl transition-all ${view === 'home'    ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-card-foreground'}`}><Home className="w-6 h-6" /></button>
          <button onClick={() => setView('levels')}  className={`p-2 rounded-xl transition-all ${['levels','subjects','chapters','quiz'].includes(view) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-card-foreground'}`}><GraduationCap className="w-6 h-6" /></button>
          <button onClick={() => setView('ranking')} className={`p-2 rounded-xl transition-all ${view === 'ranking' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-card-foreground'}`}><ListOrdered className="w-6 h-6" /></button>
          <button onClick={() => setView('shop')}    className={`p-2 rounded-xl transition-all ${view === 'shop'    ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-card-foreground'}`}><ShoppingBag className="w-6 h-6" /></button>
          <button onClick={() => setView('prof')}    className={`p-2 rounded-xl transition-all ${view === 'prof'    ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-card-foreground'}`}><Settings className="w-6 h-6" /></button>
        </nav>
      )}
    </div>
  );
}
