'use client';

import { Header } from '@/components/Header';
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

  if (!hasPermission('voir_commandes')) {
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
    <div className="flex flex-col">
      <Header title="Commandes" />

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-[#374151]">Filtrer :</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
          >
            <option value="">Tous les statuts</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Contenu
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#374151]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {order.clientName}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#374151]">
                    {order.content}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#374151]">
                    {order.amount ? `${order.amount.toFixed(2)}€` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status]
                      }`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {order.customOrder && order.status === 'PENDING' && (
                      <button
                        onClick={() => handleValidateCustom(order)}
                        className="px-3 py-1 bg-[#E8690A] text-white text-xs rounded hover:bg-[#d25d08] transition-colors"
                      >
                        Valider
                      </button>
                    )}
                    {order.status === 'PENDING' && (
                      <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">
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

      {/* Amount Modal */}
      {showAmountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                Saisir le montant
              </h2>
              <button
                onClick={() => setShowAmountModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAmountModal(false)}
                className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAmount}
                className="flex-1 px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors"
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
