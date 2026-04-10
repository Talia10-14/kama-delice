'use client';

import { Header } from '@/components/Header';
import { FormInput } from '@/components/FormInput';
import { usePermission } from '@/hooks/usePermission';
import { apiClient } from '@/lib/api-client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface Role {
  id: number;
  libelle: string;
  rolePermissions: Array<{ permission: { code: string } }>;
}

interface Permission {
  id: number;
  code: string;
}

export default function RolesPage() {
  const { isAdmin } = usePermission();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [roleName, setRoleName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await apiClient.get<Role[]>('/roles');
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await apiClient.get<Permission[]>('/permissions');
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleSaveRole = async () => {
    if (!roleName || selectedPermissions.length === 0) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      const newRole = await apiClient.post<Role>('/roles', {
        libelle: roleName,
        permissionIds: selectedPermissions,
      });
      setRoles([...roles, newRole]);
      setShowModal(false);
      setRoleName('');
      setSelectedPermissions([]);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      return;
    }

    try {
      await apiClient.delete(`/roles/${roleId}`);
      setRoles(roles.filter((r) => r.id !== roleId));
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="flex flex-col">
        <Header title="Gestion des Rôles" />
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
      <Header title="Gestion des Rôles" />

      <div className="p-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E5E7EB]">
          <Link href="/admin/rh" className="px-4 py-2 font-medium text-[#6B7280] hover:text-[#374151] transition-colors cursor-pointer">
            Employés
          </Link>
          <div className="px-4 py-2 font-medium text-[#E8690A] border-b-2 border-[#E8690A]">
            Rôles
          </div>
          <Link href="/admin/rh/attendance" className="px-4 py-2 font-medium text-[#6B7280] hover:text-[#374151] transition-colors cursor-pointer">
            Présences
          </Link>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium"
        >
          <Plus size={20} />
          Nouveau rôle
        </button>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-[#1A1A2E]">
                  {role.libelle}
                </h3>
                {isAdmin() && (
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[#374151] mb-3">
                  Permissions :
                </p>
                <div className="space-y-2">
                  {role.rolePermissions.length === 0 ? (
                    <p className="text-xs text-[#6B7280]">Aucune permission</p>
                  ) : (
                    role.rolePermissions.map((rp) => (
                      <div
                        key={rp.permission.code}
                        className="px-3 py-1 bg-[#FEF3EA] text-[#E8690A] text-xs rounded inline-block"
                      >
                        {rp.permission.code}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                Nouveau rôle
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <FormInput
                label="Nom du rôle"
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Permissions
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {permissions.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([
                              ...selectedPermissions,
                              perm.id,
                            ]);
                          } else {
                            setSelectedPermissions(
                              selectedPermissions.filter((p) => p !== perm.id)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded border-[#E5E7EB]"
                      />
                      <span className="text-sm text-[#374151]">{perm.code}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveRole}
                  className="flex-1 px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
