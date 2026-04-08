'use client';

import { Header } from '@/components/Header';
import { FormInput } from '@/components/FormInput';
import { FormInputPhone } from '@/components/FormInputPhone';
import { FormTextarea } from '@/components/FormTextarea';
import { usePermission } from '@/hooks/usePermission';
import { useState, useEffect } from 'react';
import { Save, Lock, Mail, Bell } from 'lucide-react';
import Link from 'next/link';

export default function ParametresPage() {
  const { isAdmin } = usePermission();
  const [activeTab, setActiveTab] = useState<'restaurant' | 'roles' | 'compte' | 'notifications'>('restaurant');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // État pour Restaurant
  const [restaurantData, setRestaurantData] = useState({
    nom: 'Kama-Délices',
    adresse: '',
    telephone: '',
    heureOuverture: '06:00',
    heureFermeture: '22:00',
  });

  // État pour Compte Admin
  const [accountData, setAccountData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
    currentPassword: '',
  });

  // État pour Notifications
  const [notificationsSettings, setNotificationsSettings] = useState({
    emailNovelleCommande: true,
    emailCommandeAcceptee: true,
    emailAnnulation: true,
    emailNouveauMessage: true,
    emailRapportJournalier: true,
    emailRapportHebdomadaire: true,
    emailRapportMensuel: true,
    delaiAlerteStagiaire: 7,
  });

  useEffect(() => {
    // Charger les paramètres existants
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.restaurant) setRestaurantData(data.restaurant);
          if (data.notifications) setNotificationsSettings(data.notifications);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSaveRestaurant = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantData),
      });

      if (res.ok) {
        setMessage('✅ Paramètres du restaurant sauvegardés');
      } else {
        setMessage('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSaveAccount = async () => {
    if (accountData.newPassword !== accountData.confirmPassword) {
      setMessage('❌ Les mots de passe ne correspondent pas');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountData.email,
          password: accountData.newPassword,
          currentPassword: accountData.currentPassword,
        }),
      });

      if (res.ok) {
        setMessage('✅ Compte administrateur mis à jour');
        setAccountData({
          email: '',
          newPassword: '',
          confirmPassword: '',
          currentPassword: '',
        });
      } else {
        setMessage('❌ Erreur lors de la mise à jour');
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationsSettings),
      });

      if (res.ok) {
        setMessage('✅ Paramètres de notifications sauvegardés');
      } else {
        setMessage('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="flex flex-col">
        <Header title="Paramètres" />
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
      <Header title="Paramètres" />

      <div className="p-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-4 border-b border-[#E5E7EB] mb-6">
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'restaurant'
                ? 'text-[#E8690A] border-b-2 border-[#E8690A]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            Restaurant
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'roles'
                ? 'text-[#E8690A] border-b-2 border-[#E8690A]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            Rôles et permissions
          </button>
          <button
            onClick={() => setActiveTab('compte')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'compte'
                ? 'text-[#E8690A] border-b-2 border-[#E8690A]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            Compte admin
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-[#E8690A] border-b-2 border-[#E8690A]'
                : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            Notifications
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Onglet Restaurant */}
          {activeTab === 'restaurant' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1A1A2E]">
                Paramètres du Restaurant
              </h2>

              <FormInput
                label="Nom du restaurant"
                type="text"
                value={restaurantData.nom}
                onChange={(e) =>
                  setRestaurantData({ ...restaurantData, nom: e.target.value })
                }
              />

              <FormTextarea
                label="Adresse"
                value={restaurantData.adresse}
                onChange={(e) =>
                  setRestaurantData({ ...restaurantData, adresse: e.target.value })
                }
                rows={3}
              />

              <FormInputPhone
                label="Téléphone du restaurant"
                value={restaurantData.telephone}
                onChange={(e) =>
                  setRestaurantData({ ...restaurantData, telephone: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Heure d'ouverture"
                  type="time"
                  value={restaurantData.heureOuverture}
                  onChange={(e) =>
                    setRestaurantData({
                      ...restaurantData,
                      heureOuverture: e.target.value,
                    })
                  }
                />
                <FormInput
                  label="Heure de fermeture"
                  type="time"
                  value={restaurantData.heureFermeture}
                  onChange={(e) =>
                    setRestaurantData({
                      ...restaurantData,
                      heureFermeture: e.target.value,
                    })
                  }
                />
              </div>

              <button
                onClick={handleSaveRestaurant}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          )}

          {/* Onglet Rôles et permissions */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1A1A2E]">
                Gestion des Rôles et Permissions
              </h2>
              <p className="text-[#6B7280]">
                Pour gérer les rôles et les permissions, veuillez accéder à la page dédiée.
              </p>
              <Link
                href="/admin/rh/roles"
                className="inline-flex items-center px-6 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors"
              >
                Aller à la gestion des rôles
              </Link>
            </div>
          )}

          {/* Onglet Compte Admin */}
          {activeTab === 'compte' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Lock size={20} />
                Compte Administrateur
              </h2>

              <FormInput
                label="Email"
                type="email"
                value={accountData.email}
                onChange={(e) =>
                  setAccountData({ ...accountData, email: e.target.value })
                }
              />

              <div className="border-t border-[#E5E7EB] pt-6">
                <h3 className="font-medium text-[#1A1A2E] mb-4">
                  Modifier le mot de passe
                </h3>

                <div className="space-y-4">
                  <FormInput
                    label="Mot de passe actuel"
                    type="password"
                    value={accountData.currentPassword}
                    onChange={(e) =>
                      setAccountData({
                        ...accountData,
                        currentPassword: e.target.value,
                      })
                    }
                  />

                  <FormInput
                    label="Nouveau mot de passe"
                    type="password"
                    value={accountData.newPassword}
                    onChange={(e) =>
                      setAccountData({
                        ...accountData,
                        newPassword: e.target.value,
                      })
                    }
                  />

                  <FormInput
                    label="Confirmer le mot de passe"
                    type="password"
                    value={accountData.confirmPassword}
                    onChange={(e) =>
                      setAccountData({
                        ...accountData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <button
                onClick={handleSaveAccount}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          )}

          {/* Onglet Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Bell size={20} />
                Paramètres des Notifications
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.emailNovelleCommande}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        emailNovelleCommande: e.target.checked,
                      })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label className="text-[#374151] cursor-pointer">
                    Recevoir un email pour chaque nouvelle commande
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.emailCommandeAcceptee}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        emailCommandeAcceptee: e.target.checked,
                      })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label className="text-[#374151] cursor-pointer">
                    Recevoir un email quand une commande est acceptée
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.emailAnnulation}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        emailAnnulation: e.target.checked,
                      })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label className="text-[#374151] cursor-pointer">
                    Recevoir un email quand une commande est annulée
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notificationsSettings.emailNouveauMessage}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        emailNouveauMessage: e.target.checked,
                      })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label className="text-[#374151] cursor-pointer">
                    Recevoir un email pour chaque nouveau message de contact
                  </label>
                </div>

                <div className="border-t border-[#E5E7EB] pt-4 mt-4">
                  <h3 className="font-medium text-[#1A1A2E] mb-3">Rapports automatiques</h3>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationsSettings.emailRapportJournalier}
                      onChange={(e) =>
                        setNotificationsSettings({
                          ...notificationsSettings,
                          emailRapportJournalier: e.target.checked,
                        })
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label className="text-[#374151] cursor-pointer">
                      Rapport journalier (chaque jour à 23h)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationsSettings.emailRapportHebdomadaire}
                      onChange={(e) =>
                        setNotificationsSettings({
                          ...notificationsSettings,
                          emailRapportHebdomadaire: e.target.checked,
                        })
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label className="text-[#374151] cursor-pointer">
                      Rapport hebdomadaire (chaque lundi à 8h)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationsSettings.emailRapportMensuel}
                      onChange={(e) =>
                        setNotificationsSettings({
                          ...notificationsSettings,
                          emailRapportMensuel: e.target.checked,
                        })
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label className="text-[#374151] cursor-pointer">
                      Rapport mensuel (le 1er de chaque mois à 8h)
                    </label>
                  </div>
                </div>

                <div className="border-t border-[#E5E7EB] pt-4 mt-4">
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Délai d'alerte pour fin de stage (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={notificationsSettings.delaiAlerteStagiaire}
                    onChange={(e) =>
                      setNotificationsSettings({
                        ...notificationsSettings,
                        delaiAlerteStagiaire: parseInt(e.target.value),
                      })
                    }
                    className="w-24 px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                  />
                  <p className="text-xs text-[#6B7280] mt-2">
                    Vous recevrez une alerte quand un stage se termine dans ce nombre de jours
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveNotifications}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
