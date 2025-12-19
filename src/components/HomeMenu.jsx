import { useEffect, useState } from 'react';
import { hasPlayedDailyToday } from '../utils/dailyRandom';

function HomeMenu({ onSelectMode, t }) {
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
        
        {/* BOUTON DAILY */}
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
          <div className="absolute top-2 right-2">
            {dailyDone ? '✅' : '🔥'}
          </div>

          <div className="text-xl font-bold mb-1 text-white">
            {t.mode_daily}
          </div>
          <div className="text-xs text-gray-300">
            {dailyDone ? t.daily_done : t.daily_desc}
          </div>
        </button>

        {/* BOUTON ATTRIBUTS */}
        <button 
          onClick={() => onSelectMode('attribute')}
          className="bg-lol-card border border-lol-gold p-6 rounded hover:bg-lol-gold hover:text-black transition group"
        >
          <div className="text-xl font-bold mb-1 group-hover:scale-105 transition-transform">🔮 {t.mode_attribute}</div>
        </button>

        {/* BOUTON PRIX */}
        <button 
          onClick={() => onSelectMode('price')}
          className="bg-lol-card border border-lol-gold p-6 rounded hover:bg-lol-gold hover:text-black transition group"
        >
           <div className="text-xl font-bold mb-1 group-hover:scale-105 transition-transform">💰 {t.mode_price}</div>
        </button>

        {/* BOUTON RECETTE */}
        <button 
          onClick={() => onSelectMode('recipe')}
          className="bg-lol-card border border-lol-gold p-6 rounded hover:bg-lol-gold hover:text-black transition group"
        >
           <div className="text-xl font-bold mb-1 group-hover:scale-105 transition-transform">🔨 {t.mode_recipe}</div>
        </button>

      </div>
    </div>
  );
}

export default HomeMenu;