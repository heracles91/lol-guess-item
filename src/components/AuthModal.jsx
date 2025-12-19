import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Envoi du Magic Link via Supabase
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
  
  // 2. Fonction de connexion Discord (Nouveau !)
  const handleDiscordLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin, // Revient sur le site après Discord
      },
    });
    if (error) {
        setMessage("Erreur Discord : " + error.message);
        setLoading(false);
    }
  };

return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-lol-dark border-2 border-lol-gold p-6 rounded-lg max-w-sm w-full shadow-[0_0_20px_rgba(200,170,110,0.3)] relative">
        
        {/* Bouton Fermer (Croix) */}
        <button 
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-500 hover:text-white text-xl"
        >
            &times;
        </button>

        <h2 className="text-xl font-bold text-lol-gold mb-6 text-center">Connexion Invocateur</h2>
        
        {message ? (
          <div className="text-center">
            <p className="text-lol-blue mb-4">{message}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-white underline text-sm">Fermer</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* BOUTON DISCORD */}
            <button
                onClick={handleDiscordLogin}
                disabled={loading}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 rounded flex items-center justify-center gap-3 transition shadow-lg"
            >
                {/* Icône Discord SVG simple */}
                {/*<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 3.66 3.66 0 0 0-1.258 2.583 18.293 18.293 0 0 0-8.19 0 3.66 3.66 0 0 0-1.261-2.583.072.072 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                </svg>
                */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#ffffff" d="M492.5 69.8c-.2-.3-.4-.6-.8-.7-38.1-17.5-78.4-30-119.7-37.1-.4-.1-.8 0-1.1 .1s-.6 .4-.8 .8c-5.5 9.9-10.5 20.2-14.9 30.6-44.6-6.8-89.9-6.8-134.4 0-4.5-10.5-9.5-20.7-15.1-30.6-.2-.3-.5-.6-.8-.8s-.7-.2-1.1-.2c-41.3 7.1-81.6 19.6-119.7 37.1-.3 .1-.6 .4-.8 .7-76.2 113.8-97.1 224.9-86.9 334.5 0 .3 .1 .5 .2 .8s.3 .4 .5 .6c44.4 32.9 94 58 146.8 74.2 .4 .1 .8 .1 1.1 0s.7-.4 .9-.7c11.3-15.4 21.4-31.8 30-48.8 .1-.2 .2-.5 .2-.8s0-.5-.1-.8-.2-.5-.4-.6-.4-.3-.7-.4c-15.8-6.1-31.2-13.4-45.9-21.9-.3-.2-.5-.4-.7-.6s-.3-.6-.3-.9 0-.6 .2-.9 .3-.5 .6-.7c3.1-2.3 6.2-4.7 9.1-7.1 .3-.2 .6-.4 .9-.4s.7 0 1 .1c96.2 43.9 200.4 43.9 295.5 0 .3-.1 .7-.2 1-.2s.7 .2 .9 .4c2.9 2.4 6 4.9 9.1 7.2 .2 .2 .4 .4 .6 .7s.2 .6 .2 .9-.1 .6-.3 .9-.4 .5-.6 .6c-14.7 8.6-30 15.9-45.9 21.8-.2 .1-.5 .2-.7 .4s-.3 .4-.4 .7-.1 .5-.1 .8 .1 .5 .2 .8c8.8 17 18.8 33.3 30 48.8 .2 .3 .6 .6 .9 .7s.8 .1 1.1 0c52.9-16.2 102.6-41.3 147.1-74.2 .2-.2 .4-.4 .5-.6s.2-.5 .2-.8c12.3-126.8-20.5-236.9-86.9-334.5zm-302 267.7c-29 0-52.8-26.6-52.8-59.2s23.4-59.2 52.8-59.2c29.7 0 53.3 26.8 52.8 59.2 0 32.7-23.4 59.2-52.8 59.2zm195.4 0c-29 0-52.8-26.6-52.8-59.2s23.4-59.2 52.8-59.2c29.7 0 53.3 26.8 52.8 59.2 0 32.7-23.2 59.2-52.8 59.2z"/></svg>
                Via Discord
            </button>

            <div className="flex items-center gap-2 text-gray-500 text-xs my-2">
                <div className="h-[1px] bg-gray-700 flex-1"></div>
                <span>OU PAR EMAIL</span>
                <div className="h-[1px] bg-gray-700 flex-1"></div>
            </div>

            {/* FORM EMAIL */}
            <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
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
                className="bg-transparent border border-lol-gold text-lol-gold font-bold py-2 rounded hover:bg-lol-gold hover:text-black transition disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Recevoir un lien magique'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;