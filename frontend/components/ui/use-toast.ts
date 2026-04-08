'use client';

import { useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastCount = 0;

export function useToast() {
  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = `toast-${toastCount++}`;
      
      // Afficher le toast en console en développement
      if (process.env.NODE_ENV === 'development') {
        const variant = props.variant === 'destructive' ? '❌' : '✅';
        console.log(`${variant} ${props.title || ''}: ${props.description || ''}`);
      }

      // Vous pouvez intégrer ici une bibliothèque toast réelle comme react-hot-toast ou sonner
      // Pour maintenant, c'est juste un stub
      
      return { id };
    },
    []
  );

  return { toast };
}
