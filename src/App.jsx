import { useState, useEffect } from 'react';
// Import JSON formatté avec le script python
import itemsDataRaw from './data/items.json';
import { VALID_TAGS } from './utils/constants';

// Import des nouveaux composants
import Header from './components/Header';
import ItemCard from './components/ItemCard';
import OptionsGrid from './components/OptionsGrid';
import GameOver from './components/GameOver';

function App() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentItem, setCurrentItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [userGuess, setUserGuess] = useState(null); // Stocke le tag cliqué par le joueur
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('lol-quiz-highscore')) || 0;
  });

  // Initialisation au chargement
  useEffect(() => {
    nextRound();
  }, []);

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
    if (userGuess) return; // Empêche le double clic

    setUserGuess(tag); // On enregistre ce que le joueur a cliqué

    const isCorrect = currentItem.tags.includes(tag);

    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      // Mise à jour du High Score si nécessaire
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('lol-quiz-highscore', newScore);
      }
    } else {
      setLives(lives - 1);
    }
  };

  if (!currentItem) return <div className="text-white">Chargement de la Faille...</div>;

  // Écran Game Over
  // On vérifie : 
  // 1. Si on n'a plus de vies
  // 2. Si le joueur a joué (userGuess existe)
  // 3. Si la réponse donnée n'est PAS dans les tags de l'objet (donc c'est une erreur)
  if (lives <= 0 && userGuess && !currentItem.tags.includes(userGuess)) {
    return <GameOver score={score} onRestart={nextRound} />
  }

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col items-center w-full min-h-screen">
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
      
      <div className="mt-auto text-xs text-gray-500 py-4">
        League of Legends Guess the Attribute
      </div>
    </div>
  );
}

export default App;