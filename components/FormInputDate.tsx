import React, { InputHTMLAttributes } from 'react';
import { Calendar } from 'lucide-react';

interface FormInputDateProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function FormInputDate({
  label,
  error,
  helpText,
  required,
  className,
  id,
  ...props
}: FormInputDateProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onBlur) {
      props.onBlur(e as any);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-800 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        <input
          id={inputId}
          type="date"
          className={`w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 text-base text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-[#E8690A] focus:ring-[#E8690A]/20 transition-all duration-200 shadow-sm hover:shadow-md ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
          } ${className || ''}`}
          {...props}
          onBlur={handleBlur}
        />
      </div>

      {/* Help text with format info - only show if no error */}
      {!error && helpText ? (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      ) : !error ? (
        <p className="mt-1 text-xs text-gray-400">
          Format: <strong>JJ/MM/AAAA</strong>
        </p>
      ) : null}

      {/* Error message in red */}
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
