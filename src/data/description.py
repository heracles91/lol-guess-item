import json
import re

# Chemin vers ton fichier JSON
FILE_PATH = "items.json"

# Regex pour capturer les noms de balises XML-like
TAG_REGEX = re.compile(r"<\s*/?\s*([a-zA-Z0-9]+)")

def extract_description_tags(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    tags_found = set()

    for item in items:
        description = item.get("description", "")
        matches = TAG_REGEX.findall(description)
        tags_found.update(matches)

    return sorted(tags_found)

if __name__ == "__main__":
    tags = extract_description_tags(FILE_PATH)

    print(f"{len(tags)} tags trouvés :\n")
    for tag in tags:
        print(tag)
