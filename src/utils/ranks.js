// src/utils/ranks.js

export const RANKS = [
    { name: "Fer", minScore: 0, id: "iron", color: "text-gray-500" },
    { name: "Bronze", minScore: 5, id: "bronze", color: "text-orange-700" },
    { name: "Argent", minScore: 10, id: "silver", color: "text-gray-300" },
    { name: "Or", minScore: 20, id: "gold", color: "text-yellow-400" },
    { name: "Platine", minScore: 35, id: "platinum", color: "text-teal-400" },
    { name: "Émeraude", minScore: 50, id: "emerald", color: "text-emerald-500" },
    { name: "Diamant", minScore: 70, id: "diamond", color: "text-blue-300" },
    { name: "Maître", minScore: 100, id: "master", color: "text-purple-400" },
    { name: "Grand Maître", minScore: 150, id: "grandmaster", color: "text-red-500" },
    { name: "Challenger", minScore: 200, id: "challenger", color: "text-yellow-200" }
];

// Fonction pour récupérer le rang actuel selon le score
export const getRankData = (score) => {
    // On cherche le rang le plus élevé dont le minScore est inférieur ou égal au score actuel
    // On inverse le tableau pour tester du plus grand au plus petit
    const rank = [...RANKS].reverse().find(r => score >= r.minScore);
    
    // Si on trouve rien (impossible théoriquement), on retourne Fer
    return rank || RANKS[0];
};

// Fonction utilitaire pour l'URL de l'image
export const getRankImage = (rankId) => {
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${rankId}.png`;
};