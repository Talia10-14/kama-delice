import * as XLSX from 'xlsx';

/**
 * Exporte les présences en fichier Excel formaté
 */
export function exportPresencesExcel(
  attendances: Array<{
    employee: { nom: string; prenom: string };
    datePointage: string;
    heureArrivee: string;
    heureDepart: string | null;
  }>
): void {
  const data = attendances.map((attendance) => {
    const debut = new Date(`2000-01-01 ${attendance.heureArrivee}`);
    const fin = attendance.heureDepart
      ? new Date(`2000-01-01 ${attendance.heureDepart}`)
      : new Date();
    const heures = (fin.getTime() - debut.getTime()) / (1000 * 60 * 60);

    return {
      'Employé': `${attendance.employee.prenom} ${attendance.employee.nom}`,
      'Date': new Date(attendance.datePointage).toLocaleDateString('fr-FR'),
      'Heure d\'arrivée': attendance.heureArrivee,
      'Heure de départ': attendance.heureDepart || '-',
      'Durée (heures)': Number(heures.toFixed(2)),
    };
  });

  // Calcul du total
  const totalHeures = data.reduce((acc, row) => {
    const duree = typeof row['Durée (heures)'] === 'number' ? row['Durée (heures)'] : 0;
    return acc + duree;
  }, 0);

  // Ajouter la ligne de total
  data.push({
    'Employé': 'TOTAL',
    'Date': '',
    'Heure d\'arrivée': '',
    'Heure de départ': '',
    'Durée (heures)': Number(totalHeures.toFixed(2)),
  } as any);

  // Créer le workbook
  const ws = XLSX.utils.json_to_sheet(data);

  // Mise en forme
  ws['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  // Mettre les en-têtes en gras
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FFE8690A' } },
      alignment: { horizontal: 'center' },
    };
  }

  // Mettre la ligne de total en gras
  const lastRow = range.e.r;
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + (lastRow + 1);
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FFF3F4F6' } },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Présences');

  XLSX.writeFile(wb, `presences-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporte un rapport financier en fichier Excel
 */
export function exportRapportFinancierExcel(
  donnees: {
    chiffreAffaires: number;
    nombreCommandes: number;
    tauxAnnulation: number;
    commandes: Array<{
      numero: string;
      date: string;
      client: string;
      montant: number;
      statut: string;
    }>;
  },
  periode: string
): void {
  const wb = XLSX.utils.book_new();

  // Feuille 1: Résumé
  const resumeData = [
    ['RÉSUMÉ DU RAPPORT FINANCIER'],
    [],
    ['Période', periode],
    ['Chiffre d\'affaires', donnees.chiffreAffaires],
    ['Nombre de commandes', donnees.nombreCommandes],
    ['Taux d\'annulation', `${donnees.tauxAnnulation.toFixed(1)}%`],
    [],
    ['Montant moyen par commande', donnees.nombreCommandes > 0 ? (donnees.chiffreAffaires / donnees.nombreCommandes).toFixed(0) : 0],
  ];

  const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
  wsResume['!cols'] = [{ wch: 30 }, { wch: 20 }];

  // Format des en-têtes
  for (let row of [0, 2, 7]) {
    const cell = `A${row + 1}`;
    if (wsResume[cell]) {
      wsResume[cell].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'FFE8690A' } },
      };
    }
  }

  // Feuille 2: Détail des commandes
  const commandesData = donnees.commandes.map((cmd) => ({
    'N° Commande': cmd.numero,
    'Date': new Date(cmd.date).toLocaleDateString('fr-FR'),
    'Client': cmd.client,
    'Montant': cmd.montant,
    'Statut': cmd.statut,
  }));

  const wsCommandes = XLSX.utils.json_to_sheet(commandesData);
  wsCommandes['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
  ];

  // Format des en-têtes
  const rangeCmd = XLSX.utils.decode_range(wsCommandes['!ref'] || 'A1');
  for (let C = rangeCmd.s.c; C <= rangeCmd.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!wsCommandes[address]) continue;
    wsCommandes[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FFE8690A' } },
      alignment: { horizontal: 'center' },
    };
  }

  XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');
  XLSX.utils.book_append_sheet(wb, wsCommandes, 'Détail des commandes');

  XLSX.writeFile(wb, `rapport-financier-${new Date().toISOString().split('T')[0]}.xlsx`);
}
