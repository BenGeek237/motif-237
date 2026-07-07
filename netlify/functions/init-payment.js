const crypto = require('crypto');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { cart, phone, email } = JSON.parse(event.body);
    
    if (!cart || !Array.isArray(cart) || cart.length === 0 || !phone) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Données manquantes ou panier vide' }) };
    }

    // Charger les motifs pour vérifier le prix réel
    const motifs = require('../../data/motifs.json');
    let amount = 0;
    
    for (let item of cart) {
      const motif = motifs.find(m => m.id == item.id);
      if (!motif || !motif.prix) {
        return { statusCode: 400, body: JSON.stringify({ error: `Motif introuvable ou sans prix : ${item.id}` }) };
      }
      amount += parseInt(motif.prix, 10);
    }

    const description = `Commande de ${cart.length} motif(s)`;
    
    // Utilisation des variables d'environnement
    const CAMERPAY_BASE_URL = process.env.CAMERPAY_BASE_URL || "https://camerpay.biz/api";
    const API_KEY = process.env.CAMERPAY_API_KEY;

    if (!API_KEY) {
       console.error("CAMERPAY_API_KEY manquante");
       return { statusCode: 500, body: JSON.stringify({ error: 'Configuration serveur (API KEY) manquante.' }) };
    }

    // Générer une signature HMAC avec la clé API pour valider le contenu du panier sans DB
    // On trie les items pour garantir que la signature est toujours la même peu importe l'ordre
    const sortedCart = cart.slice().sort((a,b) => a.id - b.id);
    const cartString = sortedCart.map(i => `${i.id}-${i.format}`).join('|');
    const signature = crypto.createHmac('sha256', API_KEY).update(cartString).digest('hex').substring(0, 16);
    
    // Référence unique pour la commande incluant la signature
    const reference = `M237-${Date.now()}-${signature}`;
    
    // Déterminer l'URL de base pour la redirection de retour
    let host = event.headers.origin || event.headers.host || "localhost";
    if (host && !host.startsWith('http')) {
        host = (host.includes('localhost') ? 'http://' : 'https://') + host;
    }
    
    // On n'a plus besoin de passer motif et fmt dans l'URL puisque le localStorage le gère sur la page success
    const returnUrl = `${host}/success.html?ref=${reference}&cart=true`;

    const payload = {
      amount: amount,
      currency: "XAF",
      description: description,
      merchant_invoice_id: reference,
      merchant_return_url: returnUrl,
      merchant_callback_url: `${host}/.netlify/functions/webhook`,
      customer: {
        email: email || "client@broderienumerique.com",
        phone: phone
      }
    };

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
    const payUrl = data.payment_url || data.url || (data.data && data.data.payment_url) || (data.data && data.data.url) || data.redirect_url;
    
    if (!payUrl) {
       return { statusCode: 400, body: JSON.stringify({ error: "Structure inattendue : " + JSON.stringify(data) }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        payment_url: payUrl,
        reference: reference
      })
    };

  } catch (error) {
    console.error('Exception in init-payment:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erreur interne du serveur.' }) };
  }
};
