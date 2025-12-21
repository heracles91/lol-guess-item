function SettingsModal({ onClose, isMuted, toggleMute, username, onUpdateUsername, usernameError, language, toggleLanguage, t }) {
  const [newUsername, setNewUsername] = useState(username || '');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-lol-card border border-lol-gold p-8 rounded-lg w-full max-w-sm relative shadow-2xl">
        <button onClick={onClose} className="absolute top-2 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
        <h2 className="text-2xl font-bold text-lol-gold mb-6 text-center uppercase tracking-widest">{t.settings_title}</h2>

        {/* LANGUE */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-300 font-bold">{t.lang_label}</span>
          <button onClick={toggleLanguage} className="flex gap-2 items-center bg-gray-900 border border-gray-600 px-3 py-1 rounded hover:border-lol-gold transition">
            {language === 'fr' ? 'Français' : 'English'}
          </button>
        </div>

        {/* SON */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-300 font-bold">{t.sound_label}</span>
          <button onClick={toggleMute} className="text-2xl hover:scale-110 transition">
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* PSEUDO */}
        <div className="mb-6">
            <label className="block text-gray-300 font-bold mb-2">{t.pseudo_label}</label>
            <input 
                type="text" 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-gray-900 border border-lol-gold/50 rounded p-2 text-white focus:border-lol-gold outline-none"
                placeholder={t.guest}
            />
            {usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
        </div>

        <div className="flex gap-2">
            <button onClick={() => onUpdateUsername(newUsername)} className="flex-1 bg-lol-gold text-black font-bold py-2 rounded hover:bg-yellow-500 transition">{t.save}</button>
            <button onClick={onClose} className="flex-1 bg-gray-700 text-white font-bold py-2 rounded hover:bg-gray-600 transition">{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}
// N'oublie pas l'import de useState au début
import { useState } from 'react';
export default SettingsModal;