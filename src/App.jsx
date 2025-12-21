import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// IMPORTS DES DEUX LANGUES
import itemsFr from './data/items_fr.json';
import itemsEn from './data/items_en.json';

import { VALID_TAGS, PATCH_VERSION } from './utils/constants';
import { supabase } from './utils/supabaseClient';
import { getDailyItemIndex, saveDailyResult, getYesterdayDate } from './utils/dailyRandom';
// IMPORT TRADUCTION
import { TRANSLATIONS } from './utils/translations';

import Header from './components/Header';
import ItemCard from './components/ItemCard';
import OptionsGrid from './components/OptionsGrid';
import SearchBar from './components/SearchBar';
import GameOver from './components/GameOver';
import AuthModal from './components/AuthModal';
import Leaderboard from './components/Leaderboard';
import HomeMenu from './components/HomeMenu';
import SettingsModal from './components/SettingsModal';

// --- FONCTIONS UTILITAIRES (Modifiées pour accepter itemsData en paramètre) ---

const generatePriceOptions = (correctPrice) => {
  if (typeof correctPrice !== 'number') return [0, 0, 0, 0];
  const variations = [-200, -100, -50, 50, 100, 150, 200, 300, 400];
  const wrongPrices = new Set();
  let safetyCounter = 0;
  while (wrongPrices.size < 3 && safetyCounter < 100) {
    const randomVar = variations[Math.floor(Math.random() * variations.length)];
    const price = correctPrice + randomVar;
    if (price > 0 && price !== correctPrice) wrongPrices.add(price);
    safetyCounter++;
  }
  return [correctPrice, ...Array.from(wrongPrices)].sort(() => 0.5 - Math.random());
};

const getRandomItem = (data) => {
    const validItems = data.filter(item => item.tags && item.tags.some(tag => VALID_TAGS.includes(tag)));
    return validItems[Math.floor(Math.random() * validItems.length)];
};

function App() {
  // États Jeu
  const [language, setLanguage] = useState('fr'); // 'fr' ou 'en'
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentItem, setCurrentItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [userGuess, setUserGuess] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [gameMode, setGameMode] = useState('menu'); 
  const [dailySelection, setDailySelection] = useState(null);
  
  // États Scores & User
  const [highScore, setHighScore] = useState(0);
  const [allHighScores, setAllHighScores] = useState({ attribute: 0, price: 0, recipe: 0, daily: 0 });
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  
  // États UI
  const [isMuted, setIsMuted] = useState(false);
  const [shake, setShake] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [timeLeft, setTimeLeft] = useState(5); // 5 secondes
  const TIMER_DURATION = 5;
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);

  // --- DONNÉES DYNAMIQUES SELON LA LANGUE ---
  const currentItemsData = language === 'fr' ? itemsFr : itemsEn;
  const t = TRANSLATIONS[language]; // Le dictionnaire actuel

  // --- AUDIO ---
  const playSound = (type) => {
    if (isMuted) return;
    const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play error", e));
  };

  // --- INITIALISATION ---
  useEffect(() => {
    // Récupérer la langue sauvegardée
    const savedLang = localStorage.getItem('lol-quiz-lang');
    if (savedLang) setLanguage(savedLang);

    // Charger l'état du timer
    const savedTimer = localStorage.getItem('lol-quiz-timer');
    if (savedTimer !== null) {
        setIsTimerEnabled(JSON.parse(savedTimer));
    }

    loadLocalHighScores();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setUsername(null); loadLocalHighScores(); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- GESTION DU TIMER ---
  useEffect(() => {
    // Le timer ne tourne pas si :
    // 1. On est dans le menu
    // 2. Le joueur a déjà répondu (userGuess existe)
    // 3. Le jeu est fini (lives <= 0)
    // 4. On est en mode 'daily' (pas de timer)
    // 5. L'objet n'est pas encore chargé
    if (gameMode === 'menu' || userGuess || lives <= 0 || gameMode === 'daily' || !currentItem || !isTimerEnabled) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);

  }, [timeLeft, userGuess, gameMode, lives, currentItem]);

  // Fonction pour changer la langue
  const toggleLanguage = () => {
      const newLang = language === 'fr' ? 'en' : 'fr';
      setLanguage(newLang);
      localStorage.setItem('lol-quiz-lang', newLang);
      // Si on est en jeu, on recharge le round pour mettre à jour les textes de l'item
      if (gameMode !== 'menu') {
          // On fait un petit reset soft pour éviter les incohérences
          nextRound(gameMode, newLang);
      }
  };

  // ... (loadLocalHighScores, fetchProfile, updateProfileScore, handleSetUsername restent identiques) ...
  const loadLocalHighScores = () => {
    setAllHighScores({
        attribute: parseInt(localStorage.getItem('lol-quiz-highscore-attribute')) || 0,
        price: parseInt(localStorage.getItem('lol-quiz-highscore-price')) || 0,
        recipe: parseInt(localStorage.getItem('lol-quiz-highscore-recipe')) || 0,
        daily: 0
    });
  };

  const toggleTimer = () => {
      const newState = !isTimerEnabled;
      setIsTimerEnabled(newState);
      localStorage.setItem('lol-quiz-timer', JSON.stringify(newState));
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('username, score_attribute, score_price, score_recipe').eq('id', userId).single(); 
    if (data) {
      setUsername(data.username);
      const localScores = {
          attribute: parseInt(localStorage.getItem('lol-quiz-highscore-attribute')) || 0,
          price: parseInt(localStorage.getItem('lol-quiz-highscore-price')) || 0,
          recipe: parseInt(localStorage.getItem('lol-quiz-highscore-recipe')) || 0,
      };
      const bestScores = {
          attribute: Math.max(localScores.attribute, data.score_attribute || 0),
          price: Math.max(localScores.price, data.score_price || 0),
          recipe: Math.max(localScores.recipe, data.score_recipe || 0),
          daily: 0
      };
      setAllHighScores(bestScores);
    } else {
        await supabase.from('profiles').insert([{ id: userId, score_attribute: 0, score_price: 0, score_recipe: 0 }]);
    }
  };

  const updateProfileScore = async (userId, mode, newScore) => {
    if (mode === 'daily') return;
    const column = `score_${mode}`;
    await supabase.from('profiles').update({ [column]: newScore, updated_at: new Date() }).eq('id', userId);
  };
  
  const handleSetUsername = async (newUsername) => {
    if (!newUsername || !newUsername.trim()) return;
    if (!session) { setUsername(newUsername); return; }
    const cleanUsername = newUsername.trim();
    if (cleanUsername.length < 3) { setUsernameError("3 chars min !"); return; }
    setUsernameError('');
    const { error } = await supabase.from('profiles').update({ username: cleanUsername }).eq('id', session.user.id);
    if (error) {
        if (error.code === '23505') setUsernameError("Pris ! / Taken!");
        else setUsernameError("Error.");
    } else {
        setUsername(cleanUsername); setUsernameError(''); setShowSettings(false);
    }
  };


  const restartGame = () => {
    setScore(0);
    setLives(3);
    nextRound();
  };

  // MODIFIÉ : Accepte une langue optionnelle pour forcer le dataset
  const nextRound = (specificMode = null, forcedLang = null) => {
    const effectiveMode = specificMode || gameMode;
    const dataToUse = forcedLang ? (forcedLang === 'fr' ? itemsFr : itemsEn) : currentItemsData;
    
    if (effectiveMode === 'daily' && userGuess) { setLives(0); return; }

    setHighScore(allHighScores[effectiveMode] || 0);
    setUserGuess(null);
    setCorrectAnswer(null);
    setShake(false);
    setDailySelection(null);
    setTimeLeft(TIMER_DURATION);

    let item;
    if (effectiveMode === 'daily') {
       const validItems = dataToUse.filter(i => i.tags && i.tags.some(t => VALID_TAGS.includes(t)));
       const dailyIndex = getDailyItemIndex(validItems.length);
       item = validItems[dailyIndex];
    } else if (effectiveMode === 'price') {
       const pricedItems = dataToUse.filter(i => typeof i.gold === 'number' && i.gold > 0);
       item = pricedItems[Math.floor(Math.random() * pricedItems.length)];
    } else if (effectiveMode === 'recipe') {
       const complexItems = dataToUse.filter(i => i.from && i.from.length > 0);
       item = complexItems[Math.floor(Math.random() * complexItems.length)];
    } else {
       item = getRandomItem(dataToUse);
    }
    
    if (!item) return;
    setCurrentItem(item);

    if (effectiveMode === 'attribute') {
        const itemTags = item.tags.filter(t => VALID_TAGS.includes(t));
        if (itemTags.length === 0) return nextRound(effectiveMode, forcedLang);
        const goodTag = itemTags[Math.floor(Math.random() * itemTags.length)];
        setCorrectAnswer(goodTag);
        const badTagsPool = VALID_TAGS.filter(t => !item.tags.includes(t));
        const badTags = badTagsPool.sort(() => 0.5 - Math.random()).slice(0, 3);
        setOptions([goodTag, ...badTags].sort(() => 0.5 - Math.random()));
    } else if (effectiveMode === 'price') {
        const price = item.gold;
        setCorrectAnswer(price);
        setOptions(generatePriceOptions(price));
    } else if (effectiveMode === 'recipe') {
        const correctComponentId = item.from[Math.floor(Math.random() * item.from.length)];
        const correctComponent = dataToUse.find(i => i.id === correctComponentId);
        
        const targetPrice = correctComponent.gold; // ex: 1100
        const targetTags = item.tags || [];
        
        // Smart fakes logic simplifiée pour l'exemple (utilise dataToUse)
        //let smartFakes = dataToUse.filter(i => i.id !== correctComponentId && !item.from.includes(i.id) && i.gold < 3000);
        let smartFakes = dataToUse.filter(i => {
            if (i.id === correctComponentId || item.from.includes(i.id) || i.id === item.id) return false;
            const isPriceSimilar = Math.abs(i.gold - targetPrice) <= 400;
            if (!isPriceSimilar) return false;
            const hasSharedTag = i.tags && i.tags.some(tag => targetTags.includes(tag));
            return hasSharedTag;
        });
        const wrongComponents = smartFakes.sort(() => 0.5 - Math.random()).slice(0, 3);
        setCorrectAnswer(correctComponent);
        setOptions([correctComponent, ...wrongComponents].sort(() => 0.5 - Math.random()));
    } else if (effectiveMode === 'daily') {
        setCorrectAnswer(item.name);
    }
  };

  const handleDailySubmit = () => {
      if (!dailySelection) return;
      const isCorrect = dailySelection.name === currentItem.name;
      setUserGuess(dailySelection);
      if (isCorrect) {
          playSound('success');
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#C8AA6E', '#091428', '#CDFAFA'] });
          saveDailyResult(1);
          setScore(1);
      } else {
          playSound('error');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          saveDailyResult(0);
          setScore(0);
      }
  };

  const handleGuess = (guess) => {
    if (userGuess) return;
    setUserGuess(guess);
    let isCorrect = false;
    if (gameMode === 'attribute') isCorrect = currentItem.tags.includes(guess);
    else if (gameMode === 'price') isCorrect = (guess === currentItem.gold);
    else if (gameMode === 'recipe') isCorrect = (guess.id === correctAnswer.id);

    if (isCorrect) {
      playSound('success');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#C8AA6E', '#091428', '#CDFAFA'] });
      const newScore = score + 1;
      setScore(newScore);
      const currentRecord = allHighScores[gameMode] || 0;
      if (newScore > currentRecord) {
        setHighScore(newScore);
        const newAllHighScores = { ...allHighScores, [gameMode]: newScore };
        setAllHighScores(newAllHighScores);
        localStorage.setItem(`lol-quiz-highscore-${gameMode}`, newScore);
        if (session) updateProfileScore(session.user.id, gameMode, newScore);
      }
    } else {
      playSound('error');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLives(lives - 1);
    }
  };

  const handleTimeout = () => {
    playSound('error');
    setShake(true);
    setTimeout(() => setShake(false), 500);
    
    // On met une valeur "TIMEOUT" pour dire qu'il n'a rien répondu
    setUserGuess('TIMEOUT'); 
    setLives(lives - 1);
  };

  // --- CALCUL OBJET HIER (DAILY) ---
  let yesterdayItem = null;
  if (gameMode === 'daily') {
      const validItems = currentItemsData.filter(i => i.tags && i.tags.some(t => VALID_TAGS.includes(t)));
      const yesterdayDate = getYesterdayDate();
      const yesterdayIndex = getDailyItemIndex(validItems.length, yesterdayDate);
      yesterdayItem = validItems[yesterdayIndex];
  }

  // --- RENDER ---

  if (gameMode === 'menu') {
    return (
      <div className="max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative">
         <div className="w-full flex justify-between items-center mb-8 px-2">
            <button onClick={() => setShowLeaderboard(true)} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-lol-gold transition uppercase tracking-wider">
                <span className="text-lg">🏆</span>
            </button>
            <div className="flex items-center gap-3">
                {!session ? (
                    <button onClick={() => setShowAuthModal(true)} className="text-[10px] text-lol-gold border border-lol-gold px-2 py-1 rounded hover:bg-lol-gold hover:text-black transition uppercase font-bold">{t.menu_play}</button>
                ) : (
                    <span className="text-xs text-lol-blue font-bold">{username || t.guest}</span>
                )}
                <button onClick={() => setShowSettings(true)} className="text-xl text-gray-400 hover:text-white transition hover:rotate-90 duration-300">⚙️</button>
            </div>
         </div>
         
         {/* Passage de 't' au menu */}
         <HomeMenu onSelectMode={(m) => { setGameMode(m); setTimeout(() => nextRound(m), 0); }} t={t} />

         {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
         {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
         {showSettings && (
            <SettingsModal 
                onClose={() => setShowSettings(false)} 
                isMuted={isMuted} 
                toggleMute={() => setIsMuted(!isMuted)} 
                username={username} 
                onUpdateUsername={handleSetUsername} 
                usernameError={usernameError} 
                language={language} 
                toggleLanguage={toggleLanguage} 
                t={t}
            />
         )}
         <div className="mt-auto text-xs text-gray-500 py-4 opacity-50">{t.compatible} {PATCH_VERSION}</div>
      </div>
    );
  }

  if (lives <= 0) {
      // On passe 't' au GameOver
      return <GameOver score={score} onRestart={restartGame} gameMode={gameMode} t={t} />;
  }

  if (!currentItem) return <div className="text-white p-10 flex justify-center animate-pulse">{t.loading}</div>;

  return (
    <div className={`max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative ${shake ? 'animate-shake' : ''}`}>
      <div className="w-full flex justify-between items-center mb-6 px-2">
        <div className="flex gap-3 items-center">
             <button onClick={() => { setGameMode('menu'); setScore(0); setLives(3); }} className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1 border border-gray-700 px-2 py-1 rounded">{t.back_menu}</button>
        </div>
        <div className="flex items-center gap-3">
            {!session ? (
                <button onClick={() => setShowAuthModal(true)} className="text-[10px] text-lol-gold border border-lol-gold px-2 py-1 rounded hover:bg-lol-gold hover:text-black transition uppercase font-bold">{t.menu_play}</button>
            ) : (
                <span className="text-xs text-lol-blue font-bold">{username || t.guest}</span>
            )}
            <button onClick={() => setShowSettings(true)} className="text-xl text-gray-400 hover:text-white transition hover:rotate-90 duration-300">⚙️</button>
        </div>
      </div>

      <Header score={score} lives={lives} highScore={highScore} />
      
      <ItemCard item={currentItem} revealed={userGuess !== null} isMystery={gameMode === 'daily'} />
      
      {/* BARRE DE TIMER */}
      {isTimerEnabled && gameMode !== 'daily' && gameMode !== 'menu' && !userGuess && (
        <div className="w-full max-w-md mb-4 px-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-bold uppercase">
                <span>Temps restant</span>
                <span className={`${timeLeft <= 2 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
                <div 
                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 2 ? 'bg-red-600' : 'bg-lol-gold'}`}
                    style={{ width: `${(timeLeft / TIMER_DURATION) * 100}%` }}
                ></div>
            </div>
        </div>
      )}

      {/* GRILLE D'OPTIONS */}
      {gameMode === 'daily' ? (
        <div className="w-full flex flex-col items-center gap-4 mb-8 max-w-md">
            {yesterdayItem && (
                <div className="w-full bg-lol-dark/50 border border-gray-700 rounded p-2 flex items-center justify-center gap-3 mb-2 animate-fade-in opacity-80">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{t.yesterday}</span>
                    <img src={`https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION}/img/item/${yesterdayItem.image.full}`} alt={yesterdayItem.name} className="w-6 h-6 rounded border border-gray-600" />
                    <span className="text-xs text-lol-gold font-bold">{yesterdayItem.name}</span>
                </div>
            )}
            {!userGuess ? (
                <>
                    <SearchBar items={currentItemsData} onSelect={(item) => setDailySelection(item)} t={t} />
                    <button onClick={handleDailySubmit} disabled={!dailySelection} className={`w-full py-4 font-bold text-lg rounded uppercase tracking-wider transition ${dailySelection ? 'bg-lol-gold text-lol-dark hover:brightness-110 animate-pulse' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>
                        {t.confirm}
                    </button>
                </>
            ) : (
                <button onClick={() => { setGameMode('menu'); setScore(0); setLives(3); }} className="w-full py-4 bg-gray-800 border border-gray-600 text-gray-300 font-bold text-lg rounded uppercase tracking-wider hover:bg-gray-700 hover:text-white transition">
                  {t.back_menu_btn}
                </button>
            )}
        </div>
      ) : (
        <OptionsGrid options={options} userGuess={userGuess} correctAnswer={correctAnswer} onGuess={handleGuess} gameMode={gameMode} t={t} />
      )}

      {userGuess && gameMode !== 'daily' && (
        <button onClick={() => nextRound()} className="w-full py-4 bg-lol-gold text-lol-dark font-bold text-lg rounded uppercase tracking-wider hover:brightness-110 transition animate-bounce">
          {gameMode === 'price' ? (userGuess === correctAnswer ? t.continue : t.next) : (currentItem.tags.includes(userGuess) ? t.continue : t.next)}
        </button>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)} username={username} onUpdateUsername={handleSetUsername} usernameError={usernameError} language={language} toggleLanguage={toggleLanguage} timerEnabled={isTimerEnabled} toggleTimer={toggleTimer} t={t} />}
      
      <div className="mt-auto text-xs text-gray-500 py-4 opacity-50">{t.compatible} {PATCH_VERSION}</div>
    </div>
  );
}

export default App;