import React, { useState, useEffect, useCallback } from 'react';
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
  User as UserIcon,
  Home,
  GraduationCap,
  Edit3,
  Save,
  ShoppingBag,
  ListOrdered,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Share2,
  QrCode,
  LogOut,
  Download,
  Loader2,
  Paintbrush,
  Eye,
  X,
  Clock
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, Chapter, User } from '../types';
import { ALL_QUESTIONS, INITIAL_CHAPTERS, INITIAL_SUBJECT_NAMES } from '../data/index';
import { FUEL_PER_CORRECT_ANSWER, POINTS_PER_CORRECT_ANSWER, STREAK_BONUS_FUEL, STREAK_BONUS_POINTS, INITIAL_FUEL, MAX_FUEL, MAX_POINTS } from '../constants';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useProfiles';

const LEVELS = ['2ndes CRM', '1ères CRM', 'Terminales CRM'];

const COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours in ms

// Shop items with vehicleType restriction for paint/accessories
const SHOP_ITEMS = [
  // Vehicles
  { id: 'veh_car', name: 'Voiture de Tourisme', price: 1000, type: 'vehicle', vehicleType: 'car' },
  { id: 'veh_truck', name: 'Porteur (Camion)', price: 5000, type: 'vehicle', vehicleType: 'truck' },
  { id: 'veh_articulated', name: 'Ensemble Articulé', price: 15000, type: 'vehicle', vehicleType: 'articulated' },
  // Paints
  { id: 'paint_red', name: 'Peinture Rouge', price: 500, type: 'paint', color: '#ff0000' },
  { id: 'paint_blue', name: 'Peinture Bleue', price: 500, type: 'paint', color: '#0000ff' },
  { id: 'paint_gold', name: 'Peinture Or', price: 2000, type: 'paint', color: '#ffd700' },
  { id: 'paint_black', name: 'Peinture Noir Brillant', price: 300, type: 'paint', color: '#000000' },
  { id: 'paint_green', name: 'Peinture Vert Racing', price: 800, type: 'paint', color: '#00ff00' },
  { id: 'paint_orange', name: 'Peinture Orange Flamme', price: 700, type: 'paint', color: '#ff8800' },
  { id: 'paint_silver', name: 'Peinture Argent Métallisé', price: 1000, type: 'paint', color: '#c0c0c0' },
  { id: 'paint_purple', name: 'Peinture Violet Cosmique', price: 1500, type: 'paint', color: '#9900ff' },
  { id: 'paint_matte_black', name: 'Peinture Noir Mat', price: 1200, type: 'paint', color: '#1a1a1a' },
  { id: 'paint_candy_red', name: 'Peinture Rouge Candy', price: 2500, type: 'paint', color: '#cc0033' },
  // Accessories
  { id: 'beacons', name: 'Gyrophares', price: 1500, type: 'accessory' },
  { id: 'bullbar', name: 'Pare-buffle', price: 1200, type: 'accessory' },
  { id: 'lightbar', name: 'Rampe de phares', price: 1800, type: 'accessory' },
  { id: 'xenon', name: 'Phares Xénon', price: 800, type: 'accessory' },
  { id: 'spoiler', name: 'Aileron / Spoiler', price: 1000, type: 'accessory' },
  { id: 'chrome_wheels', name: 'Jantes Chrome', price: 2000, type: 'accessory' },
  { id: 'running_board', name: 'Marchepieds Latéraux', price: 900, type: 'accessory' },
  { id: 'visor', name: 'Visière Pare-soleil', price: 600, type: 'accessory' },
];

// Helper: get owned item key for a vehicle type
function ownedKey(vehicleType: string, itemId: string) {
  return `${vehicleType}:${itemId}`;
}

// Helper: check if user owns an item for their current vehicle type
function ownsForVehicle(user: User, itemId: string): boolean {
  return user.ownedItems.includes(ownedKey(user.vehicleType, itemId));
}

// Shuffle array (Fisher-Yates)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RouteMaster() {
  const { fetchAllUsers, fetchUserByPseudo, upsertUser, deleteUser: deleteProfile } = useProfiles();
  const [view, setView] = useState<'identification' | 'home' | 'levels' | 'subjects' | 'chapters' | 'quiz' | 'prof' | 'ranking' | 'shop'>(() => {
    return (sessionStorage.getItem('routemaster_view') as any) || 'identification';
  });
  const [selectedLevel, setSelectedLevel] = useState<string | null>(() => {
    return sessionStorage.getItem('routemaster_selected_level');
  });
  const [selectedSubject, setSelectedSubject] = useState<string | null>(() => {
    return sessionStorage.getItem('routemaster_selected_subject');
  });
  const [selectedChapter, setSelectedChapter] = useState<string | null>(() => {
    return sessionStorage.getItem('routemaster_selected_chapter');
  });
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>(() => {
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

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Modal to view another user's vehicle
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Load users from database on mount
  useEffect(() => {
    fetchAllUsers().then(dbUsers => {
      setUsers(dbUsers);
      setUsersLoaded(true);
    });
  }, [fetchAllUsers]);

  useEffect(() => {
    localStorage.setItem('routemaster_chapters_v3', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    localStorage.setItem('routemaster_questions_v3', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('routemaster_subject_names', JSON.stringify(subjectNames));
  }, [subjectNames]);
  
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

  useEffect(() => {
    if (user) {
      setUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) {
          return prev.map(u => u.id === user.id ? user : u);
        }
        return [...prev, user];
      });
    }
  }, [user]);

  const [pseudoInput, setPseudoInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [levelInput, setLevelInput] = useState('2ndes CRM');
  const [profCodeInput, setProfCodeInput] = useState('');
  const [isProfAuthenticated, setIsProfAuthenticated] = useState(() => {
    return sessionStorage.getItem('routemaster_prof_auth') === 'true';
  });

  // Quiz State
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>(() => {
    const saved = sessionStorage.getItem('routemaster_current_questions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = sessionStorage.getItem('routemaster_quiz_index');
    return saved ? parseInt(saved) : 0;
  });
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizFinished, setQuizFinished] = useState(() => {
    return sessionStorage.getItem('routemaster_quiz_finished') === 'true';
  });
  const [quizScore, setQuizScore] = useState(() => {
    const saved = sessionStorage.getItem('routemaster_quiz_score');
    return saved ? parseInt(saved) : 0;
  });
  const [correctStreak, setCorrectStreak] = useState(0);

  // Prof Space State
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [profTab, setProfTab] = useState<'subjects' | 'chapters' | 'questions' | 'share' | 'users'>(() => {
    return (sessionStorage.getItem('routemaster_prof_tab') as any) || 'subjects';
  });
  const [newChapter, setNewChapter] = useState(() => {
    const saved = sessionStorage.getItem('routemaster_new_chapter');
    return saved ? JSON.parse(saved) : { level: '2ndes CRM', subject: 'ETG', title: '' };
  });
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>(() => {
    const saved = sessionStorage.getItem('routemaster_new_question');
    return saved ? JSON.parse(saved) : {
      type: 'qcm',
      level: '2ndes CRM',
      subject: 'ETG',
      chapter: '',
      text: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: ''
    };
  });

  const [shareUrl, setShareUrl] = useState('https://routemastercrm.lovable.app');
  const [shortUrl, setShortUrl] = useState('');
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('routemaster_view', view);
  }, [view]);

  useEffect(() => {
    if (selectedLevel) sessionStorage.setItem('routemaster_selected_level', selectedLevel);
    else sessionStorage.removeItem('routemaster_selected_level');
  }, [selectedLevel]);

  useEffect(() => {
    if (selectedSubject) sessionStorage.setItem('routemaster_selected_subject', selectedSubject);
    else sessionStorage.removeItem('routemaster_selected_subject');
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) sessionStorage.setItem('routemaster_selected_chapter', selectedChapter);
    else sessionStorage.removeItem('routemaster_selected_chapter');
  }, [selectedChapter]);

  useEffect(() => {
    sessionStorage.setItem('routemaster_current_questions', JSON.stringify(currentQuestions));
  }, [currentQuestions]);

  useEffect(() => {
    sessionStorage.setItem('routemaster_quiz_index', currentQuestionIndex.toString());
  }, [currentQuestionIndex]);

  useEffect(() => {
    sessionStorage.setItem('routemaster_quiz_finished', quizFinished.toString());
  }, [quizFinished]);

  useEffect(() => {
    sessionStorage.setItem('routemaster_quiz_score', quizScore.toString());
  }, [quizScore]);

  useEffect(() => {
    sessionStorage.setItem('routemaster_new_chapter', JSON.stringify(newChapter));
  }, [newChapter]);

  useEffect(() => {
    sessionStorage.setItem('routemaster_new_question', JSON.stringify(newQuestion));
  }, [newQuestion]);

  // Handlers
  const handleLogin = async () => {
    if (!pseudoInput.trim() || !passwordInput.trim()) return;
    
    const existingUser = await fetchUserByPseudo(pseudoInput);
    
    if (existingUser) {
      if (existingUser.password === passwordInput) {
        setUser(existingUser);
        setView('home');
        return;
      } else {
        alert('Mot de passe incorrect');
        return;
      }
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
        paintColor: '#ffffff',
        paintFinish: 'glossy',
        wheelType: 'standard',
        hasBullbar: false,
        hasSpoiler: false,
        hasRunningBoard: false,
        hasVisor: false,
        hasBeacons: false,
        hasLightBar: false,
        hasXenon: false,
        cabinStripe: null,
        cabinSticker: null,
        trailerColor: '#ffffff',
        trailerLogo: null
      },
      completedChapters: []
    };
    
    await upsertUser(newUser);
    setUser(newUser);
    setView('home');
  };

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    setView('subjects');
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setView('chapters');
  };

  const handleChapterSelect = (chapterTitle: string) => {
    setSelectedChapter(chapterTitle);
    const now = Date.now();
    const chapterQuestions = questions.filter(q => 
      q.level === selectedLevel && 
      q.subject === selectedSubject && 
      q.chapter === chapterTitle
    );
    
    // Filter out questions on 48h cooldown
    const availableQuestions = chapterQuestions.filter(q => {
      const answeredAt = user?.answeredQuestions[q.id];
      if (!answeredAt || typeof answeredAt !== 'number') return true;
      return (now - answeredAt) >= COOLDOWN_MS;
    });

    // Shuffle randomly
    const shuffled = shuffleArray(availableQuestions);
    
    setCurrentQuestions(shuffled);
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

    // Record timestamp for 48h cooldown
    const updatedAnswered = { ...user.answeredQuestions, [question.id]: Date.now() };

    if (correct) {
      setQuizScore(prev => prev + 1);
      setCorrectStreak(prev => prev + 1);
      const newStreak = correctStreak + 1;
      // Base reward: 15L + 50pts per correct answer
      let fuelGain = FUEL_PER_CORRECT_ANSWER;
      let pointsGain = POINTS_PER_CORRECT_ANSWER;
      // Streak bonus: every answer in a streak without error gives +20L +50pts
      if (newStreak > 1) {
        fuelGain += STREAK_BONUS_FUEL;
        pointsGain += STREAK_BONUS_POINTS;
      }
      setUser(prev => prev ? ({
        ...prev,
        fuel: Math.min(prev.fuel + fuelGain, MAX_FUEL),
        points: Math.min(prev.points + pointsGain, MAX_POINTS),
        answeredQuestions: updatedAnswered
      }) : null);
    } else {
      setCorrectStreak(0);
      setUser(prev => prev ? ({
        ...prev,
        answeredQuestions: updatedAnswered
      }) : null);
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

  const handleRenameSubject = (subjectKey: string) => {
    setSubjectNames(prev => ({
      ...prev,
      [subjectKey]: newSubjectName
    }));
    setEditingSubject(null);
  };

  const handleAddChapter = () => {
    if (!newChapter.title.trim()) return;
    setChapters(prev => [...prev, { ...newChapter }]);
    setNewChapter({ ...newChapter, title: '' });
  };

  const handleDeleteChapter = (title: string) => {
    setChapters(prev => prev.filter(c => c.title !== title));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text?.trim()) return;
    const q: Question = {
      ...newQuestion as Question,
      id: Math.random().toString(36).substr(2, 9)
    };
    setQuestions(prev => [...prev, q]);
    setNewQuestion({
      ...newQuestion,
      text: '',
      options: ['', '', '', ''],
      explanation: ''
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    await deleteProfile(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    if (user && user.id === userId) {
      setUser(null);
      localStorage.removeItem('routemaster_user');
      setView('identification');
    }
  };

  const [isGeneratingVehicle, setIsGeneratingVehicle] = useState(false);

  const generateVehicleImage = useCallback(async (vehicleType: string, customize: User['customize']) => {
    setIsGeneratingVehicle(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-vehicle', {
        body: {
          vehicleType,
          paintColor: customize.paintColor,
          hasBullbar: customize.hasBullbar,
          hasBeacons: customize.hasBeacons,
          hasLightBar: customize.hasLightBar,
          hasXenon: customize.hasXenon,
          hasSpoiler: customize.hasSpoiler,
        }
      });
      if (error) throw error;
      return data?.imageUrl || null;
    } catch (err) {
      console.error('Vehicle generation error:', err);
      return null;
    } finally {
      setIsGeneratingVehicle(false);
    }
  }, []);

  // Build customize state from owned items for current vehicle type
  const getCustomizeFromOwnedItems = (ownedItems: string[], vehicleType: string, baseCustomize: User['customize']) => {
    const newCustomize = {
      ...baseCustomize,
      paintColor: '#ffffff',
      paintFinish: 'glossy',
      wheelType: 'standard',
      hasBullbar: false,
      hasSpoiler: false,
      hasRunningBoard: false,
      hasVisor: false,
      hasBeacons: false,
      hasLightBar: false,
      hasXenon: false,
    };

    for (const key of ownedItems) {
      if (!key.startsWith(`${vehicleType}:`)) continue;
      const itemId = key.split(':')[1];
      const shopItem = SHOP_ITEMS.find(s => s.id === itemId);
      if (!shopItem) continue;

      if (shopItem.type === 'paint' && shopItem.color) {
        newCustomize.paintColor = shopItem.color;
      }
      if (shopItem.id === 'beacons') newCustomize.hasBeacons = true;
      if (shopItem.id === 'bullbar') newCustomize.hasBullbar = true;
      if (shopItem.id === 'lightbar') newCustomize.hasLightBar = true;
      if (shopItem.id === 'xenon') newCustomize.hasXenon = true;
      if (shopItem.id === 'spoiler') newCustomize.hasSpoiler = true;
      if (shopItem.id === 'chrome_wheels') newCustomize.wheelType = 'chrome';
      if (shopItem.id === 'running_board') newCustomize.hasRunningBoard = true;
      if (shopItem.id === 'visor') newCustomize.hasVisor = true;
    }

    return newCustomize;
  };

  const handleBuyItem = async (item: any) => {
    if (!user || user.fuel < item.price) return;

    if (item.type === 'vehicle') {
      // Vehicle items use raw id (no prefix)
      if (user.ownedItems.includes(item.id)) return;

      // Reset customize for new vehicle type
      const defaultCustomize: User['customize'] = {
        paintColor: '#ffffff',
        paintFinish: 'glossy',
        wheelType: 'standard',
        hasBullbar: false,
        hasSpoiler: false,
        hasRunningBoard: false,
        hasVisor: false,
        hasBeacons: false,
        hasLightBar: false,
        hasXenon: false,
        cabinStripe: null,
        cabinSticker: null,
        trailerColor: '#ffffff',
        trailerLogo: null
      };

      // Generate image for the new vehicle
      const imageUrl = await generateVehicleImage(item.vehicleType, defaultCustomize);

      setUser(prev => prev ? {
        ...prev,
        fuel: prev.fuel - item.price,
        ownedItems: [...prev.ownedItems, item.id],
        vehicleOwned: true,
        vehicleType: item.vehicleType,
        vehicleModel: item.name,
        customize: defaultCustomize,
        vehicleImageUrl: imageUrl || undefined,
      } : null);
      return;
    }

    // For paint/accessory: use vehicleType prefix
    const key = ownedKey(user.vehicleType, item.id);
    if (user.ownedItems.includes(key)) return;

    const newOwnedItems = [...user.ownedItems, key];
    const newCustomize = getCustomizeFromOwnedItems(newOwnedItems, user.vehicleType, user.customize);

    // Regenerate vehicle image
    let imageUrl: string | null = null;
    if (user.vehicleOwned) {
      imageUrl = await generateVehicleImage(user.vehicleType, newCustomize);
    }

    setUser(prev => prev ? {
      ...prev,
      fuel: prev.fuel - item.price,
      ownedItems: newOwnedItems,
      customize: newCustomize,
      vehicleImageUrl: imageUrl || prev.vehicleImageUrl,
    } : null);
  };

  const handleProfAccess = () => {
    if (profCodeInput === '021285') {
      setIsProfAuthenticated(true);
      sessionStorage.setItem('routemaster_prof_auth', 'true');
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
      case 'shop': setView('home'); break;
      case 'ranking': setView('home'); break;
      case 'prof': 
        setView(user ? 'home' : 'identification'); 
        setIsProfAuthenticated(false);
        setProfCodeInput('');
        sessionStorage.removeItem('routemaster_prof_auth');
        break;
      default: setView('home');
    }
  };

  // Components
  const IdentificationView = () => (
    <div className="flex flex-col items-center justify-center py-8 md:py-12 gap-6 md:gap-8 text-center min-h-[80vh] px-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full" />
        <Truck className="w-24 h-24 md:w-32 md:h-32 text-emerald-500 relative" />
      </motion.div>
      
      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">Identification</h2>
        <p className="text-zinc-400 text-sm md:text-base">Créez ou connectez-vous à votre profil.</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <input 
          type="text" 
          placeholder="Votre Pseudo"
          value={pseudoInput}
          onChange={(e) => setPseudoInput(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm md:text-base"
        />

        <input 
          type="password" 
          placeholder="Mot de passe"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm md:text-base"
        />
        
        <div className="space-y-1 text-left">
          <label className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">Votre Classe</label>
          <select 
            value={levelInput}
            onChange={(e) => setLevelInput(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm md:text-base"
          >
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full py-3 md:py-4 bg-emerald-500 text-black font-bold text-lg md:text-xl rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          SE CONNECTER / S'INSCRIRE
        </button>

        <div className="pt-4">
          <button 
            onClick={() => setView('prof')}
            className="text-zinc-500 hover:text-emerald-500 transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
          >
            <Settings className="w-4 h-4" />
            Accès Professeur
          </button>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-zinc-900 border-b border-zinc-800 p-3 md:p-4 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2">
            {view !== 'identification' && view !== 'home' && (
              <button 
                onClick={goBack}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(user ? 'home' : 'identification')}>
              <Truck className="text-emerald-500 w-6 h-6 md:w-8 md:h-8" />
              <h1 className="text-lg md:text-xl font-bold tracking-tighter text-white uppercase italic">RouteMaster <span className="text-emerald-500">CRM</span></h1>
              <span className="text-[10px] md:text-xs text-zinc-400 italic ml-1 self-end mb-0.5">by Y.Damart</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user && view === 'identification' && (
              <button 
                onClick={() => setView('prof')}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 sm:hidden"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            {user && (
              <div className="flex sm:hidden items-center gap-2">
                <button 
                  onClick={() => setView('prof')}
                  className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setUser(null);
                    setView('identification');
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-zinc-800 px-2 md:px-3 py-1 rounded-full border border-zinc-700">
                <Fuel className="text-orange-500 w-3.5 h-3.5" />
                <span className="text-xs md:text-sm font-mono font-bold text-white">{user.fuel}L</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-800 px-2 md:px-3 py-1 rounded-full border border-zinc-700">
                <Trophy className="text-yellow-500 w-3.5 h-3.5" />
                <span className="text-xs md:text-sm font-mono font-bold text-white">{user.points} pts</span>
              </div>
            </div>
          )}
          
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={() => setView('prof')}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              title="Espace Prof"
            >
              <Settings className="w-5 h-5" />
            </button>
            {user && (
              <button 
                onClick={() => {
                  setUser(null);
                  setView('identification');
                }}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-red-500"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  const HomeView = () => (
    <div className="flex flex-col items-center justify-center py-6 md:py-12 gap-6 md:gap-8 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full" />
        <Truck className="w-24 h-24 md:w-32 md:h-32 text-emerald-500 relative" />
      </motion.div>
      
      <div className="space-y-2 px-4">
        <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight leading-tight">Prêt pour la route ?</h2>
        <p className="text-zinc-400 max-w-md mx-auto text-sm md:text-base">Entraînez-vous pour votre Bac Pro CRM avec nos fiches et questions interactives.</p>
      </div>

      <button 
        onClick={() => setView('levels')}
        className="group relative px-6 md:px-8 py-3 md:py-4 bg-emerald-500 text-black font-bold text-lg md:text-xl rounded-xl hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
      >
        COMMENCER LA FORMATION
        <ChevronRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mt-8 md:mt-12">
        {[
          { icon: BookOpen, title: "Fiches Orales", desc: "12 fiches complètes" },
          { icon: GraduationCap, title: "Code ETG", desc: "Permis B & Lourd" },
          { icon: Edit3, title: "Fiches Écrites", desc: "Plateau C & CE" }
        ].map((item, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-5 md:p-6 rounded-2xl hover:border-emerald-500/50 transition-colors text-left sm:text-center">
            <item.icon className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 mb-3 md:mb-4 mx-0 sm:mx-auto" />
            <h3 className="text-white font-bold text-base md:text-lg">{item.title}</h3>
            <p className="text-zinc-500 text-xs md:text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const LevelsView = () => (
    <div className="space-y-6 md:space-y-8 py-4 md:py-8">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={() => setView('home')} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-white">Choisissez votre niveau</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => handleLevelSelect(level)}
            className="flex items-center justify-between p-4 md:p-6 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-500 font-bold text-lg md:text-xl">
                {level.charAt(0)}
              </div>
              <span className="text-lg md:text-xl font-bold text-white">{level}</span>
            </div>
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
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
          <button onClick={() => setView('levels')} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div>
            <p className="text-emerald-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">{selectedLevel}</p>
            <h2 className="text-xl md:text-2xl font-bold text-white">Matières disponibles</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => handleSubjectSelect(subject)}
              className="p-4 md:p-6 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl hover:border-emerald-500 transition-all text-left group"
            >
              <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">{subjectNames[subject] || subject}</h3>
              <p className="text-zinc-500 text-xs md:text-sm">
                {chapters.filter(c => c.level === selectedLevel && c.subject === subject).length} chapitres
              </p>
              <div className="mt-3 md:mt-4 flex justify-end">
                <span className="text-emerald-500 text-xs md:text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Explorer <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const ChaptersView = () => {
    const currentChapters = chapters.filter(c => c.level === selectedLevel && c.subject === selectedSubject);
    const now = Date.now();
    
    return (
      <div className="space-y-6 md:space-y-8 py-4 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setView('subjects')} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div>
            <p className="text-emerald-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">{selectedLevel} • {subjectNames[selectedSubject!] || selectedSubject}</p>
            <h2 className="text-xl md:text-2xl font-bold text-white">Chapitres</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:gap-3">
          {currentChapters.map((chapter) => {
            // Count available questions (not on cooldown)
            const chapterQuestions = questions.filter(q => 
              q.level === selectedLevel && 
              q.subject === selectedSubject && 
              q.chapter === chapter.title
            );
            const availableCount = chapterQuestions.filter(q => {
              const answeredAt = user?.answeredQuestions[q.id];
              if (!answeredAt || typeof answeredAt !== 'number') return true;
              return (now - answeredAt) >= COOLDOWN_MS;
            }).length;
            
            return (
              <button
                key={chapter.title}
                onClick={() => handleChapterSelect(chapter.title)}
                className="flex items-center justify-between p-3 md:p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors text-left"
              >
                <div>
                  <span className="text-white font-medium text-sm md:text-base">{chapter.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-zinc-500 text-[10px]">{availableCount}/{chapterQuestions.length} questions disponibles</span>
                    {availableCount < chapterQuestions.length && (
                      <span className="text-orange-400 text-[10px] flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> cooldown 48h
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-zinc-600 w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const QuizView = () => {
    if (currentQuestions.length === 0) {
      return (
        <div className="py-20 text-center space-y-4">
          <Clock className="w-16 h-16 text-orange-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Toutes les questions sont en cooldown</h3>
          <p className="text-zinc-500">Revenez dans quelques heures pour de nouvelles questions !</p>
          <button onClick={() => setView('chapters')} className="text-emerald-500 font-bold">Retour</button>
        </div>
      );
    }

    if (quizFinished) {
      return (
        <div className="py-12 text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto"
          >
            <Trophy className="w-12 h-12 text-black" />
          </motion.div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase italic">Session Terminée !</h2>
            <p className="text-zinc-400">Vous avez obtenu un score de <span className="text-emerald-500 font-bold">{quizScore} / {currentQuestions.length}</span></p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm mx-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-zinc-500">Gazole gagné</span>
              <span className="text-orange-500 font-bold">+{quizScore * FUEL_PER_CORRECT_ANSWER}L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Points gagnés</span>
              <span className="text-yellow-500 font-bold">+{quizScore * 10} pts</span>
            </div>
          </div>

          <button 
            onClick={() => setView('chapters')}
            className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
          >
            RETOUR AUX CHAPITRES
          </button>
        </div>
      );
    }

    const question = currentQuestions[currentQuestionIndex];

    return (
      <div className="max-w-2xl mx-auto py-4 md:py-8 space-y-6 md:space-y-8">
        <div className="flex justify-between items-center px-2">
          <span className="text-zinc-500 text-[10px] md:text-sm font-mono uppercase tracking-wider">QUESTION {currentQuestionIndex + 1} / {currentQuestions.length}</span>
          <div className="w-24 md:w-32 h-1.5 md:h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }} 
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl">
          <h3 className="text-lg md:text-2xl font-bold text-white mb-6 md:mb-8 leading-tight">{question.text}</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                disabled={showResult}
                onClick={() => handleAnswer(idx)}
                className={`p-3 md:p-4 rounded-xl text-left border transition-all flex justify-between items-center text-sm md:text-base ${
                  showResult 
                    ? idx === question.correct 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                      : isCorrect === false && idx === currentQuestions[currentQuestionIndex].correct
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                    : 'bg-zinc-800 border-zinc-700 text-white hover:border-emerald-500 hover:bg-zinc-800/80'
                }`}
              >
                <span className="flex-1">{option}</span>
                {showResult && idx === question.correct && <CheckCircle2 className="w-5 h-5 ml-2 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`p-5 md:p-6 rounded-2xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                {isCorrect ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />}
                <span className={`font-bold text-sm md:text-base ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isCorrect ? 'Excellent !' : 'Oups, pas tout à fait...'}
                </span>
              </div>
              <p className="text-zinc-300 text-xs md:text-sm mb-6 leading-relaxed">{question.explanation}</p>
              
              <button 
                onClick={nextQuestion}
                className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm md:text-base"
              >
                {currentQuestionIndex + 1 === currentQuestions.length ? 'VOIR LE RÉSULTAT' : 'QUESTION SUIVANTE'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Vehicle viewer modal
  const VehicleModal = ({ targetUser, onClose }: { targetUser: User; onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="text-emerald-500 w-5 h-5" />
            Véhicule de {targetUser.pseudo}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {targetUser.vehicleOwned ? (
          <>
            <div className="w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center mb-4">
              {targetUser.vehicleImageUrl ? (
                <img 
                  src={targetUser.vehicleImageUrl} 
                  alt={targetUser.vehicleModel}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Truck className="w-16 h-16 text-zinc-700" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-white font-bold">{targetUser.vehicleModel}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full border border-zinc-700">
                  <Paintbrush className="w-3 h-3 inline mr-1" />
                  {targetUser.customize.paintColor}
                </span>
                {targetUser.customize.hasBullbar && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Pare-buffle</span>}
                {targetUser.customize.hasBeacons && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Gyrophares</span>}
                {targetUser.customize.hasLightBar && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Rampe phares</span>}
                {targetUser.customize.hasXenon && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Xénon</span>}
                {targetUser.customize.hasSpoiler && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Spoiler</span>}
                {targetUser.customize.wheelType === 'chrome' && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Jantes Chrome</span>}
                {targetUser.customize.hasRunningBoard && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Marchepieds</span>}
                {targetUser.customize.hasVisor && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Visière</span>}
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            <Truck className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p>Ce joueur n'a pas encore de véhicule.</p>
          </div>
        )}
      </motion.div>
    </div>
  );

  const RankingView = () => {
    const sortedUsers = [...users].sort((a, b) => b.points - a.points);
    
    return (
      <div className="space-y-6 md:space-y-8 py-4 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setView('home')} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-white">Classement Général</h2>
        </div>

        <p className="text-zinc-500 text-xs px-2">Cliquez sur un pseudo pour voir son véhicule</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl overflow-hidden">
          {sortedUsers.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Aucun utilisateur enregistré.</div>
          ) : (
            sortedUsers.map((r, i) => (
              <div 
                key={r.id} 
                className={`flex items-center justify-between p-3 md:p-4 border-b border-zinc-800 last:border-0 cursor-pointer hover:bg-zinc-800/50 transition-colors ${r.pseudo === user?.pseudo ? 'bg-emerald-500/10' : ''}`}
                onClick={() => setViewingUser(r)}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <span className={`w-6 md:w-8 text-center font-bold text-sm md:text-base ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-orange-500' : 'text-zinc-600'}`}>
                    #{i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-white font-bold text-sm md:text-base flex items-center gap-1">
                        {r.pseudo}
                        {r.vehicleOwned && <Eye className="w-3 h-3 text-emerald-500" />}
                      </p>
                      <p className="text-zinc-500 text-[10px] md:text-xs">{r.level}</p>
                    </div>
                  </div>
                </div>
                <span className="text-emerald-500 font-mono font-bold text-sm md:text-base">{r.points} pts</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const ShopView = () => {
    // Show vehicles always; show paint/accessories only for current vehicle type
    const availableItems = SHOP_ITEMS.filter(item => {
      if (item.type === 'vehicle') return true;
      if (!user?.vehicleOwned) return false;
      return true;
    });

    const vehicleTypeLabel: Record<string, string> = {
      car: 'Tourisme',
      truck: 'Porteur',
      articulated: 'Articulé'
    };

    return (
      <div className="space-y-6 md:space-y-8 py-4 md:py-8">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setView('home')} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-white">Boutique</h2>
        </div>

        {/* Vehicle Display */}
        {user?.vehicleOwned && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Truck className="text-emerald-500 w-5 h-5" />
              Mon Véhicule — {user.vehicleModel}
            </h3>
            <div className="w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center relative">
              {isGeneratingVehicle ? (
                <div className="flex flex-col items-center gap-3 text-zinc-400">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                  <span className="text-sm font-medium">Génération de votre véhicule...</span>
                </div>
              ) : user.vehicleImageUrl ? (
                <img 
                  src={user.vehicleImageUrl} 
                  alt={user.vehicleModel}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Truck className="w-16 h-16 text-zinc-700" />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full border border-zinc-700">
                <Paintbrush className="w-3 h-3 inline mr-1" />
                {user.customize.paintColor}
              </span>
              {user.customize.hasBullbar && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Pare-buffle</span>}
              {user.customize.hasBeacons && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Gyrophares</span>}
              {user.customize.hasLightBar && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Rampe phares</span>}
              {user.customize.hasXenon && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Xénon</span>}
              {user.customize.hasSpoiler && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Spoiler</span>}
              {user.customize.wheelType === 'chrome' && <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-1 rounded-full border border-zinc-700">Jantes Chrome</span>}
            </div>
          </div>
        )}

        {!user?.vehicleOwned && (
          <div className="bg-orange-500/10 border border-orange-500/50 p-3 md:p-4 rounded-xl text-orange-500 text-xs md:text-sm font-medium">
            Vous devez d'abord acheter un véhicule pour accéder aux accessoires et peintures.
          </div>
        )}

        {user?.vehicleOwned && (
          <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-blue-400 text-xs font-medium">
            🔧 Les peintures et accessoires achetés sont liés à votre véhicule actuel ({vehicleTypeLabel[user.vehicleType] || user.vehicleType}). Changer de véhicule nécessitera de débloquer à nouveau les éléments.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableItems.map((item) => {
            const isVehicle = item.type === 'vehicle';
            const owned = isVehicle 
              ? user?.ownedItems.includes(item.id) 
              : user ? ownsForVehicle(user, item.id) : false;
            const canAfford = user && user.fuel >= item.price;
            const isCurrentVehicle = isVehicle && user?.vehicleType === item.vehicleType && user?.vehicleOwned;
            
            return (
              <div key={item.id} className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col gap-4 ${owned ? 'border-emerald-500/50' : isCurrentVehicle ? 'border-yellow-500/50' : 'border-zinc-800'}`}>
                <div className="w-full aspect-video bg-zinc-800 rounded-xl flex items-center justify-center">
                  {item.type === 'vehicle' ? (
                    <Truck className="w-12 h-12 text-zinc-600" />
                  ) : item.type === 'paint' ? (
                    <div className="w-16 h-16 rounded-full border-4 border-zinc-700" style={{ backgroundColor: (item as any).color }} />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-zinc-700" />
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                    <span className="text-emerald-500 font-bold">{item.price} pts</span>
                  </div>
                  {isCurrentVehicle && !owned && (
                    <span className="text-[10px] text-yellow-500 font-medium">Véhicule actuel</span>
                  )}
                </div>
                {owned ? (
                  <div className="w-full py-3 rounded-xl font-bold text-center bg-zinc-800 text-emerald-500 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> POSSÉDÉ
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuyItem(item)}
                    disabled={!canAfford || isGeneratingVehicle}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      canAfford && !isGeneratingVehicle
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {isGeneratingVehicle ? <><Loader2 className="w-4 h-4 animate-spin" /> GÉNÉRATION...</> : 'ACHETER'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ProfView = () => {
    const subjects: string[] = Object.keys(subjectNames);

    if (!isProfAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center py-12 md:py-24 gap-6 md:gap-8 text-center px-4">
          <Lock className="w-12 h-12 md:w-16 md:h-16 text-zinc-600" />
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-white">Accès Restreint</h2>
            <p className="text-zinc-400 text-sm md:text-base">Entrez le code à 6 chiffres pour accéder à l'espace prof.</p>
          </div>
          <div className="flex gap-2 w-full max-w-xs justify-center">
            <input 
              type="password" 
              maxLength={6}
              placeholder="••••••"
              value={profCodeInput}
              onChange={(e) => setProfCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProfAccess()}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-center text-xl md:text-2xl tracking-widest focus:outline-none focus:border-emerald-500 w-32 md:w-48"
            />
            <button 
              onClick={handleProfAccess}
              className="bg-emerald-500 text-black p-3 md:p-4 rounded-xl hover:bg-emerald-400 transition-colors"
            >
              <Unlock className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 py-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('home')} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-white">Espace Professeur</h2>
        </div>

        <div className="flex flex-wrap gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          {(['subjects', 'chapters', 'questions', 'users', 'share'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setProfTab(tab);
                sessionStorage.setItem('routemaster_prof_tab', tab);
              }}
              className={`flex-1 min-w-[80px] py-2 rounded-lg font-bold text-[10px] md:text-sm transition-all ${profTab === tab ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {tab === 'subjects' ? 'Matières' : tab === 'chapters' ? 'Chapitres' : tab === 'questions' ? 'Questions' : tab === 'users' ? 'Utilisateurs' : 'Partager'}
            </button>
          ))}
        </div>

        {profTab === 'subjects' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
            <h3 className="text-lg font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
              <Edit3 className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
              Gestion des Matières
            </h3>
            
            <div className="space-y-3 md:space-y-4">
              {subjects.map(subject => (
                <div key={subject} className="flex items-center justify-between p-3 md:p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  {editingSubject === subject ? (
                    <div className="flex gap-2 w-full">
                      <input 
                        type="text" 
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-white flex-1 focus:outline-none focus:border-emerald-500 text-sm"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleRenameSubject(subject)}
                        className="p-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingSubject(null)}
                        className="p-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-white font-medium text-sm md:text-base">{subjectNames[subject] || subject}</span>
                      <button 
                        onClick={() => {
                          setEditingSubject(subject);
                          setNewSubjectName(subjectNames[subject] || subject);
                        }}
                        className="text-zinc-400 hover:text-emerald-500 transition-colors p-1"
                      >
                        <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profTab === 'chapters' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
              <h3 className="text-lg font-bold text-white mb-4">Ajouter un Chapitre</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                <select 
                  value={newChapter.level}
                  onChange={(e) => setNewChapter({...newChapter, level: e.target.value})}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm"
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select 
                  value={newChapter.subject}
                  onChange={(e) => setNewChapter({...newChapter, subject: e.target.value})}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Titre du chapitre"
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({...newChapter, title: e.target.value})}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm"
                />
                <button onClick={handleAddChapter} className="p-2.5 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-colors">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {chapters.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Aucun chapitre enregistré.</div>
              ) : (
                chapters.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="text-white font-medium text-sm md:text-base">{c.title}</p>
                      <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider">{c.level} • {c.subject}</p>
                    </div>
                    <button onClick={() => handleDeleteChapter(c.title)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {profTab === 'questions' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
              <h3 className="text-lg font-bold text-white mb-4">Ajouter une Question</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                <select 
                  value={newQuestion.level}
                  onChange={(e) => setNewQuestion({...newQuestion, level: e.target.value})}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm"
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select 
                  value={newQuestion.subject}
                  onChange={(e) => setNewQuestion({...newQuestion, subject: e.target.value})}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                  value={newQuestion.chapter}
                  onChange={(e) => setNewQuestion({...newQuestion, chapter: e.target.value})}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm"
                >
                  <option value="">Choisir un chapitre</option>
                  {chapters.filter(c => c.level === newQuestion.level && c.subject === newQuestion.subject).map(c => (
                    <option key={c.title} value={c.title}>{c.title}</option>
                  ))}
                </select>
              </div>
              <textarea 
                placeholder="Texte de la question"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white mb-4 h-24 text-sm resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                {newQuestion.options?.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...(newQuestion.options || [])];
                        opts[idx] = e.target.value;
                        setNewQuestion({...newQuestion, options: opts});
                      }}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm"
                    />
                    <button 
                      onClick={() => setNewQuestion({...newQuestion, correct: idx})}
                      className={`p-2.5 rounded-xl border transition-all ${newQuestion.correct === idx ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
                    >
                      {newQuestion.correct === idx ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
              </div>
              <textarea 
                placeholder="Explication (optionnel)"
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white mb-4 h-20 text-sm resize-none"
              />
              <button onClick={handleAddQuestion} className="w-full py-3.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors">
                AJOUTER LA QUESTION
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {questions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Aucune question enregistrée.</div>
              ) : (
                questions.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="text-white font-medium line-clamp-1 text-sm md:text-base">{q.text}</p>
                      <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider">{q.level} • {q.subject} • {q.chapter}</p>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {profTab === 'users' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserIcon className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
                  Gestion des Utilisateurs
                </h3>
                <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                  {users.length} Utilisateurs
                </span>
              </div>

              <div className="bg-zinc-950/50 rounded-xl border border-zinc-800 overflow-hidden">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">Aucun utilisateur enregistré.</div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {users.sort((a, b) => b.points - a.points).map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-500 font-bold">
                            {u.pseudo.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm md:text-base flex items-center gap-2">
                              {u.pseudo}
                              {u.id === user?.id && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Moi</span>}
                            </p>
                            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider">{u.level} • {u.points} pts</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteUser(u.id)} 
                          className="text-zinc-500 hover:text-red-500 p-2 rounded-lg transition-colors"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {profTab === 'share' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col items-center gap-6 md:gap-8 text-center">
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center justify-center gap-2">
                <QrCode className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
                Partager l'application
              </h3>
              <p className="text-zinc-400 text-sm">Affichez ce QR code en classe pour que vos élèves puissent s'entraîner.</p>
            </div>
            
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-2xl">
              <QRCodeCanvas 
                id="qr-code-canvas"
                value={shareUrl} 
                size={window.innerWidth < 640 ? 200 : 256}
                level="M"
                includeMargin={true}
              />
            </div>
            
            <div className="space-y-4 w-full max-w-md">
              <div className="space-y-1 text-left">
                <label className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase ml-1">URL de l'application</label>
                <input 
                  type="text"
                  value={shareUrl}
                  onChange={(e) => {
                    setShareUrl(e.target.value);
                    setShortUrl('');
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-[10px] md:text-sm font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="https://..."
                />
                <p className="text-[10px] text-zinc-500 mt-1 italic">
                  Si le QR code donne une erreur sur iPhone, c'est souvent dû à la longueur du lien. Utilisez le lien court ci-dessous.
                </p>
              </div>

              {shortUrl ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                  <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wider font-bold">Lien court alternatif</p>
                  <p className="text-xl md:text-2xl font-bold text-emerald-500 tracking-wider select-all">{shortUrl}</p>
                  <p className="text-[10px] text-zinc-500 mt-2">À écrire au tableau pour les élèves qui ne peuvent pas scanner le QR Code.</p>
                </div>
              ) : (
                <button 
                  onClick={async () => {
                    if (isGeneratingShortUrl) return;
                    setIsGeneratingShortUrl(true);
                    try {
                      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://is.gd/create.php?format=json&url=${encodeURIComponent(shareUrl)}`)}`);
                      const data = await response.json();
                      const parsed = JSON.parse(data.contents);
                      if (parsed.shorturl) {
                        setShortUrl(parsed.shorturl);
                      } else {
                        throw new Error("Erreur de l'API");
                      }
                    } catch (error) {
                      console.error('Error generating short URL:', error);
                      alert('Erreur lors de la génération du lien court. Veuillez réessayer.');
                    } finally {
                      setIsGeneratingShortUrl(false);
                    }
                  }}
                  disabled={isGeneratingShortUrl}
                  className={`w-full py-2 rounded-xl transition-colors font-bold text-sm border ${
                    isGeneratingShortUrl 
                      ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed' 
                      : 'bg-zinc-800 text-emerald-500 hover:bg-zinc-700 border-zinc-700'
                  }`}
                >
                  {isGeneratingShortUrl ? 'Génération en cours...' : 'Générer un lien court (pour écrire au tableau)'}
                </button>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors font-bold text-sm md:text-base"
                >
                  <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                  Copier le lien
                </button>
                
                <button 
                  onClick={() => {
                    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
                    if (canvas) {
                      const url = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = 'routemaster-qr.png';
                      link.href = url;
                      link.click();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-colors font-bold text-sm md:text-base"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30">
      {Header()}
      
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'identification' && IdentificationView()}
            {view === 'home' && HomeView()}
            {view === 'levels' && LevelsView()}
            {view === 'subjects' && SubjectsView()}
            {view === 'chapters' && ChaptersView()}
            {view === 'quiz' && QuizView()}
            {view === 'prof' && ProfView()}
            {view === 'ranking' && RankingView()}
            {view === 'shop' && ShopView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Vehicle viewer modal */}
      {viewingUser && (
        <VehicleModal targetUser={viewingUser} onClose={() => setViewingUser(null)} />
      )}

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 p-2 flex justify-around items-center z-50">
          <button onClick={() => setView('home')} className={`p-2 rounded-xl transition-all ${view === 'home' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}>
            <Home className="w-6 h-6" />
          </button>
          <button onClick={() => setView('levels')} className={`p-2 rounded-xl transition-all ${['levels', 'subjects', 'chapters', 'quiz'].includes(view) ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}>
            <GraduationCap className="w-6 h-6" />
          </button>
          <button onClick={() => setView('ranking')} className={`p-2 rounded-xl transition-all ${view === 'ranking' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}>
            <ListOrdered className="w-6 h-6" />
          </button>
          <button onClick={() => setView('shop')} className={`p-2 rounded-xl transition-all ${view === 'shop' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}>
            <ShoppingBag className="w-6 h-6" />
          </button>
          <button onClick={() => setView('prof')} className={`p-2 rounded-xl transition-all ${view === 'prof' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}>
            <Settings className="w-6 h-6" />
          </button>
        </nav>
      )}
    </div>
  );
}
