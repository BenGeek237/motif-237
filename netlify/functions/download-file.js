const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const reference = event.queryStringParameters.ref;
  const motifId = event.queryStringParameters.motif;
  const format = event.queryStringParameters.fmt;
  const cartString = event.queryStringParameters.cartString;

  if (!reference || !motifId || !format) {
    return { statusCode: 400, body: 'Paramètres manquants' };
  }

  // Vérification de la configuration Camerpay
  const CAMERPAY_BASE_URL = process.env.CAMERPAY_BASE_URL || "https://camerpay.biz/api";
  const API_KEY = process.env.CAMERPAY_API_KEY;

  if (!API_KEY) {
      console.error("CAMERPAY_API_KEY manquante");
      return { statusCode: 500, body: 'Configuration serveur incomplète.' };
  }

  // VERIFICATION HMAC DU PANIER (Sans base de données)
  if (cartString) {
      // Le nouveau système de panier passe la chaine du panier et on vérifie la signature
      const expectedSignature = crypto.createHmac('sha256', API_KEY).update(cartString).digest('hex').substring(0, 16);
      const refParts = reference.split('-');
      const signatureFromRef = refParts[refParts.length - 1]; // ex: M237-timestamp-signature
      
      if (signatureFromRef !== expectedSignature) {
          return { statusCode: 403, body: 'Signature du panier invalide. Accès refusé.' };
      }

      // Vérifier que le motif demandé est bien dans ce panier validé
      const requestedItem = `${motifId}-${format}`;
      if (!cartString.split('|').includes(requestedItem)) {
          return { statusCode: 403, body: 'Ce motif ne fait pas partie de votre commande.' };
      }
  }

  try {
    // 1. Vérifier le statut du paiement avec Camerpay
    const response = await fetch(`${CAMERPAY_BASE_URL}/payment/status/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error("Camerpay verification error", response.status);
      return { statusCode: 400, body: 'Impossible de vérifier le statut du paiement' };
    }

    const data = await response.json();
    
    // Le statut attendu pour un paiement réussi est "SUCCESS"
    if (data.status !== 'SUCCESS') {
      return { 
          statusCode: 403, 
          body: `Paiement non finalisé ou en attente. Statut actuel : ${data.status}. Si vous venez de payer, veuillez patienter quelques instants et recharger la page.` 
      };
    }

    // 2. Localiser le fichier de broderie dans le dossier sécurisé
    const fileName = `${motifId}.${format.toLowerCase()}`;
    const filePath = path.join(__dirname, '..', '..', 'secure_files', fileName);

    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return { 
          statusCode: 404, 
          body: `Le fichier ${fileName} n'a pas été trouvé sur le serveur, bien que votre paiement soit validé. Veuillez contacter le support sur WhatsApp avec votre référence : ${reference}` 
      };
    }

    // 3. Renvoyer le fichier en téléchargement direct
    const fileBuffer = fs.readFileSync(filePath);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Exception in download-file:', error);
    return { statusCode: 500, body: 'Erreur interne du serveur lors de la vérification.' };
  }
};
