'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/context/SidebarContext';

export default function BackOfficeLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <div className="flex h-screen gap-0">
          <Sidebar />
          <div className="flex-1 overflow-hidden flex flex-col">
            <main className="flex-1 overflow-auto bg-[#F9FAFB]">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SessionProvider>
  );
}
