import { useState, useEffect } from 'react';
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

function App() {
  // États Jeu
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentItem, setCurrentItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [userGuess, setUserGuess] = useState(null); // Stocke le tag cliqué par le joueur
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  /* const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('lol-quiz-highscore')) || 0;
  }); */

  // États Utilisateur & Data
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  const [highScore, setHighScore] = useState(0); // On commence à 0 par défaut
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

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

  const nextRound = () => {
    if (lives <= 0) {
      setScore(0);
      setLives(3);
    }
    
    setUserGuess(null);
    setCorrectAnswer(null);

    const item = getRandomItem();
    setCurrentItem(item);

    // 1. Identifier les tags valides de cet objet
    const itemTags = item.tags.filter(t => VALID_TAGS.includes(t));
    // Choisir une "vraie" réponse au hasard
    const goodTag = itemTags[Math.floor(Math.random() * itemTags.length)];
    setCorrectAnswer(goodTag);

    // 2. Générer les mauvaises réponses
    const badTagsPool = VALID_TAGS.filter(t => !item.tags.includes(t));
    // Mélanger et prendre 3 mauvaises réponses
    const badTags = badTagsPool.sort(() => 0.5 - Math.random()).slice(0, 3);

    // 3. Mélanger le tout
    const allOptions = [goodTag, ...badTags].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };

  const handleGuess = (tag) => {
    if (userGuess) return;
    setUserGuess(tag);

    if (currentItem.tags.includes(tag)) {
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
      setLives(lives - 1);
    }
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

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen relative">

      {/* BARRE DU HAUT : Classement à gauche, Login à droite */}
      <div className="w-full flex justify-between items-center mb-4">
        
        {/* BOUTON CLASSEMENT */}
        <button 
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-lol-gold transition uppercase tracking-wider"
        >
            <span className="text-lg">🏆</span> Classement
        </button>
        {/* SECTION LOGIN */}
        {!session ? (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="text-xs text-lol-gold border border-lol-gold px-2 py-1 rounded hover:bg-lol-gold hover:text-black transition"
          >
            SE CONNECTER
          </button>
        ) : (
            <div className="flex items-center gap-2 relative">
                {/* Si pas de pseudo, input simple */}
                {!username ? (
                    <div className="flex flex-col items-end">
                        <input 
                            type="text" 
                            placeholder="Choisis un pseudo..."
                            className={`bg-transparent border-b text-xs outline-none w-32 transition-colors
                                ${usernameError ? 'border-red-500 text-red-400 placeholder-red-400' : 'border-lol-gold text-lol-gold'}
                            `}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleSetUsername(e.target.value)
                            }}
                        />
                        {/* Affichage de l'erreur juste en dessous */}
                        {usernameError && (
                            <span className="text-[10px] text-red-500 absolute top-full right-0 mt-1 whitespace-nowrap font-bold animate-pulse">
                                {usernameError}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-lol-blue">Invocateur : {username}</span>
                )}
                
                {/* Bouton de déconnexion */}
                <button onClick={handleLogout} className="text-xs text-red-400 hover:text-white ml-2">X</button>
            </div>
        )}
      </div>

      {/* HEADER */}
      <Header score={score} lives={lives} highScore={highScore} />

      {/* ITEM CARD */}
      <ItemCard item={currentItem} />

      {/* OPTIONS GRID */}
      <OptionsGrid
        options={options}
        userGuess={userGuess}
        correctAnswer={correctAnswer}
        onGuess={handleGuess}
      />

      {/* BOUTON NEXT */}
      {userGuess && (
        <button 
          onClick={nextRound}
          className="w-full py-4 bg-lol-gold text-lol-dark font-bold text-lg rounded uppercase tracking-wider hover:brightness-110 transition animate-bounce"
        >
          {/* On compare la réponse du joueur avec la bonne réponse pour changer le texte */}
          {currentItem.tags.includes(userGuess) ? 'Continuer' : 'Suivant'}
        </button>
      )}

      {/* Modale de Connexion */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      
      <div className="mt-auto text-xs text-gray-500 py-4">
        League of Legends Guess the Attribute
      </div>
    </div>
  );
}

export default App;