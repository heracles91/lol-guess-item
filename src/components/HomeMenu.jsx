import { useEffect, useState } from 'react';
import { hasPlayedDailyToday } from '../utils/dailyRandom'; // Importe la fonction

function HomeMenu({ onSelectMode }) {
  const [dailyDone, setDailyDone] = useState(false);

  useEffect(() => {
    setDailyDone(hasPlayedDailyToday());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in w-full">
      <h1 className="text-4xl font-bold text-lol-gold mb-8 text-center uppercase tracking-widest drop-shadow-lg">
        League Quiz
      </h1>

      <div className="grid gap-4 w-full max-w-sm">
        
        {/* --- NOUVEAU : BOUTON DAILY --- */}
        <button 
          onClick={() => !dailyDone && onSelectMode('daily')}
          disabled={dailyDone}
          className={`
            relative p-6 rounded border transition group overflow-hidden
            ${dailyDone 
                ? 'bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-lol-gold hover:scale-105 hover:brightness-110'
            }
          `}
        >
          {/* Badge "Nouveau" ou "Fait" */}
          <div className="absolute top-2 right-2">
            {dailyDone ? '✅' : '🔥'}
          </div>

          <div className="text-xl font-bold mb-1 text-white">
            📅 Défi Quotidien
          </div>
          <div className="text-xs text-gray-300">
            {dailyDone ? 'Reviens demain !' : 'Un objet unique pour tous'}
          </div>
        </button>
        
        <button 
          onClick={() => onSelectMode('attribute')}
          className="bg-lol-card border border-lol-gold p-6 rounded hover:bg-lol-gold hover:text-black transition group"
        >
          <div className="text-xl font-bold mb-1 group-hover:scale-105 transition-transform">🔮 Guess the Attribute</div>
          <div className="text-xs text-gray-400 group-hover:text-gray-800">Devine les attributs</div>
        </button>

        <button 
          onClick={() => onSelectMode('price')}
          className="bg-lol-card border border-lol-gold p-6 rounded hover:bg-lol-gold hover:text-black transition group"
        >
          <div className="text-xl font-bold mb-1 group-hover:scale-105 transition-transform">💰 Guess the Price</div>
          <div className="text-xs text-gray-400 group-hover:text-gray-800">Quel est le coût total ?</div>
        </button>

        <button 
          onClick={() => onSelectMode('recipe')} // <--- On active le mode 'recipe'
          className="bg-lol-card border border-lol-gold p-6 rounded hover:bg-lol-gold hover:text-black transition group"
        >
          <div className="text-xl font-bold mb-1 group-hover:scale-105 transition-transform">🔨 Guess the Recipe</div>
          <div className="text-xs text-gray-400 group-hover:text-gray-800">Trouve le composant manquant</div>
        </button>
      </div>
    </div>
  );
}

export default HomeMenu;