import { sendWhatsApp } from './whatsapp';

/**
 * Notifie le client que sa commande a bien été reçue
 */
export async function notifyCommandeRecue(
  telephone: string,
  numeroCommande: string
): Promise<void> {
  const message = `Bonjour, votre commande N°${numeroCommande} a bien été reçue. Nous vous confirmons sa prise en charge.`;
  await sendWhatsApp(telephone, message);
}

/**
 * Notifie le client que sa commande personnalisée a été acceptée avec le lien de paiement
 */
export async function notifyCommandeAcceptee(
  telephone: string,
  numeroCommande: string,
  montant: number,
  lienPaiement: string
): Promise<void> {
  const message = `Votre commande personnalisée N°${numeroCommande} a été acceptée. Montant : ${montant} FCFA. Procédez au paiement ici : ${lienPaiement}`;
  await sendWhatsApp(telephone, message);
}

/**
 * Notifie le client que sa commande a été refusée avec le motif
 */
export async function notifyCommandeRefusee(
  telephone: string,
  numeroCommande: string,
  motif: string
): Promise<void> {
  const message = `Votre commande N°${numeroCommande} n'a pas pu être acceptée. Motif : ${motif}`;
  await sendWhatsApp(telephone, message);
}

/**
 * Notifie le client du changement de statut de sa commande
 */
export async function notifyStatutCommande(
  telephone: string,
  numeroCommande: string,
  statut: string
): Promise<void> {
  const message = `Votre commande N°${numeroCommande} est maintenant : ${statut}`;
  await sendWhatsApp(telephone, message);
}

/**
 * Notifie le client que sa commande a bien été annulée
 */
export async function notifyAnnulationConfirmee(
  telephone: string,
  numeroCommande: string
): Promise<void> {
  const message = `Votre commande N°${numeroCommande} a bien été annulée.`;
  await sendWhatsApp(telephone, message);
}

/**
 * Envoie un code OTP au client pour l'authentification
 */
export async function notifyOTP(
  telephone: string,
  code: string
): Promise<void> {
  const message = `Votre code de vérification Kama-Délices est : ${code}. Valable 10 minutes.`;
  await sendWhatsApp(telephone, message);
}
