import { TAG_DICT, PATCH_VERSION } from '../utils/constants';

function OptionsGrid({ options, userGuess, correctAnswer, onGuess, gameMode }) {

  const getLabel = (option) => {
    if (gameMode === 'attribute') return TAG_DICT[option] || option;
    if (gameMode === 'price') return `${option} PO`;
    return option.name; // Fallback
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full mb-8">
      {options.map((option, index) => {
        // Pour le mode recette, 'option' est un OBJET item complet.
        // Pour les autres modes, 'option' est une string ou un nombre.
        const isRecipeMode = gameMode === 'recipe';
        const valueToTest = isRecipeMode ? option.id : option;
        const correctVal = isRecipeMode ? correctAnswer.id : correctAnswer;

        let btnClass = "bg-lol-card border border-lol-gold/50 text-lol-blue hover:bg-gray-800";
        
        // Logique Couleur
        if (userGuess) {
           // On compare les IDs en mode recette, sinon les valeurs directes
           const userGuessVal = isRecipeMode ? userGuess.id : userGuess;
           
           if (valueToTest === correctVal) {
             btnClass = "bg-green-700 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]";
           } else if (valueToTest === userGuessVal) {
             btnClass = "bg-red-900 border-red-500 text-white shake-animation"; 
           } else {
             btnClass = "opacity-40 border-gray-700 text-gray-500";
           }
        }

        return (
          <button
            key={index}
            onClick={() => onGuess(option)}
            disabled={userGuess !== null}
            className={`
              rounded shadow-lg font-medium transition-all duration-200 transform
              ${btnClass}
              ${!userGuess ? 'hover:-translate-y-1 active:scale-95' : ''}
              ${isRecipeMode ? 'p-2 flex justify-center items-center h-24' : 'p-4 text-sm'} 
            `}
          >
            {isRecipeMode ? (
                // AFFICHAGE IMAGE (Mode Recette)
                <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION}.1/img/item/${option.id}.png`}
                    alt={option.name}
                    className="h-full object-contain drop-shadow-md"
                />
            ) : (
                // AFFICHAGE TEXTE (Autres modes)
                getLabel(option)
            )}
          </button>
        );
      })}
    </div>
  );
}

export default OptionsGrid;