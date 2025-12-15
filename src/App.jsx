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

// --- FONCTIONS UTILITAIRES (En dehors du composant pour éviter les erreurs de scope) ---

const generatePriceOptions = (correctPrice) => {
  // Sécurité : si le prix n'est pas un nombre, on renvoie des options par défaut pour ne pas planter
  if (typeof correctPrice !== 'number') {
      console.error("ERREUR CRITIQUE : correctPrice n'est pas un nombre !", correctPrice);
      return [0, 0, 0, 0];
  }

  const variations = [-200, -100, -50, 50, 100, 150, 200, 300, 400];
  const wrongPrices = new Set();
  let safetyCounter = 0; // Sécurité anti boucle infinie
  
  while (wrongPrices.size < 3 && safetyCounter < 100) {
    const randomVar = variations[Math.floor(Math.random() * variations.length)];
    const price = correctPrice + randomVar;
    
    if (price > 0 && price !== correctPrice) {
      wrongPrices.add(price);
    }
    safetyCounter++;
  }

  // Mélange final
  return [correctPrice, ...Array.from(wrongPrices)].sort(() => 0.5 - Math.random());
};

const getRandomItem = () => {
    // Filtrage standard pour le mode attributs
    const validItems = itemsDataRaw.filter(item => item.tags && item.tags.some(tag => VALID_TAGS.includes(tag)));
    return validItems[Math.floor(Math.random() * validItems.length)];
};


// --- COMPOSANT PRINCIPAL ---

function App() {
  // États Jeu
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentItem, setCurrentItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [userGuess, setUserGuess] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [gameMode, setGameMode] = useState('menu'); // 'menu', 'attribute', 'price'
  
  // États Audio & FX
  const [isMuted, setIsMuted] = useState(false);
  const [shake, setShake] = useState(false);

  // États Utilisateur
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  const [highScore, setHighScore] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const playSound = (type) => {
    if (isMuted) return;
    const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play error", e));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else loadLocalHighScore();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUsername(null);
        loadLocalHighScore();
      }
    });

    // Au démarrage, on initialise juste le menu, pas besoin de lancer un round
    return () => subscription.unsubscribe();
  }, []);

  const loadLocalHighScore = (mode = 'attribute') => {
    const local = parseInt(localStorage.getItem(`lol-quiz-highscore-${mode}`)) || 0;
    setHighScore(local);
  };

  const fetchProfile = async (userId) => {
    // On récupère score_attribute et score_price
    const { data } = await supabase
        .from('profiles')
        .select('username, score_attribute, score_price')
        .eq('id', userId)
        .single();
        
    if (data) {
      setUsername(data.username);
      // On sauvegarde tout dans un état global ou on met à jour le highScore courant selon le mode
      // Pour faire simple : on stocke les scores dans un objet state caché, ou on recharge le highScore quand on change de mode.
      // -> Option simple : On recharge juste le highScore local du mode 'attribute' par défaut au début
      const modeScore = gameMode === 'price' ? (data.score_price || 0) : (data.score_attribute || 0);
      setHighScore(modeScore);
      
      // Note: Le localStorage devient plus complexe à gérer avec plusieurs modes. 
      // Pour l'instant, on se fie surtout à la DB si connecté.
    } else {
        await supabase.from('profiles').insert([{ id: userId, score_attribute: 0, score_price: 0 }]);
    }
  };

  const updateProfileScore = async (userId, newScore) => {
    // On détermine dynamiquement le nom de la colonne : 'score_attribute', 'score_price', 'score_recipe'
    const column = `score_${gameMode}`; 
    
    // La syntaxe [column] permet d'utiliser une variable comme clé
    await supabase.from('profiles').update({ [column]: newScore, updated_at: new Date() }).eq('id', userId);
  };

  const handleSetUsername = async (newUsername) => {
      if (!session) return;
      const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', session.user.id);
      if (!error) setUsername(newUsername);
  };

  // --- COEUR DU JEU ---

  const nextRound = (specificMode = null) => {
    const effectiveMode = specificMode || gameMode;

    // Si le mode a changé, on recharge le bon High Score
    if (specificMode && specificMode !== gameMode) {
        if (session) {
            // Si connecté, on refait un fetch rapide (ou mieux: on stocke les scores en cache, mais fetch est plus simple)
            fetchProfile(session.user.id);
        } else {
            loadLocalHighScore(effectiveMode);
        }
    }

    if (lives <= 0) {
      setScore(0);
      setLives(3);
    }
    setUserGuess(null);
    setCorrectAnswer(null);
    setShake(false);

    // 1. CHOIX DE L'ITEM
    let item;
    if (effectiveMode === 'price') {
       // On vérifie que gold est bien un nombre
       const pricedItems = itemsDataRaw.filter(i => typeof i.gold === 'number' && i.gold > 0);
       
       if (pricedItems.length === 0) {
           console.error("ERREUR JSON : Aucun item avec 'gold' valide trouvé !");
           return;
       }
       item = pricedItems[Math.floor(Math.random() * pricedItems.length)];

    } else {
       // Mode Attributs (ou défaut)
       item = getRandomItem();
    }
    
    if (!item) {
        console.error("Impossible de trouver un item !");
        return;
    }
    
    setCurrentItem(item);

    // 2. GÉNÉRATION DES OPTIONS
    if (effectiveMode === 'attribute') {
        const itemTags = item.tags.filter(t => VALID_TAGS.includes(t));
        if (itemTags.length === 0) return nextRound(effectiveMode); // Retry

        const goodTag = itemTags[Math.floor(Math.random() * itemTags.length)];
        setCorrectAnswer(goodTag);
        
        const badTagsPool = VALID_TAGS.filter(t => !item.tags.includes(t));
        const badTags = badTagsPool.sort(() => 0.5 - Math.random()).slice(0, 3);
        setOptions([goodTag, ...badTags].sort(() => 0.5 - Math.random()));

    } else if (effectiveMode === 'price') {
        const price = item.gold;

        setCorrectAnswer(price);
        
        // On appelle la fonction externe
        const priceOptions = generatePriceOptions(price);
        
        setOptions(priceOptions);
    }
  };

  const handleGuess = (guess) => {
    if (userGuess) return;
    setUserGuess(guess);

    let isCorrect = false;

    if (gameMode === 'attribute') {
        isCorrect = currentItem.tags.includes(guess);
    } else if (gameMode === 'price') {
        isCorrect = (guess === currentItem.gold);
    }

    if (isCorrect) {
      playSound('success');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C8AA6E', '#091428', '#CDFAFA']
      });

      // Dans le bloc "if (isCorrect)"
      const newScore = score + 1;
      setScore(newScore);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        // On utilise une clé localStorage différente par mode pour éviter les conflits
        localStorage.setItem(`lol-quiz-highscore-${gameMode}`, newScore);
        
        if (session) updateProfileScore(session.user.id, newScore);
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
              <button 
                onClick={() => setShowAuthModal(true)}
                className="text-xs text-lol-gold border border-lol-gold px-3 py-1.5 rounded hover:bg-lol-gold hover:text-black transition font-bold"
              >
                CONNEXION
              </button>
            ) : (
                <div className="flex items-center gap-2">
                    {!username ? (
                        <span className="text-xs text-lol-blue animate-pulse">Profil...</span>
                    ) : (
                        <span className="text-xs text-lol-blue font-bold">{username}</span>
                    )}
                    <button onClick={handleLogout} className="text-xs text-red-400 hover:text-white ml-2 font-bold">✕</button>
                </div>
            )}
         </div>

         <HomeMenu onSelectMode={(selectedMode) => {
             setGameMode(selectedMode);
             // On passe directement le mode sélectionné
             setTimeout(() => nextRound(selectedMode), 0);
         }} />

         {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
         {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
         
         <div className="mt-auto text-xs text-gray-500 py-4">Version 1.3 - Multi-Modes</div>
      </div>
    );
  }

  // ÉCRAN DE JEU
  if (!currentItem) return <div className="text-white p-10 flex justify-center">Chargement...</div>;

  return (
    <div className={`max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative ${shake ? 'animate-shake' : ''}`}>
      
      {/* HEADER JEU */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex gap-3 items-center">
             <button 
                onClick={() => {
                    setGameMode('menu');
                    setScore(0);
                    setLives(3);
                }}
                className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1 border border-gray-700 px-2 py-1 rounded"
            >
                ← MENU
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className="text-xl text-gray-400 hover:text-white transition ml-2">
                {isMuted ? '🔇' : '🔊'}
            </button>
        </div>

        {!session ? (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="text-xs text-lol-gold border border-lol-gold px-2 py-1 rounded hover:bg-lol-gold hover:text-black transition"
          >
            CONNEXION
          </button>
        ) : (
            <div className="flex items-center gap-2">
                {!username ? (
                     <input 
                        type="text" 
                        placeholder="Pseudo..."
                        className="bg-transparent border-b border-lol-gold text-lol-gold text-xs outline-none w-20 text-right"
                        onKeyDown={(e) => { if(e.key === 'Enter') handleSetUsername(e.target.value) }}
                    />
                ) : (
                    <span className="text-xs text-lol-blue font-bold">{username}</span>
                )}
            </div>
        )}
      </div>

      <Header score={score} lives={lives} highScore={highScore} />
      
      <ItemCard item={currentItem} />
      
      <OptionsGrid 
        options={options} 
        userGuess={userGuess} 
        correctAnswer={correctAnswer} 
        onGuess={handleGuess} 
        gameMode={gameMode} 
      />

      {userGuess && (
        <button 
          onClick={() => nextRound()} // Pas besoin d'argument ici, il prendra le gameMode actuel
          className="w-full py-4 bg-lol-gold text-lol-dark font-bold text-lg rounded uppercase tracking-wider hover:brightness-110 transition animate-bounce"
        >
          {gameMode === 'price' 
            ? (userGuess === correctAnswer ? 'Continuer' : 'Suivant')
            : (currentItem.tags.includes(userGuess) ? 'Continuer' : 'Suivant')
          }
        </button>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      
      <div className="mt-auto text-xs text-gray-500 py-4" opacity-50>
        Mode: {gameMode === 'price' ? 'Devine le Prix' : 'Devine les Stats'} | Compatible Patch {PATCH_VERSION}
      </div>
    </div>
  );
}

export default App;