'use client';

import { Header } from '@/components/Header';
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

export default function NewEmployeePage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [typeContrat, setTypeContrat] = useState<string>('EMPLOYE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      typeContrat: 'EMPLOYE',
    },
  });

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
        router.push('/admin/rh');
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
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Nom *
                  </label>
                  <input
                    {...register('nom')}
                    type="text"
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                  />
                  {errors.nom && (
                    <p className="mt-1 text-xs text-red-600">{errors.nom.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Prénom *
                  </label>
                  <input
                    {...register('prenom')}
                    type="text"
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                  />
                  {errors.prenom && (
                    <p className="mt-1 text-xs text-red-600">{errors.prenom.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Téléphone
                  </label>
                  <input
                    {...register('telephone')}
                    type="tel"
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                  />
                </div>
              </div>
            </div>

            {/* Contract Section */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">
                Contrat
              </h3>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  Type de contrat *
                </label>
                <select
                  {...register('typeContrat')}
                  onChange={(e) => setTypeContrat(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                >
                  <option value="EMPLOYE">Employé</option>
                  <option value="STAGIAIRE">Stagiaire</option>
                  <option value="PRESTATAIRE">Prestataire</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Date d'entrée *
                  </label>
                  <input
                    {...register('dateEntree')}
                    type="date"
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                  />
                  {errors.dateEntree && (
                    <p className="mt-1 text-xs text-red-600">{errors.dateEntree.message}</p>
                  )}
                </div>

                {typeContrat === 'STAGIAIRE' && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">
                      Date de fin de stage *
                    </label>
                    <input
                      {...register('dateFin')}
                      type="date"
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                    />
                    {errors.dateFin && (
                      <p className="mt-1 text-xs text-red-600">{errors.dateFin.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Role Section */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">
                Rôle
              </h3>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  Rôle *
                </label>
                <select
                  {...register('roleId')}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.libelle}
                    </option>
                  ))}
                </select>
                {errors.roleId && (
                  <p className="mt-1 text-xs text-red-600">{errors.roleId.message}</p>
                )}
              </div>
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
    </div>
  );
}
