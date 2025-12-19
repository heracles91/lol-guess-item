import json

FILE_PATH = "items.json"

with open(FILE_PATH, "r", encoding="utf-8") as f:
    items = json.load(f)

# 1. Récupérer tous les IDs existants
existing_ids = {item["id"] for item in items}

# 2. Vérifier les références dans "from"
missing_references = []

for item in items:
    item_id = item["id"]
    for parent_id in item.get("from", []):
        if parent_id not in existing_ids:
            missing_references.append({
                "item_id": item_id,
                "missing_from": parent_id
            })

# 3. Résultat
if not missing_references:
    print("✅ Toutes les références 'from' sont valides.")
else:
    print("❌ Références manquantes détectées :")
    for ref in missing_references:
        print(f"- L'objet {ref['item_id']} référence un objet inexistant : {ref['missing_from']}")
