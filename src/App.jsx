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
  const [highScore, setHighScore] = useState(0); // Score affiché actuellement
  // FIX 1 : On stocke TOUS les records dans un objet pour ne pas les mélanger
  const [allHighScores, setAllHighScores] = useState({ attribute: 0, price: 0 });
  
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  
  // États UI / FX
  const [isMuted, setIsMuted] = useState(false);
  const [shake, setShake] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const playSound = (type) => {
    if (isMuted) return;
    const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play error", e));
  };

  // --- INITIALISATION ---

  useEffect(() => {
    // Charge les scores locaux au démarrage (pour avoir quelque chose si pas de co)
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

  // FIX 2 : Chargement intelligent des scores locaux
  const loadLocalHighScores = () => {
    const attrScore = parseInt(localStorage.getItem('lol-quiz-highscore-attribute')) || 0;
    const priceScore = parseInt(localStorage.getItem('lol-quiz-highscore-price')) || 0;
    
    setAllHighScores({
        attribute: attrScore,
        price: priceScore
    });
  };

  // FIX 3 : Chargement des scores depuis la DB
  const fetchProfile = async (userId) => {
    const { data } = await supabase
        .from('profiles')
        .select('username, score_attribute, score_price')
        .eq('id', userId)
        .single();
        
    if (data) {
      setUsername(data.username);
      
      // On compare DB vs Local pour garder le meilleur
      const localAttr = parseInt(localStorage.getItem('lol-quiz-highscore-attribute')) || 0;
      const localPrice = parseInt(localStorage.getItem('lol-quiz-highscore-price')) || 0;
      
      const bestAttr = Math.max(localAttr, data.score_attribute || 0);
      const bestPrice = Math.max(localPrice, data.score_price || 0);

      // Mise à jour de l'état global
      setAllHighScores({
          attribute: bestAttr,
          price: bestPrice
      });

      // Si le local était meilleur, on sync avec la DB
      if (localAttr > (data.score_attribute || 0)) updateProfileScore(userId, 'attribute', localAttr);
      if (localPrice > (data.score_price || 0)) updateProfileScore(userId, 'price', localPrice);

    } else {
        await supabase.from('profiles').insert([{ id: userId, score_attribute: 0, score_price: 0 }]);
    }
  };

  const updateProfileScore = async (userId, mode, newScore) => {
    const column = `score_${mode}`; // 'score_attribute' ou 'score_price'
    await supabase.from('profiles').update({ [column]: newScore, updated_at: new Date() }).eq('id', userId);
  };

  const handleSetUsername = async (newUsername) => {
      if (!session) return;
      const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', session.user.id);
      if (!error) setUsername(newUsername);
  };

  // --- LOGIQUE JEU ---

  const nextRound = (specificMode = null) => {
    const effectiveMode = specificMode || gameMode;

    // Gestion du HighScore affiché
    const currentModeHighScore = allHighScores[effectiveMode] || 0;
    setHighScore(currentModeHighScore);

    if (lives <= 0) { setScore(0); setLives(3); }
    setUserGuess(null);
    setCorrectAnswer(null);
    setShake(false);

    // ====================================================
    // ÉTAPE 1 : SÉLECTION DE L'ITEM
    // ====================================================
    let item;

    // --- 1. SÉLECTION DE L'ITEM PRINCIPAL ---
    if (effectiveMode === 'price') {
       const pricedItems = itemsDataRaw.filter(i => typeof i.gold === 'number' && i.gold > 0);
       item = pricedItems[Math.floor(Math.random() * pricedItems.length)];
    } else if (effectiveMode === 'recipe') {
       // Pour la recette, on ne veut QUE des items qui ont des composants (from)
       const complexItems = itemsDataRaw.filter(i => i.from && i.from.length > 0);
       item = complexItems[Math.floor(Math.random() * complexItems.length)];
    }
    else {
      // Par défaut (Attribute)
       item = getRandomItem();
    }
    
    if (!item) {
      console.error("Aucun item trouvé pour le mode :", effectiveMode);
      return;
    } else {
      console.log(item);
    }

    setCurrentItem(item);

    // ====================================================
    // ÉTAPE 2 : GÉNÉRATION DES OPTIONS (Maintenant item existe !)
    // ====================================================
    
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
        // --- LOGIQUE INTELLIGENTE (Smart Fakes) ---
        
        // A. La bonne réponse
        const correctComponentId = item.from[Math.floor(Math.random() * item.from.length)];
        const correctComponent = itemsDataRaw.find(i => i.id === correctComponentId);

        // B. Les mauvaises réponses
        const targetPrice = correctComponent.gold; 
        const targetTags = item.tags || [];

        let smartFakes = itemsDataRaw.filter(i => {
            // 1. Pas l'objet lui-même, pas le bon composant, pas dans la recette
            if (i.id === correctComponentId || item.from.includes(i.id) || i.id === item.id) return false;
            
            // 2. Prix similaire (+/- 400 PO) pour éviter les écarts trop flagrants
            const isPriceSimilar = Math.abs(i.gold - targetPrice) <= 400;
            if (!isPriceSimilar) return false;

            // 3. Contexte similaire (partage au moins un tag)
            const hasSharedTag = i.tags && i.tags.some(tag => targetTags.includes(tag));
            return hasSharedTag;
        });

        // Sécurité : si on manque de fakes intelligents, on élargit
        if (smartFakes.length < 3) {
            smartFakes = itemsDataRaw.filter(i => 
                i.id !== correctComponentId && 
                !item.from.includes(i.id) &&
                i.gold < 3000 
            );
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
    else if (gameMode === 'recipe') isCorrect = (guess.id === correctAnswer.id)

    if (isCorrect) {
      playSound('success');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#C8AA6E', '#091428', '#CDFAFA'] });

      const newScore = score + 1;
      setScore(newScore);

      // FIX 5 : La correction critique est ici !
      // On compare le nouveau score avec le record DU MODE ACTUEL (dans allHighScores), pas le highScore affiché
      const currentRecord = allHighScores[gameMode] || 0;

      if (newScore > currentRecord) {
        // 1. On met à jour l'affichage
        setHighScore(newScore);
        
        // 2. On met à jour le "sac à dos"
        const newAllHighScores = { ...allHighScores, [gameMode]: newScore };
        setAllHighScores(newAllHighScores);
        
        // 3. Sauvegarde Locale
        localStorage.setItem(`lol-quiz-highscore-${gameMode}`, newScore);
        
        // 4. Sauvegarde DB
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

  // --- RENDER ---
  
  if (gameMode === 'menu') {
    return (
      <div className="max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative">
         <div className="w-full flex justify-between items-center mb-8">
            <button 
                onClick={() => setShowLeaderboard(true)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-lol-gold transition uppercase tracking-wider"
            >
                <span className="text-lg">🏆</span> Classement
            </button>

            {!session ? (
              <button onClick={() => setShowAuthModal(true)} className="text-xs text-lol-gold border border-lol-gold px-3 py-1.5 rounded hover:bg-lol-gold hover:text-black transition font-bold">
                CONNEXION
              </button>
            ) : (
                <div className="flex items-center gap-2">
                    {!username ? <span className="text-xs text-lol-blue animate-pulse">Profil...</span> : <span className="text-xs text-lol-blue font-bold">{username}</span>}
                    <button onClick={handleLogout} className="text-xs text-red-400 hover:text-white ml-2 font-bold">✕</button>
                </div>
            )}
         </div>

         <HomeMenu onSelectMode={(selectedMode) => {
             setGameMode(selectedMode);
             setTimeout(() => nextRound(selectedMode), 0);
         }} />

         {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
         {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
         
         <div className="mt-auto text-xs text-gray-500 py-4 opacity-50">Compatible Patch {PATCH_VERSION}</div>
      </div>
    );
  }

  if (!currentItem) return <div className="text-white p-10 flex justify-center">Chargement...</div>;

  return (
    <div className={`max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative ${shake ? 'animate-shake' : ''}`}>
      
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex gap-3 items-center">
             <button 
                onClick={() => { setGameMode('menu'); setScore(0); setLives(3); }}
                className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1 border border-gray-700 px-2 py-1 rounded"
            >
                ← MENU
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className="text-xl text-gray-400 hover:text-white transition ml-2">
                {isMuted ? '🔇' : '🔊'}
            </button>
        </div>

        {!session ? (
          <button onClick={() => setShowAuthModal(true)} className="text-xs text-lol-gold border border-lol-gold px-2 py-1 rounded hover:bg-lol-gold hover:text-black transition">
            CONNEXION
          </button>
        ) : (
            <div className="flex items-center gap-2">
                {!username ? (
                     <input type="text" placeholder="Pseudo..." className="bg-transparent border-b border-lol-gold text-lol-gold text-xs outline-none w-20 text-right" onKeyDown={(e) => { if(e.key === 'Enter') handleSetUsername(e.target.value) }} />
                ) : (
                    <span className="text-xs text-lol-blue font-bold">{username}</span>
                )}
            </div>
        )}
      </div>

      <Header score={score} lives={lives} highScore={highScore} />
      
      <ItemCard item={currentItem} />
      
      <OptionsGrid options={options} userGuess={userGuess} correctAnswer={correctAnswer} onGuess={handleGuess} gameMode={gameMode} />

      {userGuess && (
        <button 
          onClick={() => nextRound()} 
          className="w-full py-4 bg-lol-gold text-lol-dark font-bold text-lg rounded uppercase tracking-wider hover:brightness-110 transition animate-bounce"
        >
          {gameMode === 'price' ? (userGuess === correctAnswer ? 'Continuer' : 'Suivant') : (currentItem.tags.includes(userGuess) ? 'Continuer' : 'Suivant')}
        </button>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      
      <div className="mt-auto text-xs text-gray-500 py-4 opacity-50">
        {gameMode === 'recipe' ? 'Trouve le composant manquant' : `Compatible Patch ${PATCH_VERSION}`}
      </div>
    </div>
  );
}

export default App;