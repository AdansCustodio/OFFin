import { MercadoPagoConfig, Payment } from 'mercadopago';

// PASSO LÓGICO 1: O código que recebe o pedido do React para gerar o PIX.
export default async function handler(req, res) {
  // A Vercel exige que lidemos com o CORS (permissão para o seu site falar com a API)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Em produção, troque '*' pelo seu domínio Vercel
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Se o navegador estiver apenas checando permissões (preflight), responda OK.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Segurança: Só aceita métodos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    // 1. Extrai as informações que o React enviou (Quem está comprando e qual o valor)
    const { amount, userId, packageId } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: 'Faltam dados obrigatórios (amount, userId).' });
    }

    // 2. Configura o Mercado Pago com a sua Chave Secreta.
    // DICA VITAL: Você nunca escreve a chave direto no código. Usa uma variável de ambiente (process.env) na Vercel!
    const accessToken = process.env.MP_ACCESS_TOKEN;
    
    if (!accessToken) {
       console.error("Aviso: Chave do Mercado Pago não configurada na Vercel.");
       return res.status(500).json({ error: 'Erro de configuração do servidor.' });
    }

    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const payment = new Payment(client);

    // 3. Cria o pedido de PIX
    const idempotencyKey = crypto.randomUUID(); // Para evitar cobranças duplicadas caso a internet caia

    const paymentData = {
      body: {
        transaction_amount: Number(amount), // Valor em Reais (ex: 5.99)
        description: `Pacote de ${packageId} Moedas - OFFin`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@offin.network', // O MP exige um email (pode ser genérico ou o real do usuário)
        },
        // A METADATA É O SEGREDO! Guardamos o UID do usuário aqui. 
        // Quando o pagamento for aprovado, o Mercado Pago devolve esse UID para sabermos quem pagou!
        metadata: {
          user_id: userId,
          package_id: packageId
        }
      },
      requestOptions: { idempotencyKey }
    };

    // 4. Envia para o Mercado Pago e aguarda a resposta
    const result = await payment.create(paymentData);

    // 5. Devolve as informações do PIX para o React exibir na tela
    return res.status(200).json({
      success: true,
      id: result.id, // O ID único da transação
      qr_code: result.point_of_interaction.transaction_data.qr_code, // O código "Copia e Cola"
      qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64 // A imagem do QR Code
    });

  } catch (error) {
    console.error('Erro ao gerar pagamento MP:', error);
    return res.status(500).json({ error: 'Falha ao processar pagamento com o banco.' });
  }
}
