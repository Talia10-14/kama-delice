import React, { TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  charLimit?: number;
}

export function FormTextarea({
  label,
  error,
  helpText,
  required,
  className,
  id,
  value,
  charLimit,
  ...props
}: FormTextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const charCount = typeof value === 'string' ? value.length : 0;

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
      <textarea
        id={inputId}
        value={value}
        className={`w-full px-4 py-2 sm:py-3 text-base text-gray-900 placeholder-gray-500 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-[#E8690A] focus:ring-[#E8690A]/20 transition-all duration-200 shadow-sm hover:shadow-md resize-none ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
        } ${className || ''}`}
        {...props}
      />
      <div className="flex items-center justify-between mt-2">
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {!error && helpText && <p className="text-sm text-gray-500">{helpText}</p>}
        {charLimit && (
          <p className={`text-xs ${charCount > charLimit * 0.9 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
            {charCount}/{charLimit}
          </p>
        )}
      </div>
    </div>
  );
}
