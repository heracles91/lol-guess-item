import { TAG_DICT } from '../utils/constants';

function OptionsGrid({ options, userGuess, correctAnswer, onGuess, gameMode }) {

  // Fonction utilitaire pour formater le texte du bouton
  const getLabel = (option) => {
    if (gameMode === 'attribute') {
      // Traduction (ex: "AttackSpeed" -> "Vitesse d'attaque")
      return TAG_DICT[option] || option;
    }
    if (gameMode === 'price') {
      // Formatage Prix (ex: 3300 -> "3300 PO")
      return `${option} PO`;
    }
    return option; // Par défaut
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full mb-8">
      {options.map((option, index) => {
        let btnClass = "bg-lol-card border border-lol-gold/50 text-lol-blue hover:bg-gray-800";
        
        // Logique de coloration (Vert/Rouge)
        if (userGuess) {
          if (option === correctAnswer) {
            btnClass = "bg-green-700 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]";
          } else if (option === userGuess) {
            btnClass = "bg-red-900 border-red-500 text-white shake-animation"; 
          } else {
            btnClass = "opacity-40 border-gray-700 text-gray-500";
          }
        }

        return (
          <button
            key={index} // On utilise index car pour les prix, les nombres n'ont pas d'ID unique
            onClick={() => onGuess(option)}
            disabled={userGuess !== null}
            className={`
              p-4 rounded shadow-lg font-medium text-sm transition-all duration-200 transform
              ${btnClass}
              ${!userGuess ? 'hover:-translate-y-1 active:scale-95' : ''}
            `}
          >
            {getLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

export default OptionsGrid;