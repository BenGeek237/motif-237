exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { motifId, format, phone, email } = JSON.parse(event.body);
    
    if (!motifId || !format || !phone) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Données manquantes' }) };
    }

    // Charger les motifs pour vérifier le prix réel
    const motifs = require('../../data/motifs.json');
    const motif = motifs.find(m => m.id == motifId);
    
    if (!motif) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Motif introuvable' }) };
    }

    if (!motif.prix) {
       return { statusCode: 400, body: JSON.stringify({ error: 'Ce motif n\'a pas de prix défini.' }) };
    }

    const amount = parseInt(motif.prix, 10);
    const description = `Motif: ${motif.nom} (Format: ${format})`;
    
    // Référence unique pour la commande
    const reference = `M237-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    
    // Déterminer l'URL de base pour la redirection de retour
    let host = event.headers.origin || event.headers.host || "localhost";
    if (host && !host.startsWith('http')) {
        host = (host.includes('localhost') ? 'http://' : 'https://') + host;
    }
    const returnUrl = `${host}/success.html?ref=${reference}&motif=${motifId}&fmt=${format}`;

    const payload = {
      amount: amount,
      currency: "XAF",
      description: description,
      reference: reference,
      customer: {
        email: email || "client@broderienumerique.com",
        phone: phone
      },
      return_url: returnUrl
    };

    // Utilisation des variables d'environnement (à définir dans Netlify)
    const CAMERPAY_BASE_URL = process.env.CAMERPAY_BASE_URL || "https://camerpay.biz/api";
    const API_KEY = process.env.CAMERPAY_API_KEY;

    if (!API_KEY) {
       console.error("CAMERPAY_API_KEY manquante");
       return { statusCode: 500, body: JSON.stringify({ error: 'Configuration serveur (API KEY) manquante.' }) };
    }

    const response = await fetch(`${CAMERPAY_BASE_URL}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Camerpay error:', errorText);
      return { statusCode: response.status, body: JSON.stringify({ error: 'Erreur Camerpay: ' + errorText }) };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({
        payment_url: data.payment_url || data.url, // Camerpay retourne souvent l'url dans `payment_url` ou `url`
        reference: reference
      })
    };

  } catch (error) {
    console.error('Exception in init-payment:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erreur interne du serveur.' }) };
  }
};
