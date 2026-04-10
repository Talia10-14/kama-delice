'use client';

import { lazy } from 'react';

// Composant placeholder pour les graphiques du dashboard
// En production, remplacer par des vrais graphiques Recharts

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64 bg-white rounded-lg shadow p-4">
        <div className="text-gray-500 text-sm font-medium mb-4">Commandes par statut</div>
        <div className="flex items-end gap-2 h-40">
          {[45, 60, 30, 20, 50].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-blue-500 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      <div className="h-64 bg-white rounded-lg shadow p-4">
        <div className="text-gray-500 text-sm font-medium mb-4">Revenus quotidiens</div>
        <div className="flex items-end gap-2 h-40">
          {[30, 50, 45, 65, 55].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-green-500 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
