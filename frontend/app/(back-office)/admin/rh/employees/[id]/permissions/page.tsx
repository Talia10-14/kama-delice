'use client';

import { Header } from '@/components/Header';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Plus, Trash2, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useEmployeePermissions } from '@/hooks/useEmployeePermissions';
import { formatDate } from '@/lib/utils';

interface Permission {
  id: string;
  name: string;
  codeName: string;
  description?: string;
}

interface EmployeePermissionDetail {
  id: string;
  permission: Permission;
  addedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  reason?: string;
  createdAt: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: {
    id: string;
    name: string;
  };
}

export default function EmployeePermissionsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showGrantConfirm, setShowGrantConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'grant' | 'revoke';
    permissionId: string;
  } | null>(null);

  const employeeId = params.id as string;
  const {
    data: permissionsData,
    loading: permLoading,
    allPermissions,
    grant,
    revoke,
    reset,
    refresh,
  } = useEmployeePermissions(employeeId);

  // Vérifier si l'utilisateur est admin
  const isAdmin = (session as any)?.user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col">
        <Header title="Gestion des permissions" />
        <div className="p-8">
          <p className="text-red-600">Vous n'avez pas accès à cette page</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
      refresh();
    }
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployee(data.data || data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'employé',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les permissions disponibles à ajouter (celles que l'employé n'a pas)
  const availablePermissions = allPermissions.filter(
    (p: Permission) =>
      !permissionsData?.individualGrant.some(
        (pg: EmployeePermissionDetail) => pg.permission.id === p.id
      ) && !permissionsData?.fromRole.some((pr: Permission) => pr.id === p.id)
  );

  const handleAddPermission = async () => {
    if (!selectedPermissionId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une permission',
        variant: 'destructive',
      });
      return;
    }

    try {
      await grant(selectedPermissionId, reason);
      setSelectedPermissionId('');
      setReason('');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleGrantPermission = async (permissionId: string) => {
    setConfirmAction({ type: 'grant', permissionId });
    setShowGrantConfirm(true);
  };

  const handleRevokePermission = async (permissionId: string) => {
    setConfirmAction({ type: 'revoke', permissionId });
    setShowRevokeConfirm(true);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'grant') {
        await grant(confirmAction.permissionId);
      } else {
        await revoke(confirmAction.permissionId);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setConfirmAction(null);
    }
  };

  const handleReset = async () => {
    try {
      await reset();
      setShowResetDialog(false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Gestion des permissions" />
        <div className="p-8">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col">
        <Header title="Gestion des permissions" />
        <div className="p-8">
          <p className="text-red-600">Employé non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title={`Permissions - ${employee.firstName} ${employee.lastName}`} />

      <div className="p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#E8690A] hover:text-[#d25d08] mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        {permLoading ? (
          <div className="text-center py-12">
            <p>Chargement des permissions...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: Permissions du rôle */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-6">
                Permissions héritées du rôle{' '}
                {employee.role ? `"${employee.role.name}"` : ''}
              </h2>

              {permissionsData?.fromRole && permissionsData.fromRole.length > 0 ? (
                <div className="space-y-3">
                  {permissionsData.fromRole.map((perm: Permission) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-[#1A1A2E]">{perm.name}</p>
                        {perm.description && (
                          <p className="text-sm text-gray-600">{perm.description}</p>
                        )}
                      </div>
                      <Lock size={20} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Aucune permission héritée du rôle</p>
              )}

              <p className="text-sm text-gray-600 mt-4 italic">
                Pour modifier ces permissions, changez la configuration du rôle.
              </p>
            </div>

            {/* SECTION 2: Permissions ajoutées individuellement */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-6">
                Permissions ajoutées à cet employé
              </h2>

              {permissionsData?.individualGrant &&
              permissionsData.individualGrant.length > 0 ? (
                <div className="space-y-3">
                  {permissionsData.individualGrant.map((perm: EmployeePermissionDetail) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-[#1A1A2E]">
                            {perm.permission.name}
                          </p>
                          <span className="inline-block px-2 py-1 bg-green-200 text-green-800 text-xs rounded font-medium">
                            Ajouté individuellement
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Ajouté par {perm.addedBy.firstName}{' '}
                          {perm.addedBy.lastName} le{' '}
                          {formatDate(new Date(perm.createdAt))}
                        </p>
                        {perm.reason && (
                          <p className="text-sm text-gray-700 italic mt-1">
                            Motif: {perm.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokePermission(perm.permission.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">
                  Aucune permission ajoutée individuellement
                </p>
              )}
            </div>

            {/* SECTION 3: Permissions retirées individuellement */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-6">
                Permissions retirées à cet employé
              </h2>

              {permissionsData?.individualRevoke &&
              permissionsData.individualRevoke.length > 0 ? (
                <div className="space-y-3">
                  {permissionsData.individualRevoke.map((perm: EmployeePermissionDetail) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 line-through"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-[#1A1A2E]">
                            {perm.permission.name}
                          </p>
                          <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs rounded font-medium">
                            Retirée individuellement
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Retirée par {perm.addedBy.firstName}{' '}
                          {perm.addedBy.lastName} le{' '}
                          {formatDate(new Date(perm.createdAt))}
                        </p>
                        {perm.reason && (
                          <p className="text-sm text-gray-700 italic mt-1">
                            Motif: {perm.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleGrantPermission(perm.permission.id)
                        }
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <RotateCcw size={16} />
                        Restaurer
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">
                  Aucune permission retirée individuellement
                </p>
              )}
            </div>

            {/* SECTION 4: Ajouter une permission */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-6">
                Ajouter une permission à cet employé
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Choisir une permission
                  </label>
                  <select
                    value={selectedPermissionId}
                    onChange={(e) => setSelectedPermissionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8690A]"
                  >
                    <option value="">-- Sélectionner une permission --</option>
                    {availablePermissions.map((perm: Permission) => (
                      <option key={perm.id} value={perm.id}>
                        {perm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Motif (optionnel)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value.slice(0, 300))
                    }
                    placeholder="Ex: Remplacement temporaire du responsable"
                    maxLength={300}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8690A]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.length}/300 caractères
                  </p>
                </div>

                <Button
                  onClick={handleAddPermission}
                  disabled={!selectedPermissionId || permLoading}
                  className="w-full bg-[#E8690A] hover:bg-[#d25d08] text-white"
                >
                  <Plus size={16} className="mr-2" />
                  Ajouter cette permission
                </Button>
              </div>
            </div>

            {/* SECTION 5: Résumé des permissions effectives */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">
                Récapitulatif des permissions actives
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Ce que cet employé peut réellement faire
              </p>

              {permissionsData?.effective && permissionsData.effective.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissionsData.effective.map((permCode: string) => {
                    const permission = allPermissions.find(
                      (p: Permission) => p.codeName === permCode
                    );
                    const isRevoked = permissionsData.individualRevoke.some(
                      (pr: EmployeePermissionDetail) => pr.permission.codeName === permCode
                    );

                    return (
                      <div
                        key={permCode}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
                          isRevoked
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        {isRevoked ? (
                          <>
                            <span className="text-red-600 line-through">
                              {permission?.name || permCode}
                            </span>
                            <span className="text-red-600">✕</span>
                          </>
                        ) : (
                          <>
                            <span className="text-green-600 font-medium">
                              {permission?.name || permCode}
                            </span>
                            <span className="text-green-600">✓</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">
                  Aucune permission effective pour cet employé
                </p>
              )}
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowResetDialog(true)}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Réinitialiser toutes les permissions individuelles
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Revoke Confirmation */}
      <AlertDialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le retrait</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous retirer cette permission ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={executeAction}
            className="bg-red-600 hover:bg-red-700"
          >
            Retirer
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Grant Confirmation */}
      <AlertDialog open={showGrantConfirm} onOpenChange={setShowGrantConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la restauration</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous restaurer cette permission ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={executeAction}>
            Restaurer
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Reset All Permissions */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les permissions</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera toutes les permissions individuelles de
              cet employé. Il reviendra aux permissions de son rôle uniquement.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700"
          >
            Confirmer la réinitialisation
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
