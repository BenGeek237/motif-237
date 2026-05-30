import json
import os

with open("data/motifs.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Ensure data is an array (if Decap CMS previously wrapped it, unwrap it)
if isinstance(data, dict) and "motifs" in data:
    data = data["motifs"]

os.makedirs("data/motifs", exist_ok=True)

for motif in data:
    # Use id as the filename, or generate a slug from the name
    filename = f"motif-{motif.get('id', 'new')}.json"
    with open(os.path.join("data", "motifs", filename), "w", encoding="utf-8") as out:
        json.dump(motif, out, indent=2, ensure_ascii=False)

print(f"Successfully split {len(data)} motifs into data/motifs/")
