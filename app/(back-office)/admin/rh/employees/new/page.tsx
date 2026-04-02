'use client';

import { Header } from '@/components/Header';
import { FormInput } from '@/components/FormInput';
import { FormSelect } from '@/components/FormSelect';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const employeeSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional(),
  typeContrat: z.enum(['EMPLOYE', 'STAGIAIRE', 'PRESTATAIRE']),
  dateEntree: z.string().min(1, 'La date d\'entrée est requise'),
  dateFin: z.string().optional(),
  roleId: z.string().min(1, 'Le rôle est requis'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Role {
  id: number;
  libelle: string;
}

interface CredentialsModalData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialsModalData | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      typeContrat: 'EMPLOYE',
    },
  });

  const watchTypeContrat = watch('typeContrat');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          roleId: parseInt(data.roleId),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Si un email a été fourni et un mot de passe généré
        if (data.email && result.userPassword) {
          setCredentials({
            email: data.email,
            password: result.userPassword,
            nom: data.nom,
            prenom: data.prenom,
          });
        } else {
          // Sinon rediriger directement
          router.push('/admin/rh');
        }
      } else {
        alert('Erreur lors de la création de l\'employé');
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  return (
    <div className="flex flex-col">
      <Header title="Nouvel Employé" />

      <div className="p-8">
        <div className="max-w-2xl bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Identity Section */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">
                Informations personnelles
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Nom"
                  type="text"
                  error={errors.nom?.message}
                  required
                  {...register('nom')}
                />

                <FormInput
                  label="Prénom"
                  type="text"
                  error={errors.prenom?.message}
                  required
                  {...register('prenom')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormInput
                  label="Téléphone"
                  type="tel"
                  {...register('telephone')}
                />

                <FormInput
                  label="Email"
                  type="email"
                  {...register('email')}
                />
              </div>
            </div>

            {/* Contract Section */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">
                Contrat
              </h3>

<div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Type de contrat
                  <span className="text-red-600 ml-1">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register('typeContrat')}
                    className="w-full px-4 pr-10 py-2 sm:py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-[#E8690A] focus:ring-[#E8690A]/20 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                  >
                    <option value="EMPLOYE">Employé</option>
                    <option value="STAGIAIRE">Stagiaire</option>
                    <option value="PRESTATAIRE">Prestataire</option>
                  </select>
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                {errors.typeContrat && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.typeContrat.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormInput
                  label="Date d'entrée"
                  type="date"
                  error={errors.dateEntree?.message}
                  required
                  {...register('dateEntree')}
                />

                {watchTypeContrat === 'STAGIAIRE' && (
                  <FormInput
                    label="Date de fin de stage"
                    type="date"
                    error={errors.dateFin?.message}
                    required
                    {...register('dateFin')}
                  />
                )}
              </div>
            </div>

            {/* Role Section */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">
                Rôle
              </h3>

              <FormSelect
                label="Rôle"
                error={errors.roleId?.message}
                required
                {...register('roleId')}
              >
                <option value="">Sélectionner un rôle</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.libelle}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] disabled:bg-gray-400 transition-colors font-medium"
              >
                {isSubmitting ? 'Création...' : 'Créer l\'employé'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">
              ✅ Employé créé avec succès!
            </h2>
            <p className="text-[#6B7280] mb-6">
              Voici les identifiants de connexion pour{' '}
              <span className="font-semibold text-[#374151]">
                {credentials.prenom} {credentials.nom}
              </span>
            </p>

            <div className="space-y-4 bg-[#F9FAFB] p-4 rounded-lg mb-6">
              <div>
                <p className="text-xs font-semibold text-[#6B7280] mb-2">EMAIL</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-[#E5E7EB] font-mono text-sm text-[#374151]">
                    {credentials.email}
                  </code>
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="px-3 py-2 bg-[#E8690A] text-white rounded hover:bg-[#d25d08] transition-colors text-sm font-medium"
                  >
                    Copier
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#6B7280] mb-2">MOT DE PASSE</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-[#E5E7EB] font-mono text-sm text-[#374151]">
                    {credentials.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(credentials.password)}
                    className="px-3 py-2 bg-[#E8690A] text-white rounded hover:bg-[#d25d08] transition-colors text-sm font-medium"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>

            {showCopySuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm text-center">
                ✓ Copié dans le presse-papiers!
              </div>
            )}

            <p className="text-xs text-[#6B7280] mb-6 bg-yellow-50 border border-yellow-200 rounded p-3">
              ⚠️ <strong>Important:</strong> Partagez ces identifiants de manière sécurisée avec
              l'employé. Ils pourront se connecter sur la page de login.
            </p>

            <button
              onClick={() => {
                setCredentials(null);
                router.push('/admin/rh');
              }}
              className="w-full px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium"
            >
              Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
