'use client';

export interface FormInputDateProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInputDate = ({ label, error, ...props }: FormInputDateProps) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm font-medium text-[#1A1A2E] mb-2">
          {label}
        </label>
      )}
      <input
        type="date"
        {...props}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8690A]"
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};
