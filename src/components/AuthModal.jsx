import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Envoi du Magic Link via Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirection vers le site après clic
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Lien envoyé ! Vérifie ta boîte mail.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-lol-dark border-2 border-lol-gold p-6 rounded-lg max-w-sm w-full shadow-[0_0_20px_rgba(200,170,110,0.3)]">
        <h2 className="text-xl font-bold text-lol-gold mb-4 text-center">Connexion Invocateur</h2>
        
        {message ? (
          <div className="text-center">
            <p className="text-lol-blue mb-4">{message}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-white underline text-sm">Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Ton email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-900 border border-gray-600 p-3 rounded text-white focus:border-lol-gold outline-none"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-lol-gold text-lol-dark font-bold py-2 rounded hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Recevoir mon lien magique'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="text-gray-500 text-sm hover:text-gray-300"
            >
              Annuler
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;