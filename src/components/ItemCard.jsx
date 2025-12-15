import { PATCH_VERSION } from '../utils/constants';

// On ajoute la prop 'revealed' ici
function ItemCard({ item, revealed }) {
  if (!item) return null;

  const createMarkup = () => {
    if (!item.description) return { __html: "" };
    return { __html: item.description };
  };

  return (
    <div className="flex flex-col items-center mb-6 animate-fade-in w-full max-w-lg transition-all duration-300">
      
      {/* L'image et le titre restent toujours visibles */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <img 
          src={`https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION}/img/item/${item.id}.png`}
          alt={item.name}
          className="relative w-24 h-24 border-2 border-lol-gold rounded-md shadow-2xl"
        />
      </div>
      
      <h2 className="mt-4 text-xl font-bold text-lol-blue tracking-wide text-center">
        {item.name}
      </h2>

      {/* --- CONDITION D'AFFICHAGE --- */}
      {/* On n'affiche la description que si 'revealed' est vrai */}
      {revealed && (
        <div 
          className="mt-4 text-xs text-gray-400 text-center leading-relaxed px-4 riot-description bg-black/20 p-2 rounded border border-gray-800 animate-fade-in"
          dangerouslySetInnerHTML={createMarkup()} 
        />
      )}
    </div>
  );
}

export default ItemCard;