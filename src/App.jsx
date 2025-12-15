import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import itemsDataRaw from './data/items.json';
import { VALID_TAGS, PATCH_VERSION } from './utils/constants';
import { supabase } from './utils/supabaseClient';

import Header from './components/Header';
import ItemCard from './components/ItemCard';
import OptionsGrid from './components/OptionsGrid';
import GameOver from './components/GameOver';
import AuthModal from './components/AuthModal';
import Leaderboard from './components/Leaderboard';
import HomeMenu from './components/HomeMenu';
import SettingsModal from './components/SettingsModal'; // <--- NOUVEL IMPORT

// --- FONCTIONS UTILITAIRES ---

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

const getRandomItem = () => {
    const validItems = itemsDataRaw.filter(item => item.tags && item.tags.some(tag => VALID_TAGS.includes(tag)));
    return validItems[Math.floor(Math.random() * validItems.length)];
};

// --- APP ---

function App() {
  // États Jeu
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentItem, setCurrentItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [userGuess, setUserGuess] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [gameMode, setGameMode] = useState('menu');
  
  // États Scores & Data
  const [highScore, setHighScore] = useState(0);
  const [allHighScores, setAllHighScores] = useState({ attribute: 0, price: 0, recipe: 0 });
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  
  // États UI / FX
  const [isMuted, setIsMuted] = useState(false);
  const [shake, setShake] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // NOUVEAUX ÉTATS POUR LES RÉGLAGES
  const [showSettings, setShowSettings] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  
  const playSound = (type) => {
    if (isMuted) return;
    const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play error", e));
  };

  // --- INITIALISATION ---

  useEffect(() => {
    loadLocalHighScores();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUsername(null);
        loadLocalHighScores();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadLocalHighScores = () => {
    const attrScore = parseInt(localStorage.getItem('lol-quiz-highscore-attribute')) || 0;
    const priceScore = parseInt(localStorage.getItem('lol-quiz-highscore-price')) || 0;
    const recipeScore = parseInt(localStorage.getItem('lol-quiz-highscore-recipe')) || 0;
    
    setAllHighScores({ attribute: attrScore, price: priceScore, recipe: recipeScore });
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase
        .from('profiles')
        .select('username, score_attribute, score_price, score_recipe')
        .eq('id', userId)
        .single();
        
    if (data) {
      setUsername(data.username);
      
      const localAttr = parseInt(localStorage.getItem('lol-quiz-highscore-attribute')) || 0;
      const localPrice = parseInt(localStorage.getItem('lol-quiz-highscore-price')) || 0;
      const localRecipe = parseInt(localStorage.getItem('lol-quiz-highscore-recipe')) || 0;
      
      const bestAttr = Math.max(localAttr, data.score_attribute || 0);
      const bestPrice = Math.max(localPrice, data.score_price || 0);
      const bestRecipe = Math.max(localRecipe, data.score_recipe || 0);

      setAllHighScores({ attribute: bestAttr, price: bestPrice, recipe: bestRecipe });

      if (localAttr > (data.score_attribute || 0)) updateProfileScore(userId, 'attribute', localAttr);
      if (localPrice > (data.score_price || 0)) updateProfileScore(userId, 'price', localPrice);
      if (localRecipe > (data.score_recipe || 0)) updateProfileScore(userId, 'recipe', localRecipe);

    } else {
        await supabase.from('profiles').insert([{ id: userId, score_attribute: 0, score_price: 0, score_recipe: 0 }]);
    }
  };

  const updateProfileScore = async (userId, mode, newScore) => {
    const column = `score_${mode}`;
    await supabase.from('profiles').update({ [column]: newScore, updated_at: new Date() }).eq('id', userId);
  };

  // Gestion mise à jour pseudo (avec gestion d'erreur pour le modal)
  const handleSetUsername = async (newUsername) => {
    if (!newUsername || !newUsername.trim()) return;
    
    if (!session) {
        setUsername(newUsername); // Changement local si pas connecté
        return;
    }

    const cleanUsername = newUsername.trim();
    if (cleanUsername.length < 3) {
        setUsernameError("3 caractères minimum !");
        return;
    }
    setUsernameError('');

    const { error } = await supabase
      .from('profiles')
      .update({ username: cleanUsername })
      .eq('id', session.user.id);
    
    if (error) {
        if (error.code === '23505') setUsernameError("Ce pseudo est déjà pris !");
        else setUsernameError("Erreur de sauvegarde.");
    } else {
        setUsername(cleanUsername);
        setUsernameError('');
    }
  };

  // --- LOGIQUE JEU ---

  const nextRound = (specificMode = null) => {
    const effectiveMode = specificMode || gameMode;
    const currentModeHighScore = allHighScores[effectiveMode] || 0;
    setHighScore(currentModeHighScore);

    if (lives <= 0) { setScore(0); setLives(3); }
    setUserGuess(null);
    setCorrectAnswer(null);
    setShake(false);

    let item;
    // 1. Sélection Item
    if (effectiveMode === 'price') {
       const pricedItems = itemsDataRaw.filter(i => typeof i.gold === 'number' && i.gold > 0);
       item = pricedItems[Math.floor(Math.random() * pricedItems.length)];
    } 
    else if (effectiveMode === 'recipe') {
       const complexItems = itemsDataRaw.filter(i => i.from && i.from.length > 0);
       item = complexItems[Math.floor(Math.random() * complexItems.length)];
    }
    else {
       item = getRandomItem();
    }
    
    if (!item) return;
    setCurrentItem(item);

    // 2. Génération Options
    if (effectiveMode === 'attribute') {
        const itemTags = item.tags.filter(t => VALID_TAGS.includes(t));
        if (itemTags.length === 0) return nextRound(effectiveMode);

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
        const correctComponent = itemsDataRaw.find(i => i.id === correctComponentId);

        const targetPrice = correctComponent.gold; 
        const targetTags = item.tags || [];

        let smartFakes = itemsDataRaw.filter(i => {
            if (i.id === correctComponentId || item.from.includes(i.id) || i.id === item.id) return false;
            const isPriceSimilar = Math.abs(i.gold - targetPrice) <= 400;
            if (!isPriceSimilar) return false;
            const hasSharedTag = i.tags && i.tags.some(tag => targetTags.includes(tag));
            return hasSharedTag;
        });

        if (smartFakes.length < 3) {
            smartFakes = itemsDataRaw.filter(i => i.id !== correctComponentId && !item.from.includes(i.id) && i.gold < 3000);
        }

        const wrongComponents = smartFakes.sort(() => 0.5 - Math.random()).slice(0, 3);
        setCorrectAnswer(correctComponent);
        setOptions([correctComponent, ...wrongComponents].sort(() => 0.5 - Math.random()));
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
        setAllHighScores({ ...allHighScores, [gameMode]: newScore });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setScore(0);
    setLives(3);
    window.location.reload();
  };

  // --- RENDER (AFFICHAGE) ---
  
  // 1. BLOC MENU
  if (gameMode === 'menu') {
    return (
      <div className="max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative">
         
         {/* BARRE DU HAUT (MENU) */}
         <div className="w-full flex justify-between items-center mb-8 px-2">
            <div className="flex gap-3 items-center">
                 <button 
                    onClick={() => setShowLeaderboard(true)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-lol-gold transition uppercase tracking-wider"
                >
                    <span className="text-lg">🏆</span>
                </button>
            </div>

            <div className="flex items-center gap-3">
                {session ? (
                    <span className="text-xs text-lol-blue font-bold">{username || "Invocateur"}</span>
                ) : (
                    <button onClick={() => setShowAuthModal(true)} className="text-[10px] text-lol-gold border border-lol-gold px-2 py-1 rounded hover:bg-lol-gold hover:text-black transition uppercase font-bold">
                        Connexion
                    </button>
                )}
                {/* BOUTON RÉGLAGES */}
                <button onClick={() => setShowSettings(true)} className="text-xl text-gray-400 hover:text-white transition hover:rotate-90 duration-300">⚙️</button>
            </div>
         </div>

         <HomeMenu onSelectMode={(selectedMode) => {
             setGameMode(selectedMode);
             setTimeout(() => nextRound(selectedMode), 0);
         }} />

         {/* LES MODALES DU MENU */}
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
            />
         )}
         
         <div className="mt-auto text-xs text-gray-500 py-4 opacity-50">Compatible Patch {PATCH_VERSION}</div>
      </div>
    );
  }

  // 2. BLOC JEU
  if (!currentItem) return <div className="text-white p-10 flex justify-center">Chargement...</div>;

  return (
    <div className={`max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative ${shake ? 'animate-shake' : ''}`}>
      
      {/* BARRE DU HAUT (JEU) */}
      <div className="w-full flex justify-between items-center mb-4 px-2">
        <div className="flex gap-3 items-center">
             <button 
                onClick={() => { setGameMode('menu'); setScore(0); setLives(3); }}
                className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1 border border-gray-700 px-2 py-1 rounded"
            >
                ← MENU
            </button>
        </div>

        <div className="flex items-center gap-3">
            {session ? (
                <span className="text-xs text-lol-blue font-bold">{username || "Invocateur"}</span>
            ) : (
                <button onClick={() => setShowAuthModal(true)} className="text-[10px] text-lol-gold border border-lol-gold px-2 py-1 rounded hover:bg-lol-gold hover:text-black transition uppercase font-bold">
                    Connexion
                </button>
            )}
            {/* BOUTON RÉGLAGES */}
            <button onClick={() => setShowSettings(true)} className="text-xl text-gray-400 hover:text-white transition hover:rotate-90 duration-300">⚙️</button>
        </div>
      </div>

      <Header score={score} lives={lives} highScore={highScore} />
      
      <ItemCard item={currentItem} revealed={userGuess !== null} />
      
      <OptionsGrid options={options} userGuess={userGuess} correctAnswer={correctAnswer} onGuess={handleGuess} gameMode={gameMode} />

      {userGuess && (
        <button 
          onClick={() => nextRound()} 
          className="w-full py-4 bg-lol-gold text-lol-dark font-bold text-lg rounded uppercase tracking-wider hover:brightness-110 transition animate-bounce"
        >
          Continuer
        </button>
      )}

      {/* LES MODALES DU JEU */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showSettings && (
        <SettingsModal 
            onClose={() => setShowSettings(false)}
            isMuted={isMuted}
            toggleMute={() => setIsMuted(!isMuted)}
            username={username}
            onUpdateUsername={handleSetUsername}
            usernameError={usernameError}
        />
      )}
      
      <div className="mt-auto text-xs text-gray-500 py-4 opacity-50">
        {gameMode === 'recipe' ? 'Trouve le composant manquant' : `Compatible Patch ${PATCH_VERSION}`}
      </div>
    </div>
  );
}

export default App;