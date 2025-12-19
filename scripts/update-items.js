import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../src/data');
const CONSTANTS_FILE_PATH = path.join(__dirname, '../src/utils/constants.js');

const LANGUAGES = [
    { code: 'fr_FR', file: 'items_fr.json'},
    { code: 'en_US', file: 'items_en.json'}
]

async function updateData() {
  try {
    console.log('🔄 Recherche du dernier patch...');
    const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionsRes.json();
    const latestVersion = versions[0];
    console.log(`✅ Dernier patch trouvé : ${latestVersion}`);

    for (const lang of LANGUAGES) {
        console.log(`⬇️ Téléchargement [${lang.code}]...`);
        const itemsRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/${lang.code}/item.json`);
        const itemsData = await itemsRes.json();

        console.log(`⚙️  Traitement [${lang.code}]...`)

        const rawItems = itemsData.data;
        const cleanItems = [];
        const processedIds = new Set(["3867", "3869", "3870", "3871", "3876", "3877"]);
        const processedNames = new Set();

        for (const [id, item] of Object.entries(rawItems)) {
            // --- FILTRES D'EXCLUSION ---
            // Règle : Ignorer les items ayant un ID à 5 chiffres ou plus (souvent des items temporaires/test)
            if (id.length >= 5) continue;

            // Règle : Ignorer si la clé "inStore" existe (peu importe sa valeur)
            // Note: item.inStore !== undefined vérifie l'existence de la clé
            if (item.inStore !== undefined && id != "3013") continue; // 3013 car je rajoute les bottes Âmes synchronisées

            // Filtres classiques (Nom, Prix, Map, etc.)
            if (!item.name || !item.gold) continue;
            
            // Map 11 = Faille de l'invocateur. Si l'item n'y est pas dispo, on vire.
            if (item.maps && item.maps['11'] === false) continue;

            // Exclure les items d'Ornn ou spécifiques à un champion
            if (item.requiredAlly || item.requiredChampion) continue;

            // Règle : Suppression des doublons (Sécurité supplémentaire)
            if (processedIds.has(id)) continue;
            if (processedNames.has(item.name)) continue;

            // --- NETTOYAGE ---
            // Règle : Nettoyage de la description
            let cleanDescription = "";
            if (item.description) {
                cleanDescription = item.description
                    .replace(/<br><br>/g, '<br>') // Enlève les doubles sauts de ligne
                    .replace(/\u00A0/g, ' ');     // REMPLACE l'espace insécable (U+00A0) par un espace normal
            }

            // Règle : Gestion intelligente des Tags
            let newTags = [...(item.tags || [])];

            // A. Remplacer CooldownReduction par AbilityHaste
            if (newTags.includes('CooldownReduction')) {
                newTags = newTags.filter(t => t !== 'CooldownReduction'); // On enlève l'ancien
                if (!newTags.includes('AbilityHaste')) {
                    newTags.push('AbilityHaste'); // On met le nouveau s'il n'y est pas déjà
                }
            }

            // B. Remplacer Boots & NonbootsMovement par MovementSpeed
            const hasBoots = newTags.includes('Boots');
            const hasNonBoots = newTags.includes('NonbootsMovement');
            
            if (hasBoots || hasNonBoots) {
                // On supprime les anciens tags
                newTags = newTags.filter(t => t !== 'Boots' && t !== 'NonbootsMovement');
                // On ajoute le tag générique
                if (!newTags.includes('MovementSpeed')) {
                    newTags.push('MovementSpeed');
                }
            }

            // C. Remplacer SpellBlock par MagicResist
            if (newTags.includes('SpellBlock')) {
                newTags = newTags.filter(t => t !== 'SpellBlock'); // On enlève l'ancien
                if (!newTags.includes('MagicResist')) {
                    newTags.push('MagicResist'); // On met le nouveau s'il n'y est pas déjà
                }
            }


            // --- 3. AJOUT À LA LISTE FINALE ---
            
            cleanItems.push({
                id: id,
                name: item.name,
                gold: item.gold.total, 
                description: cleanDescription,
                tags: newTags, // On utilise nos tags nettoyés
                image: item.image,
                from: item.from || []
            });

            processedIds.add(id);
            processedNames.add(item.name);
        }

        // IMPORTANT : On trie par ID pour que l'ordre soit identique en FR et EN
        // C'est vital pour que le Daily Random tombe sur le même item
        cleanItems.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        await fs.writeFile(path.join(DATA_DIR, lang.file), JSON.stringify(cleanItems, null, 2));
        console.log(`💾  Sauvegardé : src/data/${lang.file} (${cleanItems.length} items)`);
    }

    // Mise à jour de la constante
    let constantsContent = await fs.readFile(CONSTANTS_FILE_PATH, 'utf-8');
    const updatedConstants = constantsContent.replace(
        /export const PATCH_VERSION = ".*";/, 
        `export const PATCH_VERSION = "${latestVersion}";`
    );

    await fs.writeFile(CONSTANTS_FILE_PATH, updatedConstants);
    console.log('✅ Version mise à jour dans constants.js');

  } catch (error) {
    console.error('❌ Erreur :', error);
  }
}

updateData();