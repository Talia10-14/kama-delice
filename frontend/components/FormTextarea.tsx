'use client';

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  charLimit?: number;
}

export const FormTextarea = ({ label, error, charLimit, ...props }: FormTextareaProps) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm font-medium text-[#1A1A2E] mb-2">
          {label}
        </label>
      )}
      <textarea
        {...props}
        maxLength={charLimit || props.maxLength}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8690A]"
      />
      {charLimit && (
        <p className="text-xs text-gray-500 mt-1">
          {props.value ? String(props.value).length : 0}/{charLimit}
        </p>
      )}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};
