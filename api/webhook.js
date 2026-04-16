import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

/**
 * PASSO LÓGICO 2: O Webhook que recebe a confirmação do Mercado Pago
 * e injeta as moedas na conta do utilizador no Firestore.
 */

// 1. Inicialização Segura do Firebase Admin (Privilégios de Servidor)
// A Vercel reaproveita instâncias, por isso verificamos se já está inicializado
if (!admin.apps.length) {
  try {
    // FIREBASE_SERVICE_ACCOUNT é uma variável de ambiente que terá o JSON com a sua chave de administrador
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Erro fatal ao inicializar Firebase Admin. Verifique a variável FIREBASE_SERVICE_ACCOUNT:', error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Apenas aceita requisições POST (o formato padrão de webhooks do MP)
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { type, data } = req.body;

    // 2. O Mercado Pago envia vários tipos de notificação. 
    // Só queremos agir quando for uma notificação de "payment" (pagamento).
    if (type === 'payment' && data && data.id) {
      const paymentId = data.id;
      
      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (!accessToken) throw new Error("MP_ACCESS_TOKEN não configurado.");

      const client = new MercadoPagoConfig({ accessToken: accessToken });
      const payment = new Payment(client);

      // 3. SEGURANÇA: Nunca confie cegamente no corpo (body) do webhook. 
      // Usamos o ID que recebemos para ir diretamente aos servidores do MP perguntar o estado real da transação.
      const paymentData = await payment.get({ id: paymentId });

      // Se o pagamento estiver confirmado como "approved" (aprovado)
      if (paymentData.status === 'approved') {
        
        // 4. Lembra-se da "metadata" que enviámos no create-payment.js? Aqui a recuperamos!
        // O Mercado Pago converte as chaves de metadata, por isso acedemos com segurança.
        const userId = paymentData.metadata?.user_id;
        const packageId = paymentData.metadata?.package_id;
        
        // Substitua pelo ID real do seu projeto, caso tenha mudado
        const appId = "offinn-89849"; 

        if (userId && packageId) {
          const userRef = db.doc(`artifacts/${appId}/public/data/users/${userId}`);
          
          // 5. Transação Atômica do Admin para somar as moedas sem falhas
          await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (doc.exists) {
              const currentTokens = doc.data().tokens || 0;
              const tokensToAdd = Number(packageId); // Adiciona 1, 5 ou 10 moedas consoante a compra
              t.update(userRef, { tokens: currentTokens + tokensToAdd });
            }
          });
          
          console.log(`[SUCESSO] Pagamento ${paymentId} aprovado. ${packageId} moedas creditadas ao utilizador ${userId}.`);
        }
      }
    }

    // 6. REGRA DE OURO DOS WEBHOOKS: Retorne 200 OK o mais rápido possível.
    // Se não retornar 200, o Mercado Pago acha que o seu servidor falhou e vai continuar a bombardear
    // a sua API com a mesma notificação durante dias.
    return res.status(200).send('OK');

  } catch (error) {
    console.error('Erro no processamento do webhook MP:', error);
    // Mesmo com erro, devolvemos 200 para o MP parar de tentar, mas registamos o erro nos logs da Vercel
    return res.status(200).send('Processed with errors');
  }
}
