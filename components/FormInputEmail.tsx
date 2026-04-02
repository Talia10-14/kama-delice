import React, { InputHTMLAttributes, useState } from 'react';
import { Mail } from 'lucide-react';

interface FormInputEmailProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormInputEmail({
  label,
  error,
  helpText,
  required,
  className,
  id,
  value,
  onChange,
  ...props
}: FormInputEmailProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [touched, setTouched] = useState(false);

  // Simple email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const displayValue = typeof value === 'string' ? value : '';
  const isInvalid = displayValue && !validateEmail(displayValue);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-800 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          id={inputId}
          type="email"
          placeholder="utilisateur@exemple.com"
          value={displayValue}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          className={`w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 text-base text-gray-900 placeholder-gray-500 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-[#E8690A] focus:ring-[#E8690A]/20 transition-all duration-200 shadow-sm hover:shadow-md ${
            error && touched ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
          } ${isInvalid && touched ? 'border-yellow-500' : ''} ${className || ''}`}
          {...props}
        />
      </div>

      {/* Help text with format info */}
      {!error && helpText ? (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      ) : !error && !touched ? (
        <p className="mt-1 text-xs text-gray-400">
          Format: <strong>utilisateur@exemple.com</strong>
        </p>
      ) : null}

      {/* Warning for invalid format (but not quite error) */}
      {isInvalid && touched && !error && (
        <p className="mt-2 text-sm text-yellow-600 font-medium">
          ⚠️ Format d'email invalide (ex: contact@kama-delices.com)
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
