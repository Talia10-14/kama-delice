'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { SidebarContext } from '@/context/SidebarContext';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  MessageCircle,
  Settings,
  LogOut,
  Bell,
  BarChart3,
  Lock,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
}

export const Sidebar = () => {
  const { data: session, status } = useSession();
  const sidebarContext = useContext(SidebarContext);

  const menuItems: MenuItem[] = [
    {
      label: 'Tableau de bord',
      href: '/admin',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Ressources Humaines',
      href: '/admin/rh',
      icon: <Users size={20} />,
      permission: 'view_employees',
    },
    {
      label: 'Commandes',
      href: '/admin/commandes',
      icon: <ShoppingCart size={20} />,
      permission: 'manage_commandes',
    },
    {
      label: 'Menus',
      href: '/admin/menus',
      icon: <Package size={20} />,
      permission: 'manage_menus',
    },
    {
      label: 'Finances',
      href: '/admin/finances',
      icon: <DollarSign size={20} />,
      permission: 'manage_finances',
    },
    {
      label: 'Messages',
      href: '/admin/messages',
      icon: <MessageCircle size={20} />,
      permission: 'manage_messages',
    },
    {
      label: 'Paramètres',
      href: '/admin/parametres',
      icon: <Settings size={20} />,
    },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const permissions = session?.user?.permissions || [];

  const visibleItems = menuItems.filter((item) => {
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  });

  return (
    <aside className="w-64 bg-[#1A1A2E] text-white p-6 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-[#E8690A]">Kama-Délices</h2>
        <p className="text-gray-400 text-sm mt-1">Gestion du restaurant</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2">
        {status === 'loading' ? (
          <div className="text-gray-400 text-sm p-4">Chargement...</div>
        ) : !session ? (
          <div className="text-gray-400 text-sm p-4">Non connecté</div>
        ) : (
          visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 group"
            >
              <span className="text-gray-400 group-hover:text-[#E8690A] transition-colors">
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))
        )}
      </nav>

      {/* User Info and Logout */}
      {session?.user && (
        <div className="border-t border-gray-700 pt-6 mt-6">
          <div className="mb-4 px-4">
            <p className="text-sm font-semibold text-white">
              {session.user.firstName} {session.user.lastName}
            </p>
            <p className="text-xs text-gray-400">{session.user.email}</p>
            {session.user.role && (
              <p className="text-xs text-[#E8690A] mt-1 font-medium">{session.user.role}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      )}
    </aside>
  );
};
