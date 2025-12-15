import { useEffect, useState } from 'react';
import { PATCH_VERSION } from '../utils/constants';

function ItemCard({ item }) {
  if (!item) return null;

  // Fonction pour préparer le HTML de Riot
  const createMarkup = () => {
    if (!item.description) return { __html: "" };
    
    // Petite astuce : Riot utilise parfois des variables bizarres genre @SpecialAbility@.
    // Pour l'instant on affiche tel quel, le navigateur gérera les balises <attention> etc.
    return { __html: item.description };
  };

  return (
    <div className="flex flex-col items-center mb-6 animate-fade-in w-full max-w-lg">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <img 
          src={`https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION}.1/img/item/${item.id}.png`}
          alt={item.name}
          className="relative w-24 h-24 border-2 border-lol-gold rounded-md shadow-2xl"
        />
      </div>
      
      <h2 className="mt-4 text-xl font-bold text-lol-blue tracking-wide text-center uppercase">
        {item.name}
      </h2>

      {/* --- NOUVEAU : LA DESCRIPTION --- */}
      <div 
        className="mt-2 text-xs text-gray-400 text-center leading-relaxed px-4 riot-description"
        dangerouslySetInnerHTML={createMarkup()} 
      />
    </div>
  );
}

export default ItemCard;