# 🛡️ LoL Quiz - Guess the Item

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Bienvenue sur **LoL Quiz**, un jeu interactif pour tester vos connaissances sur les objets de League of Legends. Inspiré par LoLdle, ce projet propose plusieurs modes de jeu pour défier les Invocateurs, du débutant à l'expert.

🔗 **Jouer en ligne :** [https://lol-guess-item.kameni.fr](https://lol-guess-item.kameni.fr)

---

## 🎮 Modes de Jeu

### 🔮 Guess the Attribute (Devine les Stats)
On vous montre un objet, trouvez la statistique qu'il confère (AD, AP, PV, etc.) parmi 4 propositions.

### 💰 Guess the Price (Le Juste Prix)
Estimez le coût exact en pièces d'or d'un objet légendaire ou mythique.

### 🔨 Guess the Recipe (Devine la Recette)
Un objet final est affiché. Saurez-vous retrouver le composant manquant nécessaire à sa fabrication ?
*Algorithme intelligent : Les mauvaises réponses sont générées pour être crédibles (même prix, mêmes stats).*

### 📅 Daily Challenge (Défi Quotidien)
Un mode unique type "Wordle".
* Un objet mystère par jour, le même pour tout le monde.
* Description cachée pour vous aider.
* Recherche intelligente avec autocomplétion.
* Partagez votre résultat sans spoiler !

---

## ✨ Fonctionnalités

* **Classement (Leaderboard) :** Compétition en temps réel via Supabase.
* **Sauvegarde Hybride :** Vos scores sont sauvegardés localement et dans le Cloud si vous êtes connecté.
* **Mise à jour Automatique :** Un script Node.js récupère automatiquement les données du dernier patch via l'API Riot (Data Dragon).
* **Design Responsive :** Optimisé pour Mobile et Desktop.
* **Effets Visuels & Sonores :** Confettis, vibrations, sons de victoire/défaite (désactivables).

---

## 🛠️ Installation & Développement

Pour lancer le projet localement :

1.  **Cloner le dépôt :**
    ```bash
    git clone [https://github.com/heracles91/lol-quiz.git](https://github.com/heracles91/lol-quiz.git)
    cd lol-quiz
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

3.  **Mettre à jour les données (Items du dernier Patch) :**
    ```bash
    npm run update-data
    ```

4.  **Lancer le serveur de développement :**
    ```bash
    npm run dev
    ```

---

## 🤖 Automatisation

Le projet utilise **GitHub Actions** pour vérifier quotidiennement la sortie d'un nouveau patch League of Legends.
Si un patch sort, le script `scripts/update-items.js` est exécuté, les nouveaux items sont téléchargés, nettoyés, et le site est redéployé automatiquement.

---

## ⚖️ Disclaimer & Légal

*LoL Quiz* isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
