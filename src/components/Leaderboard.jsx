import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getRankData, getRankImage } from '../utils/ranks';

function Leaderboard({ onClose }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // On récupère les 50 meilleurs scores qui ont un pseudo
    const { data, error } = await supabase
      .from('profiles')
      .select('username, best_score')
      .not('username', 'is', null) // On ignore ceux qui n'ont pas mis de pseudo
      .order('best_score', { ascending: false })
      .limit(50);

    if (error) console.error('Erreur leaderboard:', error);
    else setPlayers(data);
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-lol-dark border-2 border-lol-gold w-full max-w-md h-[80vh] flex flex-col rounded-lg shadow-[0_0_30px_rgba(200,170,110,0.2)] relative">
        
        {/* Titre */}
        <div className="p-4 border-b border-lol-gold/30 flex justify-between items-center bg-[#0F1923]">
            <h2 className="text-xl font-bold text-lol-gold tracking-widest uppercase">Classement</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Liste Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {loading ? (
                <div className="text-center py-10 text-lol-blue animate-pulse">Chargement des données...</div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-lol-dark z-10">
                        <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Invocateur</th>
                            <th className="p-2 text-right">Rang</th>
                            <th className="p-2 text-right">LP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, index) => {
                            const rank = getRankData(player.best_score);
                            // Top 3 en couleur
                            let rowClass = "border-b border-gray-800 hover:bg-white/5 transition";
                            let textClass = "text-gray-300";
                            if (index === 0) textClass = "text-yellow-400 font-bold"; 
                            if (index === 1) textClass = "text-gray-300 font-bold";
                            if (index === 2) textClass = "text-orange-400 font-bold";

                            return (
                                <tr key={index} className={rowClass}>
                                    <td className={`p-3 ${textClass}`}>{index + 1}</td>
                                    <td className="p-3 font-medium truncate max-w-[120px]">{player.username}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {/* Petit icône de rang */}
                                            <img src={getRankImage(rank.id)} alt={rank.name} className="w-6 h-6 object-contain scale-150" />
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-mono text-lol-gold">{player.best_score}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
        
        <div className="p-3 text-center text-xs text-gray-500 border-t border-lol-gold/30 bg-[#0F1923]">
            Seuls les invocateurs avec un pseudo apparaissent ici.
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;