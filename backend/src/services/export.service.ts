/**
 * Service d'export (PDF et Excel)
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Exporter les données en PDF
 */
export function exportToPDF(
  data: Record<string, unknown>[],
  filename: string,
  columns: string[]
): Buffer {
  const doc = new jsPDF();

  // Titre
  doc.setFontSize(16);
  doc.text(filename, 14, 22);

  // Tableau
  const tableData = data.map((row) =>
    columns.map((col) => String(row[col] || ''))
  );

  // Ajouter le tableau au PDF
  (doc as any).autoTable({
    head: [columns],
    body: tableData,
    startY: 30,
    margin: { top: 20, right: 10, bottom: 10, left: 10 },
  });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Exporter les données en Excel
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  sheetName = 'Sheet1'
): Buffer {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Écrire dans un buffer
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

  return buffer as Buffer;
}

/**
 * Exporter les données en CSV
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  columns: string[]
): string {
  const csvContent = [
    columns.join(','),
    ...data.map((row) =>
      columns
        .map((col) => {
          const value = row[col];
          // Échapper les guillemets et entourer de guillemets
          return `"${String(value || '').replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}
