import os
import json
import shutil
from datetime import datetime

# --- CONFIGURATION ---
JSON_PATH = 'data/motifs.json'
IMAGES_DIR = 'images'
BACKUP_DIR = 'data/backups'

# Valeurs par défaut pour les nouveaux motifs
DEFAULT_VALUES = {
    "categorie": "Nouveau",
    "description": "Nouveau motif de broderie numérique haute qualité, prêt pour votre machine.",
    "prix": 1500,
    "devise": "FCFA",
    "vedette": False,
    "formats": ["DST", "JEF", "PES", "DSB"],
    "points": 0,
    "couleurs": 0,
    "dimensions": {"largeur": 0, "hauteur": 0},
    "machines_compatibles": ["Tajima", "Janome", "Brother"],
    "niveau": "Standard",
    "tags": ["nouveau", "broderie"]
}

def update_catalog():
    print("--- Demarrage de la mise a jour du catalogue Broderie Numérique ---")

    # 1. Charger le JSON existant
    if not os.path.exists(JSON_PATH):
        print(f"Error : Le fichier {JSON_PATH} est introuvable.")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        try:
            motifs = json.load(f)
        except json.JSONDecodeError:
            print("Error : Le fichier JSON est corrompu.")
            return

    # 2. Créer une sauvegarde
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"motifs_backup_{timestamp}.json")
    shutil.copy2(JSON_PATH, backup_path)
    print(f"Sauvegarde creee : {backup_path}")

    # 3. Lister les images présentes dans le JSON
    images_in_json = {m['image'] for m in motifs}
    
    # 4. Scanner le dossier images/
    new_entries_count = 0
    max_id = max([m['id'] for m in motifs]) if motifs else 0
    
    # Extensions supportées
    valid_extensions = ('.jpg', '.jpeg', '.png', '.webp')
    
    files = sorted(os.listdir(IMAGES_DIR))
    
    for filename in files:
        if filename.lower().endswith(valid_extensions):
            relative_path = f"images/{filename}"
            
            if relative_path not in images_in_json:
                # Analyse du nom de fichier : Nom_Points_LargeurxHauteur_Couleurs
                # Exemple : Fleur_Royale_15000_120x80_4.jpg
                parts = filename.rsplit('.', 1)[0].split('_')
                
                motif_data = DEFAULT_VALUES.copy()
                nom_brut = filename.rsplit('.', 1)[0]
                
                # Si on a au moins 4 parties, on tente d'extraire les infos
                if len(parts) >= 4:
                    try:
                        # Les 3 dernières parties sont Points, Dimensions, Couleurs
                        nb_couleurs = int(parts[-1])
                        dims_str = parts[-2].lower()
                        pts = int(parts[-3])
                        # Tout ce qui précède est le Nom
                        nom_motif = " ".join(parts[:-3]).replace('_', ' ')
                        
                        if 'x' in dims_str:
                            w, h = map(int, dims_str.split('x'))
                            motif_data["dimensions"] = {"largeur": w, "hauteur": h}
                        
                        motif_data["nom"] = nom_motif
                        motif_data["points"] = pts
                        motif_data["couleurs"] = nb_couleurs
                        print(f"Analyse reussie : {nom_motif} ({pts} pts, {dims_str}, {nb_couleurs} fils)")
                    except ValueError:
                        print(f"Format non standard pour {filename}, utilisation des valeurs par defaut.")
                        motif_data["nom"] = nom_brut.replace('_', ' ')
                else:
                    motif_data["nom"] = nom_brut.replace('_', ' ')

                # Créer le nouveau motif
                max_id += 1
                new_motif = {
                    "id": max_id,
                    "image": relative_path,
                    **motif_data
                }
                motifs.append(new_motif)
                images_in_json.add(relative_path)
                new_entries_count += 1
                print(f"Nouveau motif ajoute : {filename}")

    # 5. Enregistrer les modifications
    if new_entries_count > 0:
        with open(JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(motifs, f, indent=2, ensure_ascii=False)
        print(f"Succes ! {new_entries_count} nouveaux motifs ont ete ajoutes au catalogue.")
        print("Vous pouvez maintenant modifier leurs noms et prix dans 'data/motifs.json'.")
    else:
        print("Aucune nouvelle image detectee. Le catalogue est deja a jour.")

if __name__ == "__main__":
    update_catalog()
    input("\nAppuyez sur Entrée pour quitter...")
