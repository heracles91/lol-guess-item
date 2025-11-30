import json

# Charger le fichier JSON existant
with open("items.json", "r", encoding="utf-8") as f:
    items = json.load(f)

# Dictionnaire pour suivre les noms déjà vus
seen_names = set()
filtered_items = []

for item in items:
    name = item.get("name")
    if name not in seen_names:
        seen_names.add(name)
        filtered_items.append(item)
    # sinon on ignore (doublon)

# Réécrire le JSON nettoyé
with open("items.json", "w", encoding="utf-8") as f:
    json.dump(filtered_items, f, indent=4, ensure_ascii=False)

print(f"{len(items) - len(filtered_items)} doublons supprimés.")
