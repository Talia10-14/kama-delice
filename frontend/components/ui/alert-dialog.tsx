'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const AlertDialog = ({
  open: controlledOpen,
  onOpenChange,
  children,
}: AlertDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export const AlertDialogContent = ({ children }: { children: React.ReactNode }) => {
  const { open } = React.useContext(AlertDialogContext);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        {children}
      </div>
    </div>,
    document.body
  );
};

export const AlertDialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const AlertDialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-[#1A1A2E]">{children}</h2>
);

export const AlertDialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600 mt-2">{children}</p>
);

export const AlertDialogCancel = ({ ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { onOpenChange: setOpen } = React.useContext(AlertDialogContext);
  return (
    <button
      onClick={() => setOpen(false)}
      className="inline-flex items-center justify-center font-medium rounded-lg transition-colors px-4 py-2 text-base border border-gray-300 text-gray-700 hover:bg-gray-50 mr-3"
      {...props}
    />
  );
};

export const AlertDialogAction = ({ ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { onOpenChange } = React.useContext(AlertDialogContext);
  return (
    <button
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
        }
        onOpenChange(false);
      }}
      className="inline-flex items-center justify-center font-medium rounded-lg transition-colors px-4 py-2 text-base bg-[#E8690A] text-white hover:bg-[#d25d08]"
      {...props}
    />
  );
};
