/**
 * Service WhatsApp via Twilio
 */

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
  console.warn(
    '⚠️  Variables Twilio manquantes ou invalides - Les notifications WhatsApp seront désactivées'
  );
}

const client = isValidTwilioConfig ? twilio(accountSid, authToken) : null;

/**
 * Envoyer un message WhatsApp
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<boolean> {
  if (!client) {
    console.warn('❌ Client Twilio non initialisé');
    return false;
  }

  try {
    // Normaliser le numéro WhatsApp (ajouter le préfixe whatsapp: si absent)
    const whatsappNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await client.messages.create({
      from: fromNumber,
      to: whatsappNumber,
      body: message,
    });

    console.log(`✅ Message WhatsApp envoyé: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message WhatsApp:', error);
    return false;
  }
}

/**
 * Envoyer un message WhatsApp à plusieurs destinataires
 */
export async function sendWhatsAppBulk(
  recipients: string[],
  message: string
): Promise<number> {
  let sent = 0;

  for (const recipient of recipients) {
    const success = await sendWhatsApp(recipient, message);
    if (success) sent++;
  }

  console.log(`ℹ️  ${sent}/${recipients.length} messages WhatsApp envoyés`);
  return sent;
}

export default client;
