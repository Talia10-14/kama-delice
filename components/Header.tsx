'use client';

import { Bell, User, X, Check, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/hooks/useNotifications';
import { useSidebar } from '@/context/SidebarContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  unreadMessages?: number;
}

export function Header({ title, unreadMessages = 0 }: HeaderProps) {
  const { data: session } = useSession();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { toggleSidebar } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const displayUnreadCount = unreadCount + (unreadMessages || 0);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
      setIsDropdownOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
      >
        <Menu size={24} className="text-[#374151]" />
      </button>

      <h1 className="text-xl sm:text-2xl font-semibold text-[#374151] flex-1 ml-2 md:ml-0">{title}</h1>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
          >
            <Bell size={22} className="text-[#374151]" />
            {displayUnreadCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de notifications */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-[#E5E7EB] z-50 max-h-96 overflow-y-auto">
              <div className="p-3 sm:p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="font-semibold text-[#1A1A2E] text-sm sm:text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#E8690A] hover:underline"
                  >
                    Tout marquer
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-[#6B7280] text-sm">
                  Aucune notification
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 border-b border-[#E5E7EB] transition-colors hover:bg-[#F9FAFB] ${
                        !notification.read ? 'bg-[#FEF3EA]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#1A1A2E] wrap-break-word">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-1">
                            {new Date(notification.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-[#E8690A] shrink-0 mt-1.5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsDropdownOpen(false)}
                className="w-full p-2 sm:p-3 text-center text-xs sm:text-sm text-[#6B7280] hover:bg-[#F9FAFB] border-t border-[#E5E7EB]"
              >
                Fermer
              </button>
            </div>
          )}
        </div>

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
