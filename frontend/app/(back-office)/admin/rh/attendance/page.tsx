'use client';

import { Header } from '@/components/Header';
import { FormSelect } from '@/components/FormSelect';
import { FormInput } from '@/components/FormInput';
import { usePermission } from '@/hooks/usePermission';
import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import Link from 'next/link';

interface AttendanceRecord {
  id: string;
  employee: { id: string; nom: string; prenom: string };
  datePointage: string;
  heureArrivee: string;
  heureDepart: string | null;
}

export default function AttendancePage() {
  const { hasPermission } = usePermission();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedEmployee, selectedDate, attendance]);

  const fetchData = async () => {
    try {
      const attendanceResponse = await fetch('/api/attendance');
      const employeesResponse = await fetch('/api/employees');

      if (attendanceResponse.ok) {
        const data = await attendanceResponse.json();
        setAttendance(data);
      }
      if (employeesResponse.ok) {
        const data = await employeesResponse.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = attendance;

    if (selectedEmployee) {
      filtered = filtered.filter((a) => a.employee.id === selectedEmployee);
    }

    if (selectedDate) {
      filtered = filtered.filter(
        (a) =>
          new Date(a.datePointage).toISOString().split('T')[0] === selectedDate
      );
    }

    setFilteredAttendance(filtered);
  };

  const calculateDuration = (arrival: string, departure: string | null) => {
    if (!departure) return '-';
    const start = new Date(arrival);
    const end = new Date(departure);
    const hours = (end.getTime() - start.getTime()) / 3600000;
    return `${hours.toFixed(2)}h`;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.text('Registre des Présences', pageWidth / 2, 15, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(
      `Date du rapport: ${new Date().toLocaleDateString('fr-FR')}`,
      pageWidth / 2,
      25,
      { align: 'center' }
    );

    // Table
    const tableData = filteredAttendance.map((att) => [
      `${att.employee.prenom} ${att.employee.nom}`,
      new Date(att.datePointage).toLocaleDateString('fr-FR'),
      new Date(att.heureArrivee).toLocaleTimeString('fr-FR'),
      att.heureDepart
        ? new Date(att.heureDepart).toLocaleTimeString('fr-FR')
        : 'En cours',
      calculateDuration(att.heureArrivee, att.heureDepart),
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: [
        ['Employé', 'Date', 'Arrivée', 'Départ', 'Durée'],
      ],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    doc.save('presence.pdf');
  };

  const exportExcel = () => {
    const data = filteredAttendance.map((att) => ({
      Employé: `${att.employee.prenom} ${att.employee.nom}`,
      Date: new Date(att.datePointage).toLocaleDateString('fr-FR'),
      Arrivée: new Date(att.heureArrivee).toLocaleTimeString('fr-FR'),
      Départ: att.heureDepart
        ? new Date(att.heureDepart).toLocaleTimeString('fr-FR')
        : 'En cours',
      Durée: calculateDuration(att.heureArrivee, att.heureDepart),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Présences');
    XLSX.writeFile(wb, 'presence.xlsx');
  };

  if (!hasPermission('view_stats')) {
    return (
      <div className="flex flex-col">
        <Header title="Registre des Présences" />
        <div className="p-8">
          <p className="text-red-600">
            Vous n'avez pas la permission d'accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Registre des Présences" />

      <div className="p-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E5E7EB]">
          <Link 
            href="/admin/rh" 
            className="px-4 py-2 font-medium text-[#6B7280] hover:text-[#374151] transition-colors cursor-pointer"
          >
            Employés
          </Link>
          <Link 
            href="/admin/rh/roles" 
            className="px-4 py-2 font-medium text-[#6B7280] hover:text-[#374151] transition-colors cursor-pointer"
          >
            Rôles
          </Link>
          <div className="px-4 py-2 font-medium text-[#E8690A] border-b-2 border-[#E8690A]">
            Présences
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Employé
              </label>
            <FormSelect
              label="Employé"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              options={[
                { value: '', label: 'Tous les employés' },
                ...employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.prenom} ${emp.nom}`,
                })),
              ]}
            />
            </div>

            <div>
              <FormInput
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={exportPDF}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <FileText size={18} />
                PDF
              </button>
              <button
                onClick={exportExcel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download size={18} />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Heure arrivée
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Heure départ
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Durée
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {att.employee.prenom} {att.employee.nom}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {new Date(att.datePointage).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {new Date(att.heureArrivee).toLocaleTimeString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {att.heureDepart
                      ? new Date(att.heureDepart).toLocaleTimeString('fr-FR')
                      : 'En cours'}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {calculateDuration(att.heureArrivee, att.heureDepart)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
