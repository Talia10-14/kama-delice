'use client';

import { Header } from '@/components/Header';
import { usePermission } from '@/hooks/usePermission';
import { useEffect, useState } from 'react';
import { TrendingUp, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function FinancesPage() {
  const { hasPermission } = usePermission();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
    cancellationRate: 0,
  });

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const response = await fetch('/api/finances');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch finances:', error);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text('Rapport Financier', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(
      `Date du rapport: ${new Date().toLocaleDateString('fr-FR')}`,
      pageWidth / 2,
      25,
      { align: 'center' }
    );

    let yPos = 40;

    const addSection = (title: string, data: Array<{ label: string; value: string }>) => {
      doc.setFontSize(12);
      doc.text(title, 15, yPos);
      yPos += 10;

      doc.setFontSize(10);
      data.forEach(({ label, value }) => {
        doc.text(`${label}: ${value}`, 20, yPos);
        yPos += 7;
      });
      yPos += 5;
    };

    addSection('Chiffre d\'affaires', [
      { label: 'Aujourd\'hui', value: `${stats.todayRevenue.toFixed(2)}€` },
      { label: 'Cette semaine', value: `${stats.weekRevenue.toFixed(2)}€` },
      { label: 'Ce mois', value: `${stats.monthRevenue.toFixed(2)}€` },
    ]);

    addSection('Commandes', [
      { label: 'Aujourd\'hui', value: `${stats.todayOrders}` },
      { label: 'Cette semaine', value: `${stats.weekOrders}` },
      { label: 'Ce mois', value: `${stats.monthOrders}` },
    ]);

    addSection('Statistiques', [
      { label: 'Taux d\'annulation', value: `${stats.cancellationRate.toFixed(2)}%` },
    ]);

    doc.save('rapport-financier.pdf');
  };

  const exportExcel = () => {
    const data = [
      { Période: 'Aujourd\'hui', Revenue: stats.todayRevenue, Commandes: stats.todayOrders },
      { Période: 'Cette semaine', Revenue: stats.weekRevenue, Commandes: stats.weekOrders },
      { Période: 'Ce mois', Revenue: stats.monthRevenue, Commandes: stats.monthOrders },
      { Période: 'Taux d\'annulation', Revenue: `${stats.cancellationRate}%`, Commandes: '-' },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Finances');
    XLSX.writeFile(wb, 'rapport-financier.xlsx');
  };

  if (!hasPermission('voir_rapports')) {
    return (
      <div className="flex flex-col">
        <Header title="Finances" />
        <div className="p-8">
          <p className="text-red-600">
            Vous n'avez pas la permission d'accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  const Stat = ({
    title,
    value,
    subtitle,
  }: {
    title: string;
    value: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-[#6B7280] text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold text-[#1A1A2E]">{value}</p>
      {subtitle && <p className="text-xs text-[#6B7280] mt-2">{subtitle}</p>}
    </div>
  );

  return (
    <div className="flex flex-col">
      <Header title="Finances" />

      <div className="p-8 space-y-8">
        {/* Export Buttons */}
        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <FileText size={20} />
            Exporter PDF
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Download size={20} />
            Exporter Excel
          </button>
        </div>

        {/* Revenue Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Chiffre d'affaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Stat
              title="Aujourd'hui"
              value={`${stats.todayRevenue.toFixed(2)}€`}
            />
            <Stat
              title="Cette semaine"
              value={`${stats.weekRevenue.toFixed(2)}€`}
            />
            <Stat title="Ce mois" value={`${stats.monthRevenue.toFixed(2)}€`} />
          </div>
        </div>

        {/* Orders Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Nombre de commandes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Stat title="Aujourd'hui" value={`${stats.todayOrders}`} />
            <Stat title="Cette semaine" value={`${stats.weekOrders}`} />
            <Stat title="Ce mois" value={`${stats.monthOrders}`} />
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Statistiques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Stat
              title="Taux d'annulation"
              value={`${stats.cancellationRate.toFixed(2)}%`}
            />
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-[#6B7280] text-sm mb-2">Moyenne par commande</p>
              <p className="text-3xl font-bold text-[#1A1A2E]">
                {stats.todayOrders > 0
                  ? `${(stats.todayRevenue / stats.todayOrders).toFixed(2)}€`
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
