import { TAG_DICT } from '../utils/constants';

function OptionsGrid({ options, userGuess, correctAnswer, onGuess }) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full mb-8">
      {options.map((tag) => {
        let btnClass = "bg-lol-card border border-lol-gold/50 text-lol-blue hover:bg-gray-800";
        
        // Logique de couleur
        if (userGuess) {
          if (tag === correctAnswer) {
            btnClass = "bg-green-700 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]";
          } else if (tag === userGuess) {
            btnClass = "bg-red-900 border-red-500 text-white shake-animation"; 
          } else {
            btnClass = "opacity-40 border-gray-700 text-gray-500";
          }
        }

        return (
          <button
            key={tag}
            onClick={() => onGuess(tag)}
            disabled={userGuess !== null}
            className={`
              p-4 rounded shadow-lg font-medium text-sm transition-all duration-200 transform
              ${btnClass}
              ${!userGuess ? 'hover:-translate-y-1 active:scale-95' : ''}
            `}
          >
            {TAG_DICT[tag] || tag}
          </button>
        );
      })}
    </div>
  );
}

export default OptionsGrid;