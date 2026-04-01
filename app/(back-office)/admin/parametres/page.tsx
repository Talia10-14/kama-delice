'use client';

import { Header } from '@/components/Header';
import { usePermission } from '@/hooks/usePermission';

export default function ParametresPage() {
  const { isAdmin } = usePermission();

  if (!isAdmin()) {
    return (
      <div className="flex flex-col">
        <Header title="Paramètres" />
        <div className="p-8">
          <p className="text-red-600">
            Seuls les administrateurs peuvent accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Paramètres" />

      <div className="p-8">
        <div className="max-w-2xl space-y-8">
          {/* General Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-6">
              Paramètres généraux
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Nom du restaurant
                </label>
                <input
                  type="text"
                  defaultValue="Kama-Délices"
                  disabled
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg bg-gray-100 text-[#6B7280] cursor-not-allowed"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Contact le support pour modifier
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Email de contact
                </label>
                <input
                  type="email"
                  defaultValue="contact@kama-delices.com"
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  defaultValue=""
                  placeholder="+33 X XX XX XX XX"
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                />
              </div>
            </div>
          </div>

          {/* Users Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-6">
              Gestion des utilisateurs
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-[#6B7280]">
                Les utilisateurs sont créés via la section Ressources Humaines.
              </p>

              <button className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors font-medium text-sm">
                Voir tous les utilisateurs
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-6">
              Zone de danger
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded border border-red-200">
                <p className="text-sm font-medium text-[#374151] mb-2">
                  Réinitialiser la base de données
                </p>
                <p className="text-xs text-[#6B7280] mb-3">
                  Attention: cette action est irréversible. Toutes les données
                  seront perdues.
                </p>
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium text-sm">
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors font-medium">
              Annuler
            </button>
            <button className="flex-1 px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
