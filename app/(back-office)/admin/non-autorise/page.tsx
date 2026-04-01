'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] flex items-center justify-center p-4">
      <div className="text-center">
        <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">
          Accès refusé
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Vous n'avez pas la permission d'accéder à cette page.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium"
        >
          Retour
        </button>
      </div>
    </div>
  );
}
