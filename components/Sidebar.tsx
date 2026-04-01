'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
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
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, isAdmin, user } = usePermission();

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
    <aside className="w-64 bg-[#1A1A2E] text-white h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/admin" className="text-2xl font-bold text-[#E8690A]">
          Kama-Délices
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {menuItems.map(
          ({ href, label, icon: Icon, show }) =>
            show && (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-[#E8690A] text-white'
                    : 'text-gray-300 hover:bg-[#FEF3EA] hover:text-[#1A1A2E]'
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
        )}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-700 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8690A] flex items-center justify-center font-bold text-white">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-medium"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
