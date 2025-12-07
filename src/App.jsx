import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
// Import JSON formatté avec le script python
import itemsDataRaw from './data/items.json';
import { VALID_TAGS } from './utils/constants';
import { supabase } from './utils/supabaseClient';

// Import des nouveaux composants
import Header from './components/Header';
import ItemCard from './components/ItemCard';
import OptionsGrid from './components/OptionsGrid';
import GameOver from './components/GameOver';
import AuthModal from './components/AuthModal';
import Leaderboard from './components/Leaderboard';
import HomeMenu from './components/HomeMenu';

function App() {
  // États Jeu
  const [gameMode, setGameMode] = useState('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentItem, setCurrentItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [userGuess, setUserGuess] = useState(null); // Stocke le tag cliqué par le joueur
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // États Audio & FX
  const [isMuted, setIsMuted] = useState(false); // État du son
  const [shake, setShake] = useState(false);     // État tremblement

  // États Utilisateur & Data
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  const [highScore, setHighScore] = useState(0); // On commence à 0 par défaut
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // NOUVEAU : Gestionnaire de sons
  const playSound = (type) => {
    if (isMuted) return;
    const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
    audio.volume = 0.5; // 50% volume
    audio.play().catch(e => console.log("Audio play error", e));
  };

  // 1. Initialisation Auth & Jeu
  useEffect(() => {
    // Vérifier la session active au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else loadLocalHighScore(); // Si pas connecté, on prend le localStorage
    });

    // Écouter les changements de connexion (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUsername(null);
        loadLocalHighScore();
      }
    });

    nextRound();
    return () => subscription.unsubscribe();
  }, []);// Charge le score local (mode invité)
  const loadLocalHighScore = () => {
    const local = parseInt(localStorage.getItem('lol-quiz-highscore')) || 0;
    setHighScore(local);
    setLoadingProfile(false);
  };

  // Charge le profil depuis Supabase
  const fetchProfile = async (userId) => {
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, best_score')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = Aucun résultat trouvé
        console.error('Erreur fetch profile:', error);
      }

      if (data) {
        setUsername(data.username);
        // On prend le meilleur score entre le local (si le joueur a joué avant de se co) et la DB
        const local = parseInt(localStorage.getItem('lol-quiz-highscore')) || 0;
        const dbScore = data.best_score || 0;
        
        // Si le local est meilleur, on met à jour la DB tout de suite
        if (local > dbScore) {
          setHighScore(local);
          updateProfileScore(userId, local);
        } else {
          setHighScore(dbScore);
          // On synchronise le local pour être cohérent
          localStorage.setItem('lol-quiz-highscore', dbScore);
        }
      } else {
        // Premier login : on crée le profil vide
        await supabase.from('profiles').insert([{ id: userId, best_score: 0 }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Met à jour le score dans la DB
  const updateProfileScore = async (userId, newScore) => {
    await supabase
      .from('profiles')
      .update({ best_score: newScore, updated_at: new Date() })
      .eq('id', userId);
  };

  // Demander un pseudo si manquant
  const handleSetUsername = async (newUsername) => {
      if (!session) return;
      
      // 1. Petit nettoyage (enlever les espaces avant/après)
      const cleanUsername = newUsername.trim();
      if (cleanUsername.length < 3) {
          setUsernameError("3 caractères minimum !");
          return;
      }

      setUsernameError(''); // On efface les anciennes erreurs

      // 2. Tentative de mise à jour
      const { error } = await supabase
        .from('profiles')
        .update({ username: cleanUsername })
        .eq('id', session.user.id);
      
      // 3. Gestion des erreurs
      if (error) {
          // Le code '23505' est le code PostgreSQL pour "Unique violation"
          if (error.code === '23505') {
              setUsernameError("Ce pseudo est déjà pris, désolé !");
          } else {
              console.error(error);
              setUsernameError("Erreur lors de la sauvegarde.");
          }
      } else {
          // Succès
          setUsername(cleanUsername);
          setUsernameError('');
      }
    };

  // --- LOGIQUE JEU ---

  const getRandomItem = () => {
    // Filtrage de sécurité pour ne prendre que les items qui ont des tags valides
    const validItems = itemsDataRaw.filter(item => 
      item.tags && item.tags.some(tag => VALID_TAGS.includes(tag))
    );
    const randomIndex = Math.floor(Math.random() * validItems.length);
    return validItems[randomIndex];
  };

  const nextRound = (specificMode = null) => {
    // 1. On détermine quel mode utiliser (celui forcé OU celui de l'état actuel)
    const effectiveMode = specificMode || gameMode;
    
    console.log("Mode actif pour ce round :", effectiveMode); // DEBUG

    // Gestion des Vies / Score (inchangé)
    if (lives <= 0) { setScore(0); setLives(3); }
    setUserGuess(null);
    setCorrectAnswer(null);
    setShake(false);

    // 1. Choisir un item (on filtre ceux qui ont un prix si mode prix)
    let item;
    if (gameMode === 'price') {
       // On ne prend que les items qui ont un prix > 0
       const pricedItems = itemsDataRaw.filter(i => i.gold && i.gold > 0);
       
       // Sécurité : si aucun item n'est trouvé (bug JSON), on prend un item au hasard pour éviter le crash
       if (pricedItems.length === 0) {
           console.error("ERREUR JSON : Aucun item avec un prix > 0 trouvé ! Vérifie ton JSON.");
           return; 
       }

       item = pricedItems[Math.floor(Math.random() * pricedItems.length)];
    } else {
       item = getRandomItem(); // Ta fonction actuelle
    }
    setCurrentItem(item);
    console.log("Item choisi :", item.name); // DEBUG

    // 2. Générer les questions selon le mode
    if (gameMode === 'attribute') {
        // --- LOGIQUE ATTRIBUTS (Ton code actuel) ---
        const itemTags = item.tags.filter(t => VALID_TAGS.includes(t));
        // (Sécurité si l'item n'a pas de tags valides, on relance)
        if (itemTags.length === 0) return nextRound();

        const goodTag = itemTags[Math.floor(Math.random() * itemTags.length)];
        setCorrectAnswer(goodTag);
        
        const badTagsPool = VALID_TAGS.filter(t => !item.tags.includes(t));
        const badTags = badTagsPool.sort(() => 0.5 - Math.random()).slice(0, 3);
        setOptions([goodTag, ...badTags].sort(() => 0.5 - Math.random()));

    } else if (gameMode === 'price') {
        // --- LOGIQUE PRIX (Nouveau) ---
        const price = item.gold;
        setCorrectAnswer(price); // La bonne réponse est un nombre (ex: 3000)
        
        // Générer les options
        const priceOptions = generatePriceOptions(price);
        setOptions(priceOptions);
        console.log("Options générées :", priceOptions); // DEBUG
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
      // --- SUCCESS ---
      playSound('success');
      // Confettis
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C8AA6E', '#091428', '#CDFAFA']
      });
      const newScore = score + 1;
      setScore(newScore);
      
      // Gestion du High Score (Local + DB)
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('lol-quiz-highscore', newScore);
        // Si connecté, on sauvegarde en base
        if (session) {
            updateProfileScore(session.user.id, newScore);
        }
      }
    } else {
      // --- ECHEC ---
      playSound('error');
      setShake(true); // Active l'animation
      setTimeout(() => setShake(false), 500); // Désactive après 0.5s
      setLives(lives - 1);
    }
  };

  const generatePriceOptions = (correctPrice) => {
  // On crée des variations (ex: -200, +100, -50...)
  const variations = [-200, -100, -50, 50, 100, 150, 200, 300, 400];
  const wrongPrices = new Set();
  
  while (wrongPrices.size < 3) {
    const randomVar = variations[Math.floor(Math.random() * variations.length)];
    const price = correctPrice + randomVar;
    // On s'assure que le prix est positif et différent du vrai
    if (price > 0 && price !== correctPrice) {
      wrongPrices.add(price);
    }
  }
  return [correctPrice, ...Array.from(wrongPrices)].sort(() => 0.5 - Math.random());
};

  // Déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setScore(0);
    setLives(3);
    window.location.reload(); // Simple refresh pour nettoyer l'état
  };

  if (!currentItem) return <div className="text-white">Chargement de la Faille...</div>;

  // --- RENDER ---

  // Écran Game Over
  // On vérifie : 
  // 1. Si on n'a plus de vies
  // 2. Si le joueur a joué (userGuess existe)
  // 3. Si la réponse donnée n'est PAS dans les tags de l'objet (donc c'est une erreur)
  if (lives <= 0 && userGuess && !currentItem.tags.includes(userGuess)) {
    return <GameOver score={score} onRestart={nextRound} />
  }

  // --- RENDER ---

  // 1. ÉCRAN MENU
  if (gameMode === 'menu') {
    return (
      <div className="max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative">
         {/* Barre du haut (Login/Leaderboard) accessible depuis le menu */}
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
                        <span className="text-xs text-lol-blue animate-pulse">Profil incomplet...</span>
                    ) : (
                        <span className="text-xs text-lol-blue font-bold">{username}</span>
                    )}
                    <button onClick={handleLogout} className="text-xs text-red-400 hover:text-white ml-2 font-bold">✕</button>
                </div>
            )}
         </div>

         {/* Le Menu Principal */}
         <HomeMenu onSelectMode={(mode) => {
             setGameMode(mode);
             // On force un petit délai pour que l'état se mette à jour avant de lancer le round
             setTimeout(() => {
                 // Important : Assure-toi que ta fonction nextRound gère bien le mode ici
                 // (comme vu dans l'étape précédente)
                 nextRound(mode); 
             }, 0);
         }} />

         {/* Modales accessibles depuis le menu */}
         {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
         {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
         
         <div className="mt-auto text-xs text-gray-500 py-4">Version 1.2 - PWA Ready</div>
      </div>
    );
  }

  // 2. ÉCRAN DE JEU (Attribute ou Price)
  return (
    <div className={`max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative ${shake ? 'animate-shake' : ''}`}>
      
      {/* Barre Header Jeu */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex gap-3 items-center">
             {/* Bouton Retour Menu */}
             <button 
                onClick={() => {
                    setGameMode('menu');
                    setScore(0); // Optionnel : Reset le score quand on quitte ?
                    setLives(3);
                }}
                className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1 border border-gray-700 px-2 py-1 rounded"
            >
                ← MENU
            </button>

            {/* Bouton Mute */}
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-xl text-gray-400 hover:text-white transition ml-2"
            >
                {isMuted ? '🔇' : '🔊'}
            </button>
        </div>

        {/* Partie Droite (User) */}
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
      
      {/* GRILLE D'OPTIONS (Avec le GameMode) */}
      <OptionsGrid 
        options={options} 
        userGuess={userGuess} 
        correctAnswer={correctAnswer} 
        onGuess={handleGuess} 
        gameMode={gameMode}
      />

      {userGuess && (
        <button 
          onClick={nextRound}
          className="w-full py-4 bg-lol-gold text-lol-dark font-bold text-lg rounded uppercase tracking-wider hover:brightness-110 transition animate-bounce"
        >
          {/* Texte dynamique selon la réponse */}
          {gameMode === 'price' 
            ? (userGuess === correctAnswer ? 'Continuer' : 'Suivant')
            : (currentItem.tags.includes(userGuess) ? 'Continuer' : 'Suivant')
          }
        </button>
      )}

      {/* Modales (aussi accessibles en jeu) */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      
      <div className="mt-auto text-xs text-gray-500 py-4">
        Mode: {gameMode === 'price' ? 'Devine le Prix' : 'Devine les Stats'}
      </div>
    </div>
  );
}

export default App;