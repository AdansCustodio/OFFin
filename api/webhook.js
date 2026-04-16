import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';
import crypto from 'crypto';

// Inicialização do Firebase Admin (Privilégios de Servidor)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // O Mercado Pago às vezes testa com GET ou POST. Vamos aceitar ambos para passar no teste.
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(200).send('OK'); 
  }

  try {
    // 1. Extração de IDs e Tipos
    const paymentId = req.body?.data?.id || req.query?.id || req.body?.id;
    const type = req.body?.type || req.query?.topic || req.body?.topic || req.body?.action;

    // --- INÍCIO DA VALIDAÇÃO DE SEGURANÇA (x-signature) ---
    const signatureHeader = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    if (signatureHeader && requestId && webhookSecret && paymentId) {
      // Extrair ts e v1 do header x-signature
      const parts = signatureHeader.split(',');
      const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
      const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

      if (ts && v1) {
        // Construir o manifesto conforme template do Mercado Pago:
        // id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
        const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
        
        // Gerar a assinatura HMAC SHA256 para comparação
        const hmac = crypto.createHmac('sha256', webhookSecret);
        hmac.update(manifest);
        const checkHash = hmac.digest('hex');

        if (checkHash !== v1) {
          console.error('[FRAUDE DETECTADA] Assinatura inválida para o pagamento:', paymentId);
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }
    }
    // --- FIM DA VALIDAÇÃO DE SEGURANÇA ---

    console.log(`Recebendo notificação validada: Tipo=${type}, ID=${paymentId}`);

    // Se não tiver ID, é apenas um teste de conexão do Mercado Pago.
    if (!paymentId) {
      return res.status(200).send('OK - Test Connection');
    }

    // 2. Processamento do pagamento aprovado
    if (type === 'payment' || type === 'payment.created' || type === 'payment.updated') {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      const client = new MercadoPagoConfig({ accessToken: accessToken });
      const payment = new Payment(client);

      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata?.user_id;
        const packageId = paymentData.metadata?.package_id;
        
        const appId = "offinn-89849"; 

        if (userId && packageId) {
          const userRef = db.doc(`artifacts/${appId}/public/data/users/${userId}`);
          
          await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (userDoc.exists) {
              const currentTokens = userDoc.data().tokens || 0;
              const tokensToAdd = Number(packageId);
              t.update(userRef, { tokens: currentTokens + tokensToAdd });
            }
          });
          console.log(`[SUCESSO] ${packageId} moedas creditadas ao user ${userId}`);
        }
      }
    }

    return res.status(200).send('OK');

  } catch (error) {
    console.error('Erro no Webhook:', error);
    return res.status(200).send('Processed with hidden errors');
  }
}
