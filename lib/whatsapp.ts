import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

// Vérifier que les credentials Twilio sont valides
const isValidTwilioConfig = 
  accountSid && 
  authToken && 
  fromNumber && 
  accountSid.startsWith('AC');

if (!isValidTwilioConfig) {
  console.warn('⚠️  Variables Twilio manquantes ou invalides - Les notifications WhatsApp seront désactivées');
}

const client = isValidTwilioConfig ? twilio(accountSid, authToken) : null;

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (!client) {
    console.warn('❌ Client Twilio non initialisé');
    return;
  }

  try {
    // Normaliser le numéro WhatsApp (ajouter whatsapp: prefix si absent)
    const whatsappNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await client.messages.create({
      from: fromNumber,
      to: whatsappNumber,
      body: message,
    });

    console.log(`✅ Message WhatsApp envoyé: ${result.sid}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message WhatsApp:', error);
    // Ne pas lever l'erreur pour éviter de bloquer le processus principal
  }
}

export default client;
