import json
import random

with open("data/motifs.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Random names and categories for motifs 11 to 47
categories = ["Homme", "Femme", "Enfants", "Religieux", "Mariage", "Traditionnel", "Logos"]
prefixes = ["Motif", "Design", "Broderie", "Création", "Style"]
suffixes = ["Élégant", "Royal", "Premium", "Chic", "Classique", "Moderne", "Africain", "Floral", "Géométrique"]
tags_pool = ["broderie", "machine", "africain", "tissu", "fil", "artisanat", "couture", "mode", "luxe", "tradition"]

for motif in data:
    if motif["id"] >= 11:
        # Generate random name if it matches "Motif xx:xx:xx" or similar
        # Or just replace all of them
        motif["nom"] = f"{random.choice(prefixes)} {random.choice(suffixes)} #{motif['id']}"
        motif["categorie"] = random.choice(categories)
        motif["description"] = f"Un magnifique {motif['nom'].lower()} numérisé avec soin pour un rendu exceptionnel. Idéal pour vos projets créatifs."
        if not motif.get("prix") or motif["prix"] == 0:
            motif["prix"] = random.choice([1500, 2000, 2500, 3000, 4000])
            motif["devise"] = "FCFA"
        if not motif.get("points") or motif["points"] == 0:
            motif["points"] = random.randint(5000, 45000)
        if not motif.get("couleurs") or motif["couleurs"] == 0:
            motif["couleurs"] = random.randint(1, 10)
        if not motif.get("dimensions") or motif["dimensions"]["largeur"] == 0:
            motif["dimensions"] = {"largeur": random.randint(50, 200), "hauteur": random.randint(50, 200)}
        if not motif.get("tags") or len(motif["tags"]) == 0:
            motif["tags"] = random.sample(tags_pool, k=3)
        if not motif.get("formats") or len(motif["formats"]) == 0:
            motif["formats"] = ["DST", "JEF", "PES"]
        motif["niveau"] = random.choice(["Débutant", "Standard", "Avancé"])

with open("data/motifs.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
