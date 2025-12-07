import requests
import json

VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json"
ITEMS_URL_TEMPLATE = "https://ddragon.leagueoflegends.com/cdn/{version}/data/fr_FR/item.json"

OUTPUT_ITEMS_FILE = "new_items.json"


def main():
    # 1) Récupérer la dernière version de LoL
    resp_versions = requests.get(VERSIONS_URL, timeout=10)
    resp_versions.raise_for_status()
    versions = resp_versions.json()

    if not versions:
        raise RuntimeError("Impossible de récupérer la liste des versions de DDragon.")

    latest_version = versions[0]
    print(f"DDragon version utilisée : {latest_version}")

    # 2) Récupérer le JSON des items pour cette version
    items_url = ITEMS_URL_TEMPLATE.format(version=latest_version)
    resp_items = requests.get(items_url, timeout=10)
    resp_items.raise_for_status()
    items_json = resp_items.json()

    raw_items = items_json.get("data", {})

    simplified_items = []
    seen_ids = set()
    tags_set = set()

    for item_id, item in raw_items.items():
        # Ignorer les items dont l'id a 5 chiffres ou plus
        if len(str(item_id)) >= 5:
            continue

        # Ignorer les items ayant la clé "inStore" (peu importe la valeur)
        if "inStore" in item:
            continue

        # Garder uniquement les items dispo sur la map 11
        maps = item.get("maps", {})
        if not isinstance(maps, dict) or not maps.get("11", False):
            continue

        # Ignorer les doublons (par id)
        if item_id in seen_ids:
            continue
        seen_ids.add(item_id)

        # Récupérer les tags
        item_tags = item.get("tags", [])
        if not isinstance(item_tags, list):
            item_tags = []

        for t in item_tags:
            tags_set.add(str(t))

        # Récupérer le coût en gold (total si possible, sinon base, sinon 0)
        gold_data = item.get("gold", {})
        gold_value = 0
        if isinstance(gold_data, dict):
            gold_value = gold_data.get("total") or gold_data.get("base") or 0

        # Construire l'objet simplifié
        simplified_item = {
            "id": item_id,
            "description": item.get("description", ""),
            "plaintext": item.get("plaintext", ""),
            "name": item.get("name", ""),
            "gold": gold_value,
            "tags": item_tags,
            "from": item.get("from", []),
        }

        simplified_items.append(simplified_item)

    # 3) Écrire le JSON simplifié
    with open(OUTPUT_ITEMS_FILE, "w", encoding="utf-8") as f:
        json.dump(simplified_items, f, ensure_ascii=False, indent=4)

    print(f"{len(simplified_items)} items écrits dans {OUTPUT_ITEMS_FILE}")


if __name__ == "__main__":
    main()