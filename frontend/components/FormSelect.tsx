'use client';

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
}

export const FormSelect = ({
  label,
  error,
  options = [],
  ...props
}: FormSelectProps) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm font-medium text-[#1A1A2E] mb-2">
          {label}
        </label>
      )}
      <select
        {...props}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8690A]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};
