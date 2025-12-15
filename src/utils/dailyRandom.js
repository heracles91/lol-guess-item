// Fonction de hachage simple (cyrb53) pour générer un nombre depuis une chaîne (la date)
const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

// Fonction principale pour récupérer l'item du jour
export const getDailyItemIndex = (itemsLength) => {
    // 1. Récupérer la date format YYYY-MM-DD (ex: 2025-12-15)
    const today = new Date().toISOString().split('T')[0];
    
    // 2. Générer un nombre unique basé sur cette date
    const seed = cyrb53(today);
    
    // 3. Retourner un index valide (modulo la taille de la liste)
    return seed % itemsLength;
};

// Vérifie si le joueur a déjà joué aujourd'hui
export const hasPlayedDailyToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(localStorage.getItem('lol-quiz-daily-status'));
    
    if (stored && stored.date === today && stored.finished) {
        return true;
    }
    return false;
};

// Sauvegarde le résultat du daily
export const saveDailyResult = (score) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lol-quiz-daily-status', JSON.stringify({
        date: today,
        finished: true,
        score: score
    }));
};