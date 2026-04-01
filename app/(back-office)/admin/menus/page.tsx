'use client';

import { Header } from '@/components/Header';
import { usePermission } from '@/hooks/usePermission';
import { useEffect, useState } from 'react';
import { Plus, ToggleLeft, X } from 'lucide-react';

interface Menu {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  photoUrl: string | null;
  active: boolean;
}

export default function MenusPage() {
  const { hasPermission } = usePermission();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Plat Principal',
    price: '',
  });

  const categories = [
    'Entrée',
    'Plat Principal',
    'Dessert',
    'Boisson',
    'Menu Complet',
  ];

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/menus');
      if (response.ok) {
        const data = await response.json();
        setMenus(data);
      }
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (menu: Menu) => {
    try {
      const response = await fetch(`/api/menus/${menu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !menu.active }),
      });

      if (response.ok) {
        setMenus(
          menus.map((m) =>
            m.id === menu.id ? { ...m, active: !m.active } : m
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle menu:', error);
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      if (response.ok) {
        const newMenu = await response.json();
        setMenus([...menus, newMenu]);
        setShowModal(false);
        setFormData({ name: '', description: '', category: 'Plat Principal', price: '' });
      }
    } catch (error) {
      console.error('Failed to add menu:', error);
    }
  };

  if (!hasPermission('gerer_menus')) {
    return (
      <div className="flex flex-col">
        <Header title="Menus" />
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
      <Header title="Menus" />

      <div className="p-8 space-y-6">
        {/* Add Button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium"
        >
          <Plus size={20} />
          Ajouter un plat
        </button>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              {/* Photo */}
              <div className="w-full h-32 bg-[#F9FAFB] flex items-center justify-center">
                {menu.photoUrl ? (
                  <img
                    src={menu.photoUrl}
                    alt={menu.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-[#9CA3AF]">Pas de photo</div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-1">{menu.name}</h3>
                  <p className="text-xs text-[#6B7280]">{menu.category}</p>
                </div>

                <p className="text-base font-bold text-[#E8690A]">
                  {menu.price.toFixed(2)}€
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(menu)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                      menu.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ToggleLeft size={16} />
                    {menu.active ? 'Actif' : 'Inactif'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                Ajouter un plat
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMenu} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A] resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">
                  Prix (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#E8690A]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
