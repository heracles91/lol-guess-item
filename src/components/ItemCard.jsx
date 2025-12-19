import { PATCH_VERSION } from '../utils/constants';

function ItemCard({ item, revealed, isMystery }) { // <--- Ajout prop isMystery
  if (!item) return null;

  const createMarkup = () => {
    if (!item.description) return { __html: "" };
    
    let cleanDesc = item.description;

    // EN MODE MYSTÈRE : On censure le nom de l'objet dans la description !
    if (isMystery && !revealed) {
        // On remplace le nom de l'objet (insensible à la casse) par "???"
        const regex = new RegExp(item.name, "gi");
        cleanDesc = cleanDesc.replace(regex, "???");
    }

    return { __html: cleanDesc };
  };

  // Logique d'affichage conditionnel
  // Si c'est un mystère non révélé : Image Point d'interrogation
  const imageUrl = (isMystery && !revealed) 
    ? "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/hextech-images/chest.png" // Image de coffre ou point d'interrogation
    : `https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION}/img/item/${item.image.full}`;

  const displayName = (isMystery && !revealed) ? "Objet Mystère" : item.name;
  
  // On affiche la description si c'est révélé OU si c'est le mode mystère
  const showDescription = revealed || isMystery;

  return (
    <div className="flex flex-col items-center mb-6 animate-fade-in w-full max-w-lg transition-all duration-300">
      
      <div className="relative group">
        <div className={`absolute -inset-1 rounded-lg blur opacity-25 transition duration-1000 ${isMystery && !revealed ? 'bg-purple-600' : 'bg-gradient-to-r from-yellow-600 to-yellow-400 group-hover:opacity-50'}`}></div>
        <img 
          src={imageUrl} 
          alt={displayName}
          className={`relative w-24 h-24 border-2 rounded-md shadow-2xl object-cover ${isMystery && !revealed ? 'border-purple-500 p-2 bg-gray-900' : 'border-lol-gold'}`}
        />
      </div>
      
      <h2 className={`mt-4 text-xl font-bold tracking-wide text-center ${isMystery && !revealed ? 'text-purple-400 animate-pulse' : 'text-lol-blue'}`}>
        {displayName}
      </h2>

      {showDescription && (
        <div 
          className="mt-4 text-xs text-gray-400 text-center leading-relaxed px-4 riot-description bg-black/20 p-2 rounded border border-gray-800 animate-fade-in w-full"
          dangerouslySetInnerHTML={createMarkup()} 
        />
      )}
    </div>
  );
}

export default ItemCard;