import { sendEmail, sendEmailMultiple } from './mailer';

const APP_NAME = 'Kama-Délices';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kama-delices.com';
const EMAIL_RESPONSABLE_COMMANDES = process.env.EMAIL_RESPONSABLE_COMMANDES || ADMIN_EMAIL;
const EMAIL_RESPONSABLE_RH = process.env.EMAIL_RESPONSABLE_RH || ADMIN_EMAIL;

/**
 * Template HTML de base pour les emails
 */
function emailTemplate(titre: string, contenu: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${APP_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: #E8690A; color: white; padding: 20px; border-radius: 4px 4px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .footer { background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background-color: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .alert { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .success { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${titre}</h1>
        </div>
        <div class="content">
          ${contenu}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.</p>
          <p>Cet email a été généré automatiquement. Veuillez ne pas répondre directement.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envoie un email pour une nouvelle commande
 */
export async function emailNouvelleCommande(
  numeroCommande: string,
  clientNom: string,
  clientPrenom: string,
  montant: number,
  nbArticles: number
): Promise<void> {
  const contenu = `
    <p>Une nouvelle commande vient d'être reçue.</p>
    <table>
      <tr>
        <th>Numéro de commande</th>
        <td>#${numeroCommande}</td>
      </tr>
      <tr>
        <th>Client</th>
        <td>${clientPrenom} ${clientNom}</td>
      </tr>
      <tr>
        <th>Nombre d'articles</th>
        <td>${nbArticles}</td>
      </tr>
      <tr>
        <th>Montant</th>
        <td>${montant} FCFA</td>
      </tr>
    </table>
    <p><strong>Action requise :</strong> Veuillez consulter le tableau de bord pour valider ou refuser cette commande.</p>
  `;

  await sendEmailMultiple(
    [ADMIN_EMAIL, EMAIL_RESPONSABLE_COMMANDES],
    `🍽️ Nouvelle commande reçue - #${numeroCommande}`,
    emailTemplate('Nouvelle Commande', contenu)
  );
}

/**
 * Envoie un email pour une nouvelle commande personnalisée
 */
export async function emailNouvelleCommandePerso(
  numeroCommande: string,
  clientNom: string,
  clientPrenom: string,
  description: string
): Promise<void> {
  const contenu = `
    <p>Une nouvelle commande personnalisée demande votre validation.</p>
    <table>
      <tr>
        <th>Numéro de commande</th>
        <td>#${numeroCommande}</td>
      </tr>
      <tr>
        <th>Client</th>
        <td>${clientPrenom} ${clientNom}</td>
      </tr>
      <tr>
        <th>Description</th>
        <td>${description}</td>
      </tr>
    </table>
    <div class="alert">
      <strong>⚠️ Attention :</strong> Cette commande personnalisée nécessite votre validation avant de pouvoir être acceptée par le client.
    </div>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `📋 Nouvelle commande personnalisée - #${numeroCommande}`,
    emailTemplate('Commande Personnalisée', contenu)
  );
}

/**
 * Envoie un email pour l'annulation d'une commande
 */
export async function emailAnnulationCommande(
  numeroCommande: string,
  clientNom: string,
  clientPrenom: string,
  motif: string
): Promise<void> {
  const contenu = `
    <p>Une commande a été annulée.</p>
    <table>
      <tr>
        <th>Numéro de commande</th>
        <td>#${numeroCommande}</td>
      </tr>
      <tr>
        <th>Client</th>
        <td>${clientPrenom} ${clientNom}</td>
      </tr>
      <tr>
        <th>Motif de l'annulation</th>
        <td>${motif}</td>
      </tr>
    </table>
  `;

  await sendEmailMultiple(
    [ADMIN_EMAIL, EMAIL_RESPONSABLE_COMMANDES],
    `❌ Commande annulée - #${numeroCommande}`,
    emailTemplate('Annulation de Commande', contenu)
  );
}

/**
 * Envoie un email pour un nouveau message de contact
 */
export async function emailNouveauMessage(
  nomClient: string,
  telephone: string,
  messageContenu: string
): Promise<void> {
  const contenu = `
    <p>Un nouveau message de contact a été reçu.</p>
    <table>
      <tr>
        <th>Expéditeur</th>
        <td>${nomClient}</td>
      </tr>
      <tr>
        <th>Téléphone</th>
        <td>${telephone}</td>
      </tr>
      <tr>
        <th>Message</th>
        <td>${messageContenu.replace(/\n/g, '<br>')}</td>
      </tr>
    </table>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `📬 Nouveau message de contact - ${nomClient}`,
    emailTemplate('Nouveau Message', contenu)
  );
}

/**
 * Envoie le rapport journalier avec statistiques du jour
 */
export async function emailRapportJournalier(
  date: Date,
  chiffreAffaires: number,
  nbCommandes: number,
  tauxAnnulation: number
): Promise<void> {
  const dateFormatee = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const contenu = `
    <p>Voici le résumé du jour ${dateFormatee}.</p>
    <table>
      <tr>
        <th>Métrique</th>
        <th>Valeur</th>
      </tr>
      <tr>
        <td>Chiffre d'affaires</td>
        <td><strong>${chiffreAffaires} FCFA</strong></td>
      </tr>
      <tr>
        <td>Nombre de commandes</td>
        <td><strong>${nbCommandes}</strong></td>
      </tr>
      <tr>
        <td>Taux d'annulation</td>
        <td><strong>${tauxAnnulation.toFixed(1)}%</strong></td>
      </tr>
    </table>
    <div class="success">
      ✅ Rapport généré automatiquement à ${new Date().toLocaleTimeString('fr-FR')}
    </div>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `📊 Rapport journalier - ${dateFormatee}`,
    emailTemplate('Rapport Journalier', contenu)
  );
}

/**
 * Envoie le rapport hebdomadaire
 */
export async function emailRapportHebdomadaire(
  semaine: string,
  donnees: {
    chiffreAffaires: number;
    nombreCommandes: number;
    tauxAnnulation: number;
    commandesParJour: Record<string, number>;
  }
): Promise<void> {
  const lignesJour = Object.entries(donnees.commandesParJour)
    .map(([jour, count]) => `<tr><td>${jour}</td><td>${count}</td></tr>`)
    .join('');

  const contenu = `
    <p>Voici le résumé de la semaine du ${semaine}.</p>
    <table>
      <tr>
        <th>Métrique</th>
        <th>Valeur</th>
      </tr>
      <tr>
        <td>Chiffre d'affaires total</td>
        <td><strong>${donnees.chiffreAffaires} FCFA</strong></td>
      </tr>
      <tr>
        <td>Nombre de commandes</td>
        <td><strong>${donnees.nombreCommandes}</strong></td>
      </tr>
      <tr>
        <td>Taux d'annulation</td>
        <td><strong>${donnees.tauxAnnulation.toFixed(1)}%</strong></td>
      </tr>
    </table>
    <h3>Commandes par jour</h3>
    <table>
      <tr>
        <th>Jour</th>
        <th>Nombre de commandes</th>
      </tr>
      ${lignesJour}
    </table>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `📈 Rapport hebdomadaire - Semaine du ${semaine}`,
    emailTemplate('Rapport Hebdomadaire', contenu)
  );
}

/**
 * Envoie le rapport mensuel
 */
export async function emailRapportMensuel(
  mois: string,
  donnees: {
    chiffreAffaires: number;
    nombreCommandes: number;
    tauxAnnulation: number;
    tauxCroissance: number;
  }
): Promise<void> {
  const croissanceSymbol = donnees.tauxCroissance >= 0 ? '📈' : '📉';

  const contenu = `
    <p>Voici le résumé du mois de ${mois}.</p>
    <table>
      <tr>
        <th>Métrique</th>
        <th>Valeur</th>
      </tr>
      <tr>
        <td>Chiffre d'affaires total</td>
        <td><strong>${donnees.chiffreAffaires} FCFA</strong></td>
      </tr>
      <tr>
        <td>Nombre de commandes</td>
        <td><strong>${donnees.nombreCommandes}</strong></td>
      </tr>
      <tr>
        <td>Taux d'annulation</td>
        <td><strong>${donnees.tauxAnnulation.toFixed(1)}%</strong></td>
      </tr>
      <tr>
        <td>Taux de croissance</td>
        <td><strong>${croissanceSymbol} ${donnees.tauxCroissance > 0 ? '+' : ''}${donnees.tauxCroissance.toFixed(1)}%</strong></td>
      </tr>
    </table>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `📋 Rapport mensuel - ${mois}`,
    emailTemplate('Rapport Mensuel', contenu)
  );
}

/**
 * Envoie une alerte pour un stagiaire dont le stage se termine bientôt
 */
export async function emailAlerteStagiaire(
  nomEmploye: string,
  prenomEmploye: string,
  dateFinStage: Date
): Promise<void> {
  const dateFormatee = dateFinStage.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const contenu = `
    <div class="alert">
      <strong>⚠️ Important :</strong> Un stage arrive à son terme.
    </div>
    <table>
      <tr>
        <th>Stagiaire</th>
        <td>${prenomEmploye} ${nomEmploye}</td>
      </tr>
      <tr>
        <th>Date de fin du stage</th>
        <td>${dateFormatee}</td>
      </tr>
    </table>
    <p>Veuillez prévoir un entretien de fin de stage et les formalités administratives avant cette date.</p>
  `;

  await sendEmailMultiple(
    [ADMIN_EMAIL, EMAIL_RESPONSABLE_RH],
    `⏰ Alerte fin de stage - ${prenomEmploye} ${nomEmploye}`,
    emailTemplate('Alerte Fin de Stage', contenu)
  );
}
