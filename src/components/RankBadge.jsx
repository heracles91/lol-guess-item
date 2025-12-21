import { getRankData, getRankImage } from '../utils/ranks';

function RankBadge({ score, size = "md", showName = false }) {
    const rank = getRankData(score);
    const imageUrl = getRankImage(rank.id);

    // Tailles disponibles
    const sizes = {
        sm: "w-8 h-8",   // Pour le leaderboard
        md: "w-12 h-12", // Pour le header
        lg: "w-24 h-24"  // Pour le Game Over
    };

    return (
        <div className="flex flex-col items-center justify-center">
            {/* Conteneur avec overflow-hidden pour rogner le vide si besoin */}
            <div className={`relative flex items-center justify-center ${sizes[size]} overflow-hidden`}>
                <img 
                    src={imageUrl} 
                    alt={rank.name}
                    // L'astuce est ici : scale-150 (zoom x1.5) ou plus pour manger les bords vides
                    className="w-full h-full object-cover transform scale-[2.5]" 
                />
            </div>
            
            {showName && (
                <span className={`font-bold uppercase tracking-widest ${rank.color} text-xs mt-1 shadow-black drop-shadow-md`}>
                    {rank.name}
                </span>
            )}
        </div>
    );
}

export default RankBadge;