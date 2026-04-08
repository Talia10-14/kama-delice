'use client';

import { Header } from '@/components/Header';
import { FormSelect } from '@/components/FormSelect';
import { usePermission } from '@/hooks/usePermission';
import { useEffect, useState } from 'react';
import { ChevronDown, Eye, X } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  content: string;
  amount: number | null;
  status: string;
  customOrder: boolean;
  createdAt: string;
}

export default function CommandesPage() {
  const { hasPermission } = usePermission();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amount, setAmount] = useState<string>('');

  const statuses = [
    'PENDING',
    'PREPARATION',
    'DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];
  const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    PREPARATION: 'En préparation',
    DELIVERY: 'En livraison',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-blue-100 text-blue-800',
    PREPARATION: 'bg-yellow-100 text-yellow-800',
    DELIVERY: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedStatus) {
      setFilteredOrders(orders.filter((o) => o.status === selectedStatus));
    } else {
      setFilteredOrders(orders);
    }
  }, [selectedStatus, orders]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/commandes');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCustom = (order: Order) => {
    setSelectedOrder(order);
    setShowAmountModal(true);
  };

  const handleSaveAmount = async () => {
    if (!selectedOrder || !amount) return;

    try {
      const response = await fetch(`/api/commandes/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), status: 'DELIVERED' }),
      });

      if (response.ok) {
        setShowAmountModal(false);
        setAmount('');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to validate order:', error);
    }
  };

  if (!hasPermission('manage_commandes')) {
    return (
      <div className="flex flex-col">
        <Header title="Commandes" />
        <div className="p-8">
          <p className="text-red-600">
            Vous n'avez pas la permission d'accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Commandes" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label className="text-sm font-medium text-[#374151]">Filtrer :</label>
          <FormSelect
            label="Statut"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: '', label: 'Tous les statuts' },
              ...statuses.map((status) => ({
                value: status,
                label: statusLabels[status],
              })),
            ]}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-[#374151] whitespace-nowrap">
                  Numéro
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-[#374151] whitespace-nowrap">
                  Client
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-[#374151] whitespace-nowrap hidden sm:table-cell">
                  Contenu
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-[#374151] whitespace-nowrap">
                  Montant
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-[#374151] whitespace-nowrap">
                  Statut
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-[#374151] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm text-[#374151] whitespace-nowrap">
                    {order.orderNumber}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm text-[#374151] truncate">
                    {order.clientName}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm text-[#374151] hidden sm:table-cell truncate max-w-xs">
                    {order.content}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium text-[#374151] whitespace-nowrap">
                    {order.amount ? `${order.amount.toFixed(2)}€` : '-'}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-4">
                    <span
                      className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        statusColors[order.status]
                      }`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-4 space-x-1 sm:space-x-2 flex flex-wrap gap-1">
                    {order.customOrder && order.status === 'PENDING' && (
                      <button
                        onClick={() => handleValidateCustom(order)}
                        className="px-2 sm:px-3 py-1 bg-[#E8690A] text-white text-xs rounded hover:bg-[#d25d08] transition-colors whitespace-nowrap"
                      >
                        Valider
                      </button>
                    )}
                    {order.status === 'PENDING' && (
                      <button className="px-2 sm:px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors whitespace-nowrap">
                        Refuser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Amount Modal */}
      {showAmountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-[#1A1A2E]">
                Saisir le montant
              </h2>
              <button
                onClick={() => setShowAmountModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A] mb-4 text-base"
            />
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowAmountModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 text-sm border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAmount}
                className="flex-1 px-3 sm:px-4 py-2 text-sm bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
