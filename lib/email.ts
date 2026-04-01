import nodemailer from 'nodemailer';

// Configuration du transporteur email
// Utilise les variables d'environnement pour sécuriser les credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface SendWelcomeEmailParams {
  email: string;
  nom: string;
  prenom: string;
  password: string;
}

export const sendWelcomeEmail = async ({
  email,
  nom,
  prenom,
  password,
}: SendWelcomeEmailParams) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: white; border: 2px solid #E8690A; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .credential-item { margin: 15px 0; }
            .credential-label { font-weight: bold; color: #E8690A; font-size: 12px; text-transform: uppercase; }
            .credential-value { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue à Kama-Délices!</h1>
              <p>Votre compte a été créé avec succès</p>
            </div>
            
            <div class="content">
              <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
              
              <p>Nous sommes heureux de vous accueillir dans le back-office de <strong>Kama-Délices</strong>. Voici vos identifiants de connexion:</p>
              
              <div class="credentials">
                <div class="credential-item">
                  <div class="credential-label">📧 Email (Identifiant)</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label">🔐 Mot de passe</div>
                  <div class="credential-value">${password}</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> Gardez ces identifiants en lieu sûr. Nous vous recommandons de changer votre mot de passe dès votre première connexion.
              </div>
              
              <p><strong>Próchaine étape:</strong></p>
              <ol>
                <li>Accédez à <strong>http://localhost:3000/login</strong></li>
                <li>Entrez votre email et mot de passe</li>
                <li>Connectez-vous et explorez le back-office</li>
              </ol>
              
              <p>Si vous rencontrez des problèmes, contactez votre administrateur.</p>
              
              <p>Bonne journée! 👋</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Kama-Délices Back-office. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Accès Kama-Délices Back-office - Vos identifiants de connexion`,
      html: htmlContent,
      text: `
Bienvenue à Kama-Délices!

Bonjour ${prenom} ${nom},

Voici vos identifiants de connexion:

Email: ${email}
Mot de passe: ${password}

⚠️ Important: Gardez ces identifiants en lieu sûr. Nous vous recommandons de changer votre mot de passe dès votre première connexion.

Próchaine étape:
1. Accédez à http://localhost:3000/login
2. Entrez votre email et mot de passe
3. Connectez-vous et explorez le back-office

Si vous rencontrez des problèmes, contactez votre administrateur.

Bonne journée!

© 2026 Kama-Délices Back-office. Tous droits réservés.
      `,
    });

    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};
