# Broderie Numérique — Site Broderie Cameroun

Site vitrine moderne pour un business de vente de motifs de broderie basé à Yaoundé, Cameroun.

## 🗂️ Structure du projet

```
Broderie Numérique/
├── index.html          # Page d'accueil
├── catalogue.html      # Catalogue avec filtres
├── motif.html          # Détail d'un motif
├── contact.html        # Page contact
├── netlify.toml        # Config Netlify
├── data/
│   └── motifs.json     # Base de données des motifs
├── images/             # Images des motifs
└── js/
    └── app.js          # Module JS principal
```

## 🚀 Déploiement sur Netlify

### Option 1 — Glisser-déposer (le plus simple)
1. Aller sur [netlify.com](https://netlify.com)
2. Se connecter / créer un compte gratuit
3. Glisser le dossier `Broderie Numérique` dans la zone de dépôt
4. ✅ Le site est en ligne !

### Option 2 — Via GitHub
1. Créer un repo GitHub
2. Pousser ce dossier
3. Connecter le repo à Netlify
4. Netlify déploie automatiquement à chaque push

## ⚙️ Configuration

### Changer le numéro WhatsApp
Ouvrir `js/app.js` et modifier :
```javascript
const CONFIG = {
  whatsappNumber: "237XXXXXXXXX", // ← VOTRE VRAI NUMÉRO
  ...
}
```

> ⚠️ Le numéro doit être au format international sans le `+` (ex: `237691234567`)

### Ajouter un motif
Ouvrir `data/motifs.json` et ajouter un objet :
```json
{
  "id": 9,
  "nom": "Nom du Motif",
  "image": "images/mon_image.png",
  "categorie": "Mariage",
  "description": "Description du motif...",
  "prix": 5000,
  "devise": "FCFA",
  "vedette": false,
  "tags": ["tag1", "tag2"]
}
```

## 📱 Fonctionnalités
- ✅ Chargement dynamique depuis JSON
- ✅ Filtrage par catégorie
- ✅ Recherche textuelle en temps réel
- ✅ Boutons WhatsApp avec message pré-rempli
- ✅ Bouton WhatsApp flottant sur toutes les pages
- ✅ Design responsive mobile-first
- ✅ Pages détail avec motifs similaires
- ✅ FAQ accordion sur la page contact
- ✅ Animations et transitions fluides
- ✅ SEO optimisé (meta tags, structure sémantique)

## 🔮 Évolution future
- [ ] Connexion à une API Django REST
- [ ] Paiement Flutterwave / Paystack
- [ ] Migration vers Vue.js (le `DataService` est déjà prêt)
- [ ] Système de favoris (localStorage prêt)
- [ ] Galerie multi-images par motif

## 🛠️ Technologies utilisées
- HTML5 sémantique
- Tailwind CSS (CDN)
- Vanilla JavaScript (ES6+)
- Google Fonts (Playfair Display + Inter)
