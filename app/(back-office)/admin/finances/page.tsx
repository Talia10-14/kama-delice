'use client';

import { Header } from '@/components/Header';
import { usePermission } from '@/hooks/usePermission';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CAStat {
  date: string;
  ca: number;
}

interface CommandeStat {
  jour: string;
  nombre: number;
}

interface StatutStat {
  name: string;
  value: number;
  fill: string;
}

interface PlatStat {
  nom: string;
  quantite: number;
  chiffreAffaires: number;
}

export default function FinancesPage() {
  const { isAdmin } = usePermission();
  const [caData, setCaData] = useState<CAStat[]>([]);
  const [commandesData, setCommandesData] = useState<CommandeStat[]>([]);
  const [statutData, setStatutData] = useState<StatutStat[]>([]);
  const [platsData, setPlatsData] = useState<PlatStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) return;

    const fetchStats = async () => {
      try {
        const [caRes, commandesRes, statutRes, platsRes] = await Promise.all([
          fetch('/api/stats/ca-journalier?periode=30'),
          fetch('/api/stats/commandes-par-jour'),
          fetch('/api/stats/repartition-statuts'),
          fetch('/api/stats/top-plats'),
        ]);

        if (caRes.ok) {
          const caDataRes = await caRes.json();
          setCaData(caDataRes.data || []);
        }

        if (commandesRes.ok) {
          const commandesDataRes = await commandesRes.json();
          setCommandesData(commandesDataRes.data || []);
        }

        if (statutRes.ok) {
          const statutDataRes = await statutRes.json();
          setStatutData(statutDataRes.data || []);
        }

        if (platsRes.ok) {
          const platsDataRes = await platsRes.json();
          setPlatsData(platsDataRes.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  if (!isAdmin()) {
    return (
      <div className="flex flex-col">
        <Header title="Finances" />
        <div className="p-8">
          <p className="text-red-600">
            Vous n'avez pas la permission d'accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Finances" />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-[#F9FAFB] rounded-lg" />
            <div className="h-96 bg-[#F9FAFB] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: any) => {
    if (typeof value === 'number') {
      return `${value.toLocaleString('fr-FR')} FCFA`;
    }
    return value;
  };

  return (
    <div className="flex flex-col">
      <Header title="Finances" />

      <div className="p-8 space-y-8">
        {/* Graphique CA sur 30 jours */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Évolution du Chiffre d'Affaires (30 jours)
          </h2>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={caData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ca"
                  stroke="#E8690A"
                  name="CA (FCFA)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique commandes par jour */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Commandes par Jour de Semaine
          </h2>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={commandesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="nombre" fill="#E8690A" name="Nombre de commandes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique répartition des statuts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Répartition des Statuts de Commandes
          </h2>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statutData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    if (typeof percent === 'number') {
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }
                    return name || '';
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value?.toString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 des plats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Top 5 des Plats les Plus Commandés
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-4 font-semibold text-[#1A1A2E]">
                    Plat
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-[#1A1A2E]">
                    Quantités commandées
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-[#1A1A2E]">
                    CA généré (FCFA)
                  </th>
                </tr>
              </thead>
              <tbody>
                {platsData.map((plat, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  >
                    <td className="py-3 px-4 text-[#374151]">{plat.nom}</td>
                    <td className="text-right py-3 px-4 text-[#374151]">
                      {plat.quantite}
                    </td>
                    <td className="text-right py-3 px-4 text-[#1A1A2E] font-semibold">
                      {plat.chiffreAffaires.toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
