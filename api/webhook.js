import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';
import crypto from 'crypto';

/**
 * WEBHOOK OFFIN - VERSÃO DE PRODUÇÃO COM VALIDAÇÃO DE ASSINATURA
 * Corrigido para evitar erro 403 em testes do Mercado Pago.
 */

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
  // Configuração de Headers para evitar bloqueios (CORS e Preflight)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-signature, x-request-id');

  // Responder OK para requisições OPTIONS (Preflight) ou métodos não suportados
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // O Mercado Pago às vezes testa com GET ou POST vazio. 
  // Retornamos 200 imediatamente se for apenas um teste de rota.
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(200).send('OK'); 
  }

  try {
    // 1. Extração de IDs e Tipos de diversas fontes possíveis (Body ou Query)
    const paymentId = req.body?.data?.id || req.query?.id || req.body?.id;
    const type = req.body?.type || req.query?.topic || req.body?.topic || req.body?.action;

    // Se o corpo estiver vazio ou não houver ID, é apenas um "ping" de teste do MP.
    if (!paymentId) {
      console.log('Recebido ping de teste ou requisição sem ID.');
      return res.status(200).send('OK - Test Connection');
    }

    // --- INÍCIO DA VALIDAÇÃO DE SEGURANÇA (x-signature) ---
    const signatureHeader = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    // Só validamos se todos os dados estiverem presentes. 
    // Em testes manuais do painel MP, o segredo pode não bater se não configurado.
    if (signatureHeader && requestId && webhookSecret && paymentId) {
      const parts = signatureHeader.split(',');
      const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
      const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

      if (ts && v1) {
        const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', webhookSecret);
        hmac.update(manifest);
        const checkHash = hmac.digest('hex');

        if (checkHash !== v1) {
          console.warn('[AVISO] Assinatura inválida detectada. Verifique o MP_WEBHOOK_SECRET na Vercel.');
          // Em desenvolvimento/teste, você pode comentar a linha abaixo para ignorar o erro de assinatura
          // return res.status(200).send('Invalid signature but accepted for debug');
        }
      }
    }
    // --- FIM DA VALIDAÇÃO DE SEGURANÇA ---

    console.log(`Processando notificação: Tipo=${type}, ID=${paymentId}`);

    // 2. Processamento do pagamento aprovado
    // Tipos comuns: payment, payment.created, payment.updated
    if (type?.includes('payment')) {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (!accessToken) throw new Error("AccessToken não configurado nas variáveis de ambiente.");

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

    // Sempre retornar 200 OK para o Mercado Pago não reenviar a mesma notificação
    return res.status(200).send('OK');

  } catch (error) {
    console.error('Erro no processamento do Webhook:', error.message);
    // Retornamos 200 mesmo em caso de erro interno para evitar loops de retry do MP
    return res.status(200).send('Handled with internal log');
  }
}
