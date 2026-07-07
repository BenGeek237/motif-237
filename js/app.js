/**
 * Broderie Numérique - Module JavaScript Principal
 * Broderie Numérique — Fichiers DST, JEF, PES, DSB...
 * Architecture modulaire : prête pour migration vers API Django / Vue.js
 */

// ================================
// CONFIGURATION GLOBALE
// ================================
const CONFIG = {
  whatsappNumber: "237693565223", // Numéro de Mamoudou bia
  businessName: "Broderie Numérique",
  owner: "Mamoudou bia",
  location: "Yaoundé, Cameroun",
  dataPath: "/data/motifs.json?v=" + new Date().getTime(),
  // Formats pris en charge (référence)
  formatsInfo: {
    DST: { machine: "Tajima", description: "Format universel le plus répandu" },
    JEF: { machine: "Janome", description: "Pour machines Janome" },
    PES: { machine: "Brother / Babylock", description: "Pour machines Brother" },
    DSB: { machine: "Barudan", description: "Pour machines Barudan" },
    EXP: { machine: "Melco / Bernina", description: "Format Melco & Pfaff anciens" },
    HUS: { machine: "Husqvarna Viking", description: "Pour machines Husqvarna" },
    VP3: { machine: "Pfaff / Viking", description: "Pour machines Pfaff modernes" },
  },
};

// ================================
// SERVICE DONNÉES (prêt pour migration vers API Django)
// ================================
const DataService = {
  _cache: null,

  async fetchAll() {
    if (this._cache) return this._cache;
    try {
      const response = await fetch(CONFIG.dataPath);
      if (!response.ok) throw new Error("Erreur chargement données");
      this._cache = await response.json();
      return this._cache;
    } catch (error) {
      console.error("DataService.fetchAll:", error);
      return [];
    }
  },

  async fetchById(id) {
    const all = await this.fetchAll();
    return all.find((m) => m.id === parseInt(id)) || null;
  },

  async fetchByCategory(categorie) {
    const all = await this.fetchAll();
    if (categorie === "Tous") return all;
    return all.filter((m) => m.categorie === categorie);
  },

  async fetchFeatured() {
    const all = await this.fetchAll();
    return all.filter((m) => m.vedette === true);
  },

  async getCategories() {
    const all = await this.fetchAll();
    const customOrder = ['Homme', 'Femme', 'Gandoura', 'Enfant', 'Logo', 'Autres'];
    const existingCats = [...new Set(all.map(m => m.categorie).filter(Boolean))];
    
    // Trier selon l'ordre personnalisé, puis alphabétique pour d'éventuelles autres catégories
    existingCats.sort((a, b) => {
      let idxA = customOrder.indexOf(a);
      let idxB = customOrder.indexOf(b);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB || a.localeCompare(b);
    });

    return ["Tous", ...existingCats];
  },
};

// ================================
// SERVICE PANIER (LOCAL STORAGE)
// ================================
const CartService = {
  key: "bn_cart",
  getCart() {
    return JSON.parse(localStorage.getItem(this.key) || "[]");
  },
  addToCart(motif, format) {
    const cart = this.getCart();
    const existing = cart.find(i => i.id === motif.id && i.format === format);
    if (!existing) {
      cart.push({ id: motif.id, nom: motif.nom, prix: motif.prix, format: format, image: motif.image });
      localStorage.setItem(this.key, JSON.stringify(cart));
      this.updateCartCount();
      UI.showToast(`Ajouté au panier : ${motif.nom} (${format})`);
    } else {
      UI.showToast(`Ce format de ${motif.nom} est déjà dans le panier`, "info");
    }
  },
  removeFromCart(id, format) {
    const cart = this.getCart().filter(i => !(i.id === id && i.format === format));
    localStorage.setItem(this.key, JSON.stringify(cart));
    this.updateCartCount();
  },
  clearCart() {
    localStorage.removeItem(this.key);
    this.updateCartCount();
  },
  getTotal() {
    return this.getCart().reduce((sum, i) => sum + (i.prix || 0), 0);
  },
  updateCartCount() {
    const count = this.getCart().length;
    document.querySelectorAll('.cart-count-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

// ================================
// SERVICE WHATSAPP — Broderie Numérique
// ================================
const WhatsAppService = {
  // Lien de commande : le client n'a pas à connaître son format
  // On lui demande juste sa marque de machine, le vendeur envoie le bon fichier
  buildLink(motifNom, prix = null) {
    const prixTxt = prix ? ` (${prix.toLocaleString('fr')} FCFA)` : '';
    const msg = `Bonjour Broderie Numérique ! 👋\nJe veux commander le motif : *${motifNom}*${prixTxt}.\n\nQuelle marque de machine avez-vous ? (Brother, Janome, Tajima…)\n→ Précisez-moi votre machine et je vous envoie le bon fichier + les détails de paiement.`;
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  },

  buildGeneralLink() {
    const msg = "Bonjour Broderie Numérique ! 👋\nJe voudrais voir vos motifs de broderie numérique. Pouvez-vous me montrer votre catalogue ?";
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  },

  openChat(motifNom, prix = null) {
    window.open(this.buildLink(motifNom, prix), "_blank");
  },
};

// ================================
// COMPOSANTS UI RÉUTILISABLES
// ================================
const UI = {
  // Gestion du Panier (Drawer)
  toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer || !overlay) return;
    const isOpen = !drawer.classList.contains('translate-x-full');
    
    if (isOpen) {
      drawer.classList.add('translate-x-full');
      overlay.classList.add('hidden');
    } else {
      this.renderCart();
      drawer.classList.remove('translate-x-full');
      overlay.classList.remove('hidden');
    }
  },

  renderCart() {
    const items = CartService.getCart();
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<div class="text-center text-gray-500 mt-10">Votre panier est vide.</div>`;
      if(totalEl) totalEl.textContent = '0 FCFA';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="flex items-center gap-3 border-b pb-3">
        <img src="${item.image.startsWith('http') || item.image.startsWith('/') ? item.image : '/' + item.image}" class="w-16 h-16 object-cover rounded-lg">
        <div class="flex-1">
          <h4 class="font-bold text-sm line-clamp-1">${item.nom}</h4>
          <p class="text-xs text-gray-500">Format: ${item.format}</p>
          <p class="text-sm font-semibold text-amber-600">${item.prix ? item.prix.toLocaleString() : 0} FCFA</p>
        </div>
        <button onclick="BroderieNumerique.CartService.removeFromCart(${item.id}, '${item.format}'); BroderieNumerique.UI.renderCart();" class="text-red-500 hover:text-red-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `).join('');

    if(totalEl) totalEl.textContent = `${CartService.getTotal().toLocaleString()} FCFA`;
  },

  async checkout() {
    const items = CartService.getCart();
    if (items.length === 0) return this.showToast("Votre panier est vide", "error");
    
    const phone = document.getElementById('cart-phone').value;
    const email = document.getElementById('cart-email').value;
    
    if (!phone || phone.length < 9) {
      return this.showToast("Numéro de téléphone invalide", "error");
    }

    const btn = document.getElementById('cart-checkout-btn');
    btn.textContent = "Initialisation...";
    btn.disabled = true;

    try {
      const response = await fetch('/.netlify/functions/init-payment', {
        method: 'POST',
        body: JSON.stringify({ cart: items, phone, email })
      });
      
      const data = await response.json();
      if (response.ok && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        this.showToast("Erreur: " + (data.error || "Impossible d'initialiser"), "error");
        btn.textContent = "Valider la commande";
        btn.disabled = false;
      }
    } catch (e) {
      this.showToast("Erreur réseau", "error");
      btn.textContent = "Valider la commande";
      btn.disabled = false;
    }
  },

  // Badge couleur selon le niveau
  niveauBadge(niveau) {
    const map = {
      "Débutant": "badge-debutant",
      "Standard": "badge-standard",
      "Avancé": "badge-avance",
    };
    return map[niveau] || "badge-default";
  },

  // Badge format
  formatBadge(fmt) {
    return `<span class="fmt fmt-${fmt}">${fmt}</span>`;
  },

  // Formater nombre de points
  formatPoints(n) {
    return n ? n.toLocaleString("fr-FR") + " pts" : "–";
  },

  // Carte motif pour catalogue et accueil
  renderMotifCard(motif, compact = false) {
    const waLink = WhatsAppService.buildLink(motif.nom, motif.prix);
    const prixFormate = motif.prix
      ? `<div class="card-price">${motif.prix.toLocaleString()} <small>${motif.devise}</small></div>`
      : "";

    const formatsHtml = motif.formats
      ? motif.formats.slice(0, 3).map((f) => this.formatBadge(f)).join("") +
        (motif.formats.length > 3 ? `<span class="fmt-more">+${motif.formats.length - 3}</span>` : "")
      : "";

    const imgUrl = motif.image.startsWith('http') || motif.image.startsWith('/') ? motif.image : '/' + motif.image;
    return `
      <div class="product-card" onclick="window.location.href='/motif.html?id=${motif.id}'" data-id="${motif.id}" aria-label="Fichier de broderie numérique ${motif.nom}">
        <div class="card-img">
          <img src="${imgUrl}" alt="${motif.nom} — motif de broderie numérique ${motif.formats?.[0] || ''}" loading="lazy">
          <!-- Catégorie -->
          <span class="badge-cat">${motif.categorie}</span>
          <!-- Vedette -->
          ${motif.vedette ? '<span class="badge-top">★ Top</span>' : ""}
        </div>
        <div class="card-body">
          <h3 class="card-name">${motif.nom}</h3>
          ${!compact ? `
          <!-- Specs techniques -->
          <div class="card-specs">
            ${motif.points ? `<span title="Nombre de points">🧵 ${this.formatPoints(motif.points)}</span>` : ""}
            ${motif.couleurs ? `<span title="Nombre de couleurs">🎨 ${motif.couleurs} coul.</span>` : ""}
            ${motif.dimensions ? `<span title="Dimensions">📐 ${motif.dimensions.largeur}×${motif.dimensions.hauteur}mm</span>` : ""}
          </div>
          <!-- Formats -->
          <div class="card-fmts">${formatsHtml}</div>
          ` : ""}
          <div class="card-bottom">
            ${prixFormate}
            <div class="card-btns">
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="btn-wa-card" aria-label="Commander le fichier ${motif.nom} sur WhatsApp">
                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Commander
              </a>
            </div>
          </div>
        </div>
      </div>`;
  },

  renderSkeleton(count = 4) {
    return Array(count).fill(0).map(() => `
      <div class="skeleton">
        <div class="sk-img"></div>
        <div class="sk-body">
          <div class="sk-line w50"></div>
          <div class="sk-line w80 h14"></div>
          <div class="sk-line"></div>
          <div class="sk-btn"></div>
        </div>
      </div>`).join("");
  },

  showToast(message, type = "success") {
    const toast = document.createElement("div");
    const colors = { success: "bg-green-500", error: "bg-red-500", info: "bg-amber-500" };
    toast.className = `fixed bottom-6 right-6 ${colors[type]} text-white px-6 py-3 rounded-2xl shadow-xl z-50 font-medium text-sm transition-all duration-300 translate-y-20 opacity-0`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove("translate-y-20", "opacity-0"));
    setTimeout(() => {
      toast.classList.add("translate-y-20", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
};

// ================================
// NAVIGATION ACTIVE
// ================================
function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-page]").forEach((link) => {
    if (link.getAttribute("data-page") === currentPage) {
      link.classList.add("text-amber-400", "border-b-2", "border-amber-400");
    }
  });
}

// ================================
// MENU MOBILE
// ================================
function initMobileMenu() {
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
    const isOpen = !menu.classList.contains("hidden");
    btn.setAttribute("aria-expanded", isOpen);
    btn.innerHTML = isOpen
      ? `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
      : `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();
  initMobileMenu();
  CartService.updateCartCount();
});

// Export global
window.BroderieNumerique = { CONFIG, DataService, CartService, WhatsAppService, UI };
