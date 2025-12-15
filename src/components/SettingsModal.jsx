import { useState } from 'react';

function SettingsModal({ 
  onClose, 
  isMuted, 
  toggleMute, 
  username, 
  onUpdateUsername, 
  usernameError 
}) {
  const [tempUsername, setTempUsername] = useState(username || '');
  const [language, setLanguage] = useState('fr'); // Pour le futur

  const handleSave = () => {
    // On ne sauvegarde le pseudo que s'il a changé
    if (tempUsername !== username) {
      onUpdateUsername(tempUsername);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-lol-dark border-2 border-lol-gold w-full max-w-sm p-6 rounded-lg shadow-[0_0_30px_rgba(200,170,110,0.2)] relative">
        
        {/* Titre */}
        <h2 className="text-xl font-bold text-lol-gold mb-6 text-center uppercase tracking-widest border-b border-lol-gold/30 pb-4">
          Réglages
        </h2>

        {/* Bouton Fermer */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl"
        >
            ✕
        </button>

        <div className="flex flex-col gap-6">
            
            {/* 1. AUDIO */}
            <div className="flex justify-between items-center">
                <span className="text-gray-300 font-bold">Effets Sonores</span>
                <button 
                    onClick={toggleMute}
                    className={`px-4 py-2 rounded font-bold text-xs transition ${isMuted ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}
                >
                    {isMuted ? 'DÉSACTIVÉS' : 'ACTIVÉS'}
                </button>
            </div>

            {/* 2. PSEUDO */}
            <div className="flex flex-col gap-2">
                <label className="text-gray-300 font-bold text-sm">Nom d'Invocateur</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        placeholder="Ton pseudo..."
                        className={`bg-[#091428] border p-2 rounded text-white outline-none text-sm w-full
                            ${usernameError ? 'border-red-500' : 'border-gray-600 focus:border-lol-gold'}
                        `}
                    />
                    <button 
                        onClick={handleSave}
                        className="bg-lol-gold text-black font-bold px-3 rounded hover:brightness-110"
                    >
                        OK
                    </button>
                </div>
                {usernameError && <span className="text-xs text-red-500">{usernameError}</span>}
            </div>

            {/* 3. LANGUE (Préparation) */}
            <div className="flex flex-col gap-2 opacity-50 cursor-not-allowed" title="Bientôt disponible">
                <label className="text-gray-300 font-bold text-sm">Langue du jeu</label>
                <div className="grid grid-cols-2 gap-2">
                    <button className={`p-2 border border-lol-gold rounded text-xs font-bold bg-lol-gold text-black`}>Français</button>
                    <button className="p-2 border border-gray-700 rounded text-xs font-bold text-gray-500">English</button>
                </div>
                <span className="text-[10px] text-gray-500 text-center italic">Changer la langue demandera de recharger la page.</span>
            </div>

        </div>

        <div className="mt-8 text-center">
            <button onClick={onClose} className="text-gray-400 hover:text-white text-sm underline">
                Retour au jeu
            </button>
        </div>

      </div>
    </div>
  );
}

export default SettingsModal;