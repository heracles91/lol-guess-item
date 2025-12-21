import { useState } from 'react';
import { getRankData } from '../utils/ranks';

function GameOver({ score, onRestart, gameMode, t }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const rank = getRankData(score);
    
    // On récupère le nom du mode traduit proprement
    let modeLabel = "";
    if (gameMode === 'price') modeLabel = t.mode_price;
    else if (gameMode === 'recipe') modeLabel = t.mode_recipe;
    else if (gameMode === 'attribute') modeLabel = t.mode_attribute;
    else if (gameMode === 'daily') modeLabel = t.mode_daily;

    const text = `🛡️ LoL Quiz | ${modeLabel}\n🏆 ${t.score} : ${score} (${rank.name})\n🔗 ${t.playhere} : https://lol-guess-item.vercel.app`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-lol-dark text-lol-gold p-4 animate-fade-in w-full">
      <h1 className="text-5xl font-bold mb-2 text-red-500 tracking-widest uppercase drop-shadow-md">{t.defeat}</h1>
      
      <div className="bg-lol-card border border-lol-gold p-8 rounded-lg text-center shadow-2xl mb-8 w-full max-w-sm relative">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-lol-dark border border-lol-gold px-4 py-1 rounded-full text-xs uppercase tracking-widest text-gray-400">
            {t.summary}
        </div>

        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2 mt-4">{t.score}</p>
        <p className="text-6xl font-bold text-white mb-8">{score}</p>
        
        <button 
            onClick={handleShare}
            className={`w-full py-3 rounded font-bold transition flex items-center justify-center gap-2 mb-4 border
                ${copied 
                    ? 'bg-green-800 border-green-600 text-white' 
                    : 'bg-[#091428] border-lol-gold/50 text-lol-gold hover:bg-gray-800'}
            `}
        >
            {copied ? `✅ ${t.copied}` : t.share}
        </button>

        <button 
            onClick={onRestart}
            className="w-full px-8 py-3 bg-lol-gold text-lol-dark font-bold rounded hover:bg-yellow-600 transition uppercase tracking-wider"
        >
            {t.replay}
        </button>
      </div>
    </div>
  );
}

export default GameOver;