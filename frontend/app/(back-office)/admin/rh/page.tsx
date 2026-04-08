'use client';

import { Header } from '@/components/Header';
import { FormSelect } from '@/components/FormSelect';
import { usePermission } from '@/hooks/usePermission';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, Edit2, Lock } from 'lucide-react';

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  typeContrat: string;
  statut: string;
  dateFin: string | null;
  role: { libelle: string };
}

export default function RHPage() {
  const { hasPermission, isAdmin } = usePermission();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedContrat, setSelectedContrat] = useState<string>('');
  const [selectedStatut, setSelectedStatut] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const typeContrats = ['EMPLOYE', 'STAGIAIRE', 'PRESTATAIRE'];
  const statuts = ['ACTIF', 'INACTIF'];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = employees;

    if (selectedContrat) {
      filtered = filtered.filter((e) => e.typeContrat === selectedContrat);
    }
    if (selectedStatut) {
      filtered = filtered.filter((e) => e.statut === selectedStatut);
    }

    setFilteredEmployees(filtered);
  }, [selectedContrat, selectedStatut, employees]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEndingSoon = (dateFin: string | null) => {
    if (!dateFin) return false;
    const end = new Date(dateFin);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  };

  if (!hasPermission('create_employee')) {
    return (
      <div className="flex flex-col">
        <Header title="Ressources Humaines" />
        <div className="p-8">
          <p className="text-red-600">
            Vous n'avez pas la permission d'accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Ressources Humaines" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 border-b border-[#E5E7EB] overflow-x-auto">
            <Link
              href="/admin/rh"
              className="px-3 sm:px-4 py-2 font-medium text-[#E8690A] border-b-2 border-[#E8690A] text-sm sm:text-base whitespace-nowrap"
            >
              Employés
            </Link>
            <Link
              href="/admin/rh/roles"
              className="px-3 sm:px-4 py-2 font-medium text-[#6B7280] hover:text-[#374151] text-sm sm:text-base whitespace-nowrap"
            >
              Rôles
            </Link>
            <Link
              href="/admin/rh/attendance"
              className="px-3 sm:px-4 py-2 font-medium text-[#6B7280] hover:text-[#374151] text-sm sm:text-base whitespace-nowrap"
            >
              Présences
            </Link>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 lg:gap-4 w-full sm:w-auto">
              <FormSelect
                value={selectedContrat}
                onChange={(e) => setSelectedContrat(e.target.value)}
                options={[
                  { value: '', label: 'Tous les contrats' },
                  ...typeContrats.map((type) => ({
                    value: type,
                    label: type,
                  })),
                ]}
              />

              <FormSelect
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                options={[
                  { value: '', label: 'Tous les statuts' },
                  ...statuts.map((statut) => ({
                    value: statut,
                    label: statut,
                  })),
                ]}
              />
            </div>

            <Link
              href="/admin/rh/employees/new"
              className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium text-xs sm:text-sm whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Nouvel</span>
              <span className="hidden sm:inline">employé</span>
            </Link>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0">
                <tr>
                  <th className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-3 text-left text-xs font-semibold text-[#374151] whitespace-nowrap">
                    Nom
                  </th>
                  <th className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-3 text-left text-xs font-semibold text-[#374151] whitespace-nowrap hidden lg:table-cell">
                    Type contrat
                  </th>
                  <th className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-3 text-left text-xs font-semibold text-[#374151] whitespace-nowrap hidden xl:table-cell">
                    Rôle
                  </th>
                  <th className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-3 text-left text-xs font-semibold text-[#374151] whitespace-nowrap">
                    Statut
                  </th>
                  <th className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-3 text-left text-xs font-semibold text-[#374151] whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-4 text-xs font-medium text-[#374151]">
                      <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 flex-wrap">
                        <span className="truncate text-xs sm:text-xs">{emp.prenom} {emp.nom}</span>
                        {emp.typeContrat === 'STAGIAIRE' && isEndingSoon(emp.dateFin) && (
                          <div className="relative group shrink-0">
                            <AlertTriangle
                              size={12}
                              className="text-orange-500 cursor-help"
                            />
                            <div className="absolute bottom-full left-0 mb-1 bg-gray-900 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              Fin stage
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-4 text-xs text-[#374151] hidden lg:table-cell whitespace-nowrap truncate max-w-xs">
                      {emp.typeContrat}
                    </td>
                    <td className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-4 text-xs text-[#374151] hidden xl:table-cell truncate max-w-xs">
                      {emp.role.libelle}
                    </td>
                    <td className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-4">
                      <span
                        className={`inline-block px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          emp.statut === 'ACTIF'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {emp.statut}
                      </span>
                    </td>
                    <td className="px-2 sm:px-2 md:px-3 lg:px-6 py-1.5 sm:py-2 lg:py-4 space-x-0.5 sm:space-x-1 lg:space-x-2 flex flex-wrap gap-0.5 sm:gap-1">
                      <Link
                        href={`/admin/rh/employees/${emp.id}`}
                        className="inline-flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1 px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
                      >
                        <Edit2 size={12} className="shrink-0" />
                        <span className="hidden sm:inline">M.</span>
                        <span className="hidden md:inline">odifier</span>
                      </Link>
                      {isAdmin() && (
                        <button className="inline-flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1 px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors whitespace-nowrap">
                          <Lock size={12} className="shrink-0" />
                          <span className="hidden md:inline">D.</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
