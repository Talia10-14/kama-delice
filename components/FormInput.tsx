import React, { InputHTMLAttributes, ReactNode } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helpText?: string;
  required?: boolean;
}

export function FormInput({
  label,
  error,
  icon,
  helpText,
  required,
  className,
  id,
  type = 'text',
  placeholder,
  ...props
}: FormInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  // Set default placeholder based on type if not provided
  const defaultPlaceholders: Record<string, string> = {
    email: 'utilisateur@exemple.com',
    tel: '+229 XX XX XX XX',
    text: '',
    number: '',
    date: '',
    password: '••••••••',
    search: '',
    url: '',
    color: '',
    file: '',
    hidden: '',
    range: '',
    time: '',
    'datetime-local': '',
  };
  
  const defaultPlaceholder = defaultPlaceholders[type] || '';

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-gray-800 mb-2"
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder || defaultPlaceholder}
          className={`w-full ${icon ? 'pl-10 sm:pl-12' : 'px-4'} pr-4 py-2 sm:py-3 text-base text-gray-900 placeholder-gray-500 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-[#E8690A] focus:ring-[#E8690A]/20 transition-all duration-200 shadow-sm hover:shadow-md ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
          } ${className || ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
