import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Composant affichant un état vide pour les tableaux sans données
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 p-4 bg-[#FEF3EA] rounded-full">
        <Icon size={48} className="text-[#E8690A]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">{title}</h3>
      <p className="text-[#6B7280] mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-[#E8690A] text-white rounded-lg hover:bg-[#d25d08] transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
