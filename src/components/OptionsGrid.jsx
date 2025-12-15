import { TAG_DICT, PATCH_VERSION } from '../utils/constants';

function OptionsGrid({ options, userGuess, correctAnswer, onGuess, gameMode }) {

  const getLabel = (option) => {
    // --- SÉCURITÉ ANTI-CRASH ---
    // Si on reçoit un Objet alors qu'on n'est pas en mode Recipe, 
    // c'est qu'on est en train de changer de mode. On renvoie le nom pour éviter l'erreur #31.
    if (typeof option === 'object' && option !== null) {
        return option.name || "Chargement...";
    }
    // ---------------------------

    if (gameMode === 'attribute') return TAG_DICT[option] || option;
    if (gameMode === 'price') return `${option} PO`;
    return option; // Fallback
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full mb-8">
      {options.map((option, index) => {
        // On vérifie le mode, mais on s'assure aussi que l'option est bien un objet avant de demander une image
        // pour éviter des bugs si gameMode est 'recipe' mais que options contient encore des strings
        const isRecipeMode = gameMode === 'recipe' && typeof option === 'object';
        
        const valueToTest = isRecipeMode ? option.id : option;
        
        // Sécurité pour correctAnswer qui peut aussi être en décalage lors du switch
        let correctVal = correctAnswer;
        if (isRecipeMode && correctAnswer && typeof correctAnswer === 'object') {
            correctVal = correctAnswer.id;
        }

        let btnClass = "bg-lol-card border border-lol-gold/50 text-lol-blue hover:bg-gray-800";
        
        if (userGuess) {
           const userGuessVal = (isRecipeMode && userGuess.id) ? userGuess.id : userGuess;
           
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
                <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/${PATCH_VERSION}/img/item/${option.image.full}`}
                    alt={option.name}
                    className="h-full object-contain drop-shadow-md"
                />
            ) : (
                getLabel(option)
            )}
          </button>
        );
      })}
    </div>
  );
}

export default OptionsGrid;