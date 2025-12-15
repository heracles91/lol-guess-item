// Fonction de hachage (inchangée)
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

// MODIFIÉ : Accepte une date optionnelle
export const getDailyItemIndex = (itemsLength, specificDate = null) => {
    // Si pas de date fournie, on prend aujourd'hui
    const dateToUse = specificDate || new Date().toISOString().split('T')[0];
    
    const seed = cyrb53(dateToUse);
    return seed % itemsLength;
};

// NOUVEAU : Récupère la date d'hier format YYYY-MM-DD
export const getYesterdayDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
};

export const hasPlayedDailyToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(localStorage.getItem('lol-quiz-daily-status'));
    return (stored && stored.date === today && stored.finished);
};

export const saveDailyResult = (score) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lol-quiz-daily-status', JSON.stringify({
        date: today,
        finished: true,
        score: score
    }));
};