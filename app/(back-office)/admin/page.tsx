'use client';

import { Header } from '@/components/Header';
import { usePermission } from '@/hooks/usePermission';
import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Users,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface DashboardMetrics {
  ordersCount: number;
  totalRevenue: number;
  presentEmployees: number;
}

export default function DashboardPage() {
  const { hasPermission } = usePermission();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    ordersCount: 0,
    totalRevenue: 0,
    presentEmployees: 0,
  });
  const [stagiaireAlerts, setStagiaireAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setStagiaireAlerts(data.alerts);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const Widget = ({
    title,
    value,
    icon: Icon,
    className,
  }: {
    title: string;
    value: string | number;
    icon: any;
    className?: string;
  }) => (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#6B7280] text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-[#1A1A2E]">{value}</p>
        </div>
        <Icon className="w-12 h-12 text-[#E8690A]" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      <Header title="Tableau de bord" />

      <div className="p-8 space-y-8">
        {/* Widgets Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Widget
            title="Commandes aujourd'hui"
            value={metrics.ordersCount}
            icon={ShoppingCart}
            className={!hasPermission('voir_commandes') ? 'hidden' : ''}
          />
          <Widget
            title="Chiffre d'affaires (J)"
            value={`${metrics.totalRevenue.toFixed(2)}€`}
            icon={DollarSign}
            className={!hasPermission('voir_rapports') ? 'hidden' : ''}
          />
          <Widget
            title="Employés présents"
            value={metrics.presentEmployees}
            icon={Users}
            className={!hasPermission('voir_presences') ? 'hidden' : ''}
          />
          <Widget
            title="Messages non lus"
            value={0}
            icon={TrendingUp}
            className={!hasPermission('gerer_messages') ? 'hidden' : ''}
          />
        </div>

        {/* Alerts Section */}
        {stagiaireAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                Alertes urgentes
              </h2>
            </div>
            <div className="space-y-3">
              {stagiaireAlerts.map((alert: any) => (
                <div key={alert.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-900">
                    <strong>{alert.prenom} {alert.nom}</strong> : Fin de stage le{' '}
                    {new Date(alert.dateFin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
            Plus d'informations
          </h2>
          <p className="text-[#6B7280]">
            Consultez les différentes sections pour plus de détails sur les commandes,
            les employés et les finances du restaurant.
          </p>
        </div>
      </div>
    </div>
  );
}
