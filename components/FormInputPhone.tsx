import React, { InputHTMLAttributes, useState } from 'react';
import { Phone } from 'lucide-react';

interface FormInputPhoneProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function FormInputPhone({
  label,
  error,
  helpText,
  required,
  className,
  id,
  ...props
}: FormInputPhoneProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [touched, setTouched] = useState(false);

  const formatPhoneForDisplay = (input: string): string => {
    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // If it starts with +, keep it; if it starts with 22, prefix with +
    if (!cleaned.startsWith('+') && cleaned.startsWith('229')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Format while the user is typing
    newValue = formatPhoneForDisplay(newValue);
    
    // Update the input
    e.target.value = newValue;
    
    // Call the original onChange from props (react-hook-form's)
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
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
        <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          id={inputId}
          type="tel"
          placeholder="+229 65 43 21 09"
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 text-base text-gray-900 placeholder-gray-500 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-[#E8690A] focus:ring-[#E8690A]/20 transition-all duration-200 shadow-sm hover:shadow-md ${
            error && touched ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
          } ${className || ''}`}
          {...props}
        />
      </div>
      
      {/* Help text with format info */}
      {!error && helpText ? (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      ) : !error && !touched ? (
        <p className="mt-1 text-xs text-gray-400">
          Format requis: <strong>+229XXXXXXXX</strong> (ex: +22965432109)
        </p>
      ) : null}
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
