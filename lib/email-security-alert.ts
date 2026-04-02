/**
 * Security alert email template function
 */

import { sendEmail } from './mailer';

const APP_NAME = 'Kama-Délices';

function securityAlertTemplate(titre: string, message: string, ipAddress: string): string {
  const maintenant = new Date().toLocaleString('fr-FR');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${APP_NAME} - Alerte de Sécurité</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: #DC2626; color: white; padding: 20px; border-radius: 4px 4px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .footer { background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280; }
        .alert { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .info-box { background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0; }
        code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 ${titre}</h1>
        </div>
        <div class="content">
          <div class="alert">
            <strong>Alerte de Sécurité Critique</strong>
            <p>${message}</p>
          </div>

          <div class="info-box">
            <h3>Détails de l'incident</h3>
            <p>
              <strong>Adresse IP :</strong> <code>${ipAddress}</code><br>
              <strong>Date et Heure :</strong> ${maintenant} (UTC+0)<br>
              <strong>Type :</strong> Tentative de sécurité anormale
            </p>
          </div>

          <div class="warning">
            <strong>⚠️ Actions recommandées :</strong>
            <ul>
              <li>Vérifiez votre compte pour toute activité suspecte</li>
              <li>Changez votre mot de passe si vous ne reconnaissez pas cette tentative</li>
              <li>Contactez l'administrateur système si vous avez des préoccupations</li>
              <li>Consultez le journal de sécurité pour plus de détails</li>
            </ul>
          </div>

          <p><strong>Important :</strong> ${APP_NAME} ne vous demandera jamais votre mot de passe par email. Si vous recevez un email suspect prétendant venir de ${APP_NAME}, veuillez le signaler immédiatement.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.</p>
          <p>Cet email a été généré automatiquement à des fins de sécurité.</p>
          <p>Heure d'envoi : ${maintenant}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send security alert email
 */
export async function sendSecurityAlert(
  email: string,
  titre: string,
  message: string,
  ipAddress: string
): Promise<void> {
  try {
    await sendEmail(
      email,
      `🔒 Alerte de Sécurité : ${titre}`,
      securityAlertTemplate(titre, message, ipAddress)
    );
  } catch (error) {
    console.error('Error sending security alert email:', error);
    throw error;
  }
}
