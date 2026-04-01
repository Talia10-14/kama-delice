'use client';

import { Header } from '@/components/Header';
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

  if (!hasPermission('gerer_personnel')) {
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
    <div className="flex flex-col">
      <Header title="Ressources Humaines" />

      <div className="p-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E5E7EB]">
          <Link
            href="/admin/rh"
            className="px-4 py-2 font-medium text-[#E8690A] border-b-2 border-[#E8690A]"
          >
            Employés
          </Link>
          <Link
            href="/admin/rh/roles"
            className="px-4 py-2 font-medium text-[#6B7280] hover:text-[#374151]"
          >
            Rôles
          </Link>
          <Link
            href="/admin/rh/attendance"
            className="px-4 py-2 font-medium text-[#6B7280] hover:text-[#374151]"
          >
            Présences
          </Link>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <select
              value={selectedContrat}
              onChange={(e) => setSelectedContrat(e.target.value)}
              className="px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
            >
              <option value="">Tous les contrats</option>
              {typeContrats.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
            >
              <option value="">Tous les statuts</option>
              {statuts.map((statut) => (
                <option key={statut} value={statut}>
                  {statut}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/admin/rh/employees/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium"
          >
            <Plus size={20} />
            Nouvel employé
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Type contrat
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#374151]">
                    <div className="flex items-center gap-2">
                      {emp.prenom} {emp.nom}
                      {emp.typeContrat === 'STAGIAIRE' && isEndingSoon(emp.dateFin) && (
                        <div className="relative group">
                          <AlertTriangle
                            size={16}
                            className="text-orange-500 cursor-help"
                          />
                          <div className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Fin de stage proche
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {emp.typeContrat}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {emp.role.libelle}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        emp.statut === 'ACTIF'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {emp.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <Link
                      href={`/admin/rh/employees/${emp.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                    >
                      <Edit2 size={14} />
                      Modifier
                    </Link>
                    {isAdmin() && (
                      <button className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors">
                        <Lock size={14} />
                        Désactiver
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
  );
}
