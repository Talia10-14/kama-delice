'use client';

import { Header } from '@/components/Header';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeePermissions } from '@/hooks/useEmployeePermissions';

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  typeContrat: string;
  dateEntree: string;
  dateFin: string | null;
  statut: string;
  role: { libelle: string };
}

interface Attendance {
  id: string;
  datePointage: string;
  heureArrivee: string;
  heureDepart: string | null;
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const employeeId = params.id as string;
  const { data: permissionsData } = useEmployeePermissions(employeeId);
  const isAdmin = (session as any)?.user?.role === 'admin';

  useEffect(() => {
    if (params.id) {
      fetchEmployee();
    }
  }, [params.id]);

  const fetchEmployee = async () => {
    try {
      const data = await apiClient.get<Employee>(`/employees/${params.id}`);
      setEmployee(data);
      const attendanceData = await apiClient.get<Attendance[]>(`/attendance`, { params: { employeeId: params.id } });
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to fetch employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Employé" />
        <div className="p-8">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col">
        <Header title="Employé" />
        <div className="p-8">
          <p className="text-red-600">Employé non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title={`${employee.prenom} ${employee.nom}`} />

      <div className="p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#E8690A] hover:text-[#d25d08] mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Info */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-6">
              Informations personnelles
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#6B7280] mb-1">Nom</p>
                <p className="font-semibold text-[#1A1A2E]">{employee.nom}</p>
              </div>
              <div>
                <p className="text-sm text-[#6B7280] mb-1">Prénom</p>
                <p className="font-semibold text-[#1A1A2E]">{employee.prenom}</p>
              </div>

              <div>
                <p className="text-sm text-[#6B7280] mb-1">Téléphone</p>
                <p className="font-semibold text-[#1A1A2E]">
                  {employee.telephone || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6B7280] mb-1">Rôle</p>
                <p className="font-semibold text-[#1A1A2E]">{employee.role.libelle}</p>
              </div>

              <div>
                <p className="text-sm text-[#6B7280] mb-1">Type de contrat</p>
                <p className="font-semibold text-[#1A1A2E]">{employee.typeContrat}</p>
              </div>
              <div>
                <p className="text-sm text-[#6B7280] mb-1">Statut</p>
                <p className={`font-semibold ${
                  employee.statut === 'ACTIF'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {employee.statut}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#6B7280] mb-1">Date d'entrée</p>
                <p className="font-semibold text-[#1A1A2E]">
                  {new Date(employee.dateEntree).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {employee.dateFin && (
                <div>
                  <p className="text-sm text-[#6B7280] mb-1">Date de fin</p>
                  <p className="font-semibold text-[#1A1A2E]">
                    {new Date(employee.dateFin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Side Actions */}
          <div className="bg-white rounded-lg shadow p-6 h-fit space-y-3">
            {isAdmin && (
              <Button
                onClick={() =>
                  router.push(`/admin/rh/employees/${employeeId}/permissions`)
                }
                className="w-full bg-[#E8690A] hover:bg-[#d25d08] text-white"
              >
                <Settings size={16} className="mr-2" />
                Gérer les permissions
              </Button>
            )}
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Modifier
            </button>
            <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
              Désactiver
            </button>
          </div>
        </div>

        {/* Attendance History */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Historique de pointage
          </h2>

          {attendance.length === 0 ? (
            <p className="text-[#6B7280]">Aucun pointage enregistré</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#374151]">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#374151]">
                      Heure d'arrivée
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#374151]">
                      Heure de départ
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#374151]">
                      Durée
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {attendance.map((att) => {
                    const arrival = new Date(att.heureArrivee);
                    const departure = att.heureDepart
                      ? new Date(att.heureDepart)
                      : null;
                    const duration = departure
                      ? ((departure.getTime() - arrival.getTime()) / 3600000).toFixed(2)
                      : '';

                    return (
                      <tr key={att.id} className="hover:bg-[#F9FAFB]">
                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {new Date(att.datePointage).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {arrival.toLocaleTimeString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {departure
                            ? departure.toLocaleTimeString('fr-FR')
                            : 'En cours'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151]">
                          {duration ? `${duration}h` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Permissions Summary */}
        {isAdmin && permissionsData && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
              Résumé des permissions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">
                  Permissions actives
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {permissionsData.effective?.length || 0}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">
                  Permissions ajoutées individuellement
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {permissionsData.individualGrant?.length || 0}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 font-medium">
                  Permissions retirées individuellement
                </p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {permissionsData.individualRevoke?.length || 0}
                </p>
              </div>
            </div>

            <Button
              onClick={() =>
                router.push(`/admin/rh/employees/${employeeId}/permissions`)
              }
              variant="outline"
              className="text-[#E8690A] border-[#E8690A] hover:bg-orange-50"
            >
              Voir le détail
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
