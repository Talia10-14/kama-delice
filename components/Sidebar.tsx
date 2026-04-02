'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useSidebar } from '@/context/SidebarContext';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, isAdmin, user } = usePermission();
  const { isOpen, closeSidebar } = useSidebar();

  const menuItems = [
    {
      href: '/admin',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: '/admin/commandes',
      label: 'Commandes',
      icon: ShoppingCart,
      show: hasPermission('voir_commandes'),
    },
    {
      href: '/admin/menus',
      label: 'Menus',
      icon: UtensilsCrossed,
      show: hasPermission('gerer_menus'),
    },
    {
      href: '/admin/rh',
      label: 'Ressources Humaines',
      icon: Users,
      show: hasPermission('gerer_personnel'),
    },
    {
      href: '/admin/finances',
      label: 'Finances',
      icon: TrendingUp,
      show: hasPermission('voir_rapports'),
    },
    {
      href: '/admin/messages',
      label: 'Messages',
      icon: MessageSquare,
      show: hasPermission('gerer_messages'),
    },
    {
      href: '/admin/parametres',
      label: 'Paramètres',
      icon: Settings,
      show: isAdmin(),
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 bg-[#1A1A2E] text-white h-screen flex flex-col transition-all duration-300 z-50 md:z-0 ${
          isOpen ? 'left-0' : '-left-64 md:left-0'
        }`}
      >
        {/* Logo Section */}
        <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
          <Link href="/admin" className="text-xl sm:text-2xl font-bold text-[#E8690A]">
            Kama-Délices
          </Link>
          <button
            onClick={closeSidebar}
            className="md:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-2">
          {menuItems.map(
            ({ href, label, icon: Icon, show }) =>
              show && (
                <Link
                  key={href}
                  href={href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                    isActive(href)
                      ? 'bg-[#E8690A] text-white'
                      : 'text-gray-300 hover:bg-[#FEF3EA] hover:text-[#1A1A2E]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              )
          )}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-700 p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#E8690A] flex items-center justify-center font-bold text-white flex-shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-medium"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
