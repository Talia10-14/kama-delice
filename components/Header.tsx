'use client';

import { Bell, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface HeaderProps {
  title: string;
  unreadMessages?: number;
}

export function Header({ title, unreadMessages = 0 }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between ml-64">
      <h1 className="text-2xl font-semibold text-[#374151]">{title}</h1>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors">
          <Bell size={24} className="text-[#374151]" />
          {unreadMessages > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-6 border-l border-[#E5E7EB]">
          <div className="w-8 h-8 rounded-full bg-[#E8690A] flex items-center justify-center font-bold text-white">
            {session?.user?.name?.[0] || 'U'}
          </div>
          <span className="text-sm font-medium text-[#374151]">
            {session?.user?.name}
          </span>
        </div>
      </div>
    </header>
  );
}
