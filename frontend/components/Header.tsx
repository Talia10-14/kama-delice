'use client';

export interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
      <h1 className="text-2xl font-bold text-[#1A1A2E]">{title}</h1>
    </div>
  );
}
