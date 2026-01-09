import RankBadge from './RankBadge';
import { getRankData } from '../utils/ranks';

function Header({ score, lives, highScore, streak }) {
  const currentRank = getRankData(highScore);

  return (
    <div className="w-full flex justify-between items-center mb-6 text-lg font-bold border-b border-lol-gold/30 pb-4">

      {/* EFFET VISUEL EN ARRIÈRE PLAN SI GROS STREAK */}
      {streak >= 3 && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent animate-pulse pointer-events-none"></div>
      )}
      
      {/* Partie Gauche : Score actuel */}
      <div className="flex flex-col">
        <span className="text-xs text-lol-blue uppercase tracking-widest">Score</span>
        <span className="text-2xl text-white">{score}</span>
        {/* AFFICHAGE DU STREAK */}
            {streak >= 3 && (
                <div className="flex items-center gap-1 text-orange-500 font-bold animate-bounce text-sm">
                    <span>🔥</span>
                    <span>x{streak}</span>
                </div>
            )}
      </div>
      
      {/* Partie Centrale : Vies */}
      <div className="flex gap-1 absolute left-1/2 transform -translate-x-1/2">
        {[...Array(3)].map((_, i) => (
          <span key={i} className={`text-2xl transition-all duration-300 ${i < lives ? 'text-red-500 scale-100' : 'text-gray-800 scale-75 blur-sm'}`}>
            ♥
          </span>
        ))}
      </div>

      {/* Partie Droite : Le Rang et l'Emblème */}
      <div className="flex items-center gap-3 text-right">
        <div className="flex items-center gap-3">
          <RankBadge score={highScore} size='md' />
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Record</span>
          <span className={`text-sm font-bold ${currentRank.color}`}>
            {currentRank.name}
          </span>
          <span className="text-xs text-lol-gold">{highScore} LP</span>
        </div>
      </div>
    </div>
  );
}


export default Header;
