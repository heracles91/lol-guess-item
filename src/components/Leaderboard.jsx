import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import RankBadge from './RankBadge';

function Leaderboard({ onClose }) {
    // État local pour gérer l'onglet actif (par défaut 'attribute')
    const [currentView, setCurrentView] = useState('attribute'); 
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    // On recharge le classement à chaque fois que l'onglet change
    useEffect(() => {
        fetchLeaderboard();
    }, [currentView]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        // On construit le nom de la colonne dynamiquement : score_attribute ou score_price
        const column = `score_${currentView}`;

        const { data, error } = await supabase
        .from('profiles')
        .select(`username, ${column}`)
        .not('username', 'is', null)
        .gt(column, 0) // Optionnel : On ne montre que ceux qui ont un score > 0
        .order(column, { ascending: false })
        .limit(50);

        if (error) {
            console.error('Erreur leaderboard:', error);
        } else {
            setPlayers(data);
        }
    setLoading(false);
  };

  const getModeTitle = (mode) => {
    switch(mode) {
        case 'attribute': return "Guess the Attribute";
        case 'price': return "Guess the Price";
        case 'recipe': return "Guess the Recipe";
        default: return "Leaderboard";
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-lol-dark border-2 border-lol-gold w-full max-w-md h-[80vh] flex flex-col rounded-lg shadow-[0_0_30px_rgba(200,170,110,0.2)] relative">
        
        {/* En-tête avec Bouton Fermer */}
        <div className="p-4 border-b border-lol-gold/30 flex justify-between items-center bg-[#0F1923]">
            <h2 className="text-xl font-bold text-lol-gold tracking-widest uppercase">Classement</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* --- NOUVEAU : LES ONGLETS --- */}
        <div className="flex w-full border-b border-lol-gold/30">
            <button 
                onClick={() => setCurrentView('attribute')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors
                    ${currentView === 'attribute' ? 'bg-lol-gold text-black' : 'bg-[#091428] text-gray-500 hover:bg-gray-800'}
                `}
            >
                🔮 Stats
            </button>
            <button 
                onClick={() => setCurrentView('price')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-l border-lol-gold/30
                    ${currentView === 'price' ? 'bg-lol-gold text-black' : 'bg-[#091428] text-gray-500 hover:bg-gray-800'}
                `}
            >
                💰 Prix
            </button>
            <button 
              onClick={() => setCurrentView('recipe')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-l border-lol-gold/30
                  ${currentView === 'recipe' ? 'bg-lol-gold text-black' : 'bg-[#091428] text-gray-500 hover:bg-gray-800'}
              `}
          >
              🔨 Recette
          </button> 
        </div>

        {/* Liste Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {loading ? (
                <div className="text-center py-10 text-lol-blue animate-pulse">Chargement des invocateurs...</div>
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
                        {players.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-500 italic">Aucun score enregistré pour ce mode.</td></tr>
                        ) : (
                            players.map((player, index) => {
                                // On récupère dynamiquement le score de la colonne active
                                const playerScore = player[`score_${currentView}`];
                                
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
                                                <RankBadge score={playerScore} size='sm' />
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-mono text-lol-gold">{playerScore}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            )}
        </div>
        
        <div className="p-3 text-center text-[10px] text-gray-500 border-t border-lol-gold/30 bg-[#0F1923]">
            Mode affiché : {getModeTitle(currentView)}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;