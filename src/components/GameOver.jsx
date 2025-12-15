import { useState } from 'react';
import { getRankData } from '../utils/ranks';

function GameOver({ score, onRestart, gameMode }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const rank = getRankData(score);
    // On traduit le mode pour l'affichage
    const modeLabel = gameMode === 'price' ? 'Prix' : (gameMode === 'recipe' ? 'Recette' : 'Stats');
    
    // Le texte stylé à copier
    const text = `🛡️ LoL Quiz | Mode : ${modeLabel}\n🏆 Score : ${score} (${rank.name})\n🔗 Joue ici : https://lol-guess-item.kameni.fr`; // Mets ton URL Vercel ici

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset le texte après 2s
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-lol-dark text-lol-gold p-4 animate-fade-in w-full">
      <h1 className="text-5xl font-bold mb-2 text-red-500 tracking-widest uppercase drop-shadow-md">Défaite</h1>
      
      <div className="bg-lol-card border border-lol-gold p-8 rounded-lg text-center shadow-2xl mb-8 w-full max-w-sm relative">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-lol-dark border border-lol-gold px-4 py-1 rounded-full text-xs uppercase tracking-widest text-gray-400">
            Résumé
        </div>

        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2 mt-4">Score Final</p>
        <p className="text-6xl font-bold text-white mb-8">{score}</p>
        
        {/* Bouton Partager */}
        <button 
            onClick={handleShare}
            className={`w-full py-3 rounded font-bold transition flex items-center justify-center gap-2 mb-4 border
                ${copied 
                    ? 'bg-green-800 border-green-600 text-white' 
                    : 'bg-[#091428] border-lol-gold/50 text-lol-gold hover:bg-gray-800'}
            `}
        >
            {copied ? 'Copié dans le presse-papier ! ✅' : 'Partager mon score 📤'}
        </button>

        <button 
            onClick={onRestart}
            className="w-full px-8 py-3 bg-lol-gold text-lol-dark font-bold rounded hover:bg-yellow-600 transition uppercase tracking-wider"
        >
            Rejouer
        </button>
      </div>
    </div>
  );
}

export default GameOver;