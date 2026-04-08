/**
 * Service Email via Nodemailer
 */

import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const emailFrom = process.env.EMAIL_FROM || 'noreply@kama-delices.com';

let transporter: nodemailer.Transporter | null = null;

// Initialiser le transporteur si les variables sont disponibles
if (smtpHost && smtpUser && smtpPassword) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true pour port 465, false pour autres (587, etc.)
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
} else {
  console.warn(
    '⚠️  Variables SMTP manquantes - Les notifications email seront désactivées'
  );
}

/**
 * Envoyer un email simple
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!transporter) {
    console.warn('❌ Transporteur email non initialisé');
    return false;
  }

  try {
    const result = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Enlever les balises HTML pour le texte brut
    });

    console.log(`✅ Email envoyé: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
}

/**
 * Envoyer un email à plusieurs destinataires
 */
export async function sendEmailMultiple(
  recipients: string[],
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!transporter) {
    console.warn('❌ Transporteur email non initialisé');
    return false;
  }

  try {
    const result = await transporter.sendMail({
      from: emailFrom,
      to: recipients.join(','),
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    console.log(
      `✅ Email envoyé à ${recipients.length} destinataires: ${result.messageId}`
    );
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email multiple:', error);
    return false;
  }
}
