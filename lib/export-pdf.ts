import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare global {
  namespace jsPDF {
    interface jsPDF {
      autoTable: any;
    }
  }
}

/**
 * Exporte les présences en PDF formaté
 */
export function exportPresencesPDF(
  attendances: Array<{
    employee: { nom: string; prenom: string };
    datePointage: string;
    heureArrivee: string;
    heureDepart: string | null;
  }>,
  filtres: { dateDebut?: string; dateFin?: string }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // A4 dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  // En-tête
  doc.setFontSize(16);
  doc.setFont('', 'bold');
  doc.text('KAMA-DÉLICES', pageWidth / 2, margin + 5, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('', 'normal');
  doc.text('Registre des Présences', pageWidth / 2, margin + 15, { align: 'center' });

  // Date d'export
  doc.setFontSize(10);
  const dateExport = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Date d'export: ${dateExport}`, margin, margin + 25);

  // Période de filtrage
  let periodeText = '';
  if (filtres.dateDebut && filtres.dateFin) {
    periodeText = `Période: ${new Date(filtres.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(filtres.dateFin).toLocaleDateString('fr-FR')}`;
  }
  if (periodeText) {
    doc.text(periodeText, margin, margin + 32);
  }

  // Calcul des heures totales
  let totalHeures = 0;
  const tableData = attendances.map((attendance) => {
    const debut = new Date(`2000-01-01 ${attendance.heureArrivee}`);
    const fin = attendance.heureDepart
      ? new Date(`2000-01-01 ${attendance.heureDepart}`)
      : new Date();
    const heures = (fin.getTime() - debut.getTime()) / (1000 * 60 * 60);
    totalHeures += heures;

    return [
      `${attendance.employee.prenom} ${attendance.employee.nom}`,
      new Date(attendance.datePointage).toLocaleDateString('fr-FR'),
      attendance.heureArrivee,
      attendance.heureDepart || '-',
      `${heures.toFixed(2)}h`,
    ];
  });

  // Tableau
  (doc as any).autoTable({
    head: [['Employé', 'Date', 'Arrivée', 'Départ', 'Durée']],
    body: tableData,
    startY: filtres.dateDebut && filtres.dateFin ? margin + 40 : margin + 32,
    margin: margin,
    styles: {
      cellPadding: 4,
      fontSize: 10,
      textColor: [26, 26, 46],
    },
    headStyles: {
      fillColor: [232, 105, 10],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [254, 243, 234],
    },
    didDrawPage: (data: any) => {
      // Numérotation des pages
      const pageCount = (doc as any).internal.getPages().length;
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      const pageWidth = pageSize.getWidth();

      doc.setFontSize(10);
      doc.text(
        `Page ${data.pageNumber} sur ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  // Total des heures en bas
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('', 'bold');
  doc.text(`Total des heures: ${totalHeures.toFixed(2)}h`, margin, finalY);

  // Sauvegarder
  doc.save(`presences-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Exporte un rapport financier en PDF
 */
export function exportRapportFinancierPDF(
  donnees: {
    chiffreAffaires: number;
    nombreCommandes: number;
    tauxAnnulation: number;
    topPlats: Array<{
      nom: string;
      quantite: number;
      chiffreAffaires: number;
    }>;
  },
  periode: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // A4 dimensions
  const pageWidth = 210;
  const margin = 15;
  let currentY = margin;

  // En-tête
  doc.setFontSize(16);
  doc.setFont('', 'bold');
  doc.text('KAMA-DÉLICES', pageWidth / 2, currentY + 5, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('', 'normal');
  doc.text('Rapport Financier', pageWidth / 2, currentY + 15, { align: 'center' });

  currentY += 25;

  // Période
  doc.setFontSize(10);
  doc.text(`Période: ${periode}`, margin, currentY);
  currentY += 8;

  // KPIs principaux
  doc.setFont('', 'bold');
  doc.text('Résumé des Performances', margin, currentY);
  currentY += 7;

  doc.setFont('', 'normal');
  doc.setFontSize(9);

  const kpis = [
    { label: 'Chiffre d\'affaires', value: `${donnees.chiffreAffaires} FCFA` },
    { label: 'Nombre de commandes', value: donnees.nombreCommandes.toString() },
    { label: 'Taux d\'annulation', value: `${donnees.tauxAnnulation.toFixed(1)}%` },
  ];

  kpis.forEach((kpi) => {
    doc.text(`${kpi.label}: ${kpi.value}`, margin + 5, currentY);
    currentY += 6;
  });

  currentY += 5;

  // Top 5 des plats
  doc.setFont('', 'bold');
  doc.setFontSize(10);
  doc.text('Top 5 des Plats les Plus Commandés', margin, currentY);
  currentY += 7;

  const tableData = donnees.topPlats.slice(0, 5).map((plat) => [
    plat.nom,
    plat.quantite.toString(),
    `${plat.chiffreAffaires} FCFA`,
  ]);

  (doc as any).autoTable({
    head: [['Plat', 'Quantité', 'Chiffre d\'affaires']],
    body: tableData,
    startY: currentY,
    margin: margin,
    styles: {
      cellPadding: 4,
      fontSize: 9,
      textColor: [26, 26, 46],
    },
    headStyles: {
      fillColor: [232, 105, 10],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [254, 243, 234],
    },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setFont('', 'normal');
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
    margin,
    finalY
  );

  doc.save(`rapport-financier-${new Date().toISOString().split('T')[0]}.pdf`);
}
