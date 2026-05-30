import json
import os
import glob

# Ensure output directory exists
os.makedirs("data", exist_ok=True)

# Find all motif JSON files
motif_files = glob.glob("data/motifs/*.json")

all_motifs = []
for file_path in motif_files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            motif_data = json.load(f)
            # Ensure it has an ID, if not, generate one based on current max
            all_motifs.append(motif_data)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

# Optionally, sort them by ID so the order remains consistent
all_motifs.sort(key=lambda x: x.get("id", 999999))

# Write the combined file
with open("data/motifs.json", "w", encoding="utf-8") as out:
    json.dump(all_motifs, out, indent=2, ensure_ascii=False)

print(f"Successfully combined {len(all_motifs)} motifs into data/motifs.json")
