import json
import os
import glob

# Ensure output directory exists
os.makedirs("data", exist_ok=True)

# Find all motif JSON files
motif_files = glob.glob("data/motifs/*.json")
all_motifs = []

# First pass: load and find max id
max_id = 0
for file_path in motif_files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            motif_data = json.load(f)
            all_motifs.append((file_path, motif_data))
            if "id" in motif_data and isinstance(motif_data["id"], int):
                max_id = max(max_id, motif_data["id"])
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

# Second pass: assign IDs to those missing it
final_motifs = []
for file_path, motif_data in all_motifs:
    needs_save = False
    if "id" not in motif_data or not motif_data["id"]:
        max_id += 1
        motif_data["id"] = max_id
        needs_save = True
        
    final_motifs.append(motif_data)
    
    if needs_save:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(motif_data, f, indent=2, ensure_ascii=False)
        print(f"Assigned ID {motif_data['id']} to {file_path}")

# Sort them by ID so the order remains consistent
final_motifs.sort(key=lambda x: x.get("id", 999999))

# Write the combined file
with open("data/motifs.json", "w", encoding="utf-8") as out:
    json.dump(final_motifs, out, indent=2, ensure_ascii=False)

print(f"Successfully combined {len(final_motifs)} motifs into data/motifs.json")


