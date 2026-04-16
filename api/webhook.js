import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

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
    // 1. O Mercado Pago envia o ID de várias formas. Vamos tentar todas:
    // Formato 1 (Novo): req.body.data.id
    // Formato 2 (Antigo/Teste): req.query.id
    // Formato 3: req.body.id
    const paymentId = req.body?.data?.id || req.query?.id || req.body?.id;
    const type = req.body?.type || req.query?.topic || req.body?.topic;

    console.log(`Recebendo notificação: Tipo=${type}, ID=${paymentId}`);

    // Se não tiver ID, é apenas um teste de conexão do Mercado Pago. Respondemos 200 e saímos.
    if (!paymentId) {
      return res.status(200).send('OK - Test Connection');
    }

    // 2. Só processamos se o tipo for pagamento
    if (type === 'payment' || type === 'payment_methods') {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      const client = new MercadoPagoConfig({ accessToken: accessToken });
      const payment = new Payment(client);

      // Buscamos os dados reais do pagamento no Mercado Pago
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata?.user_id;
        const packageId = paymentData.metadata?.package_id;
        
        // Use o seu ID de projeto real
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
          console.log(`[SUCESSO] ${packageId} moedas para o user ${userId}`);
        }
      }
    }

    // Sempre retornar 200 para o Mercado Pago
    return res.status(200).send('OK');

  } catch (error) {
    console.error('Erro no Webhook:', error);
    // Retornamos 200 mesmo no erro para evitar que o MP fique tentando reenviar infinitamente
    return res.status(200).send('Handled');
  }
}
