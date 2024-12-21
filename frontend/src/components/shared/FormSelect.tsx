import { SelectHTMLAttributes } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export function FormSelect({ label, options, error, className = '', ...props }: FormSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        {...props}
        className={`w-full bg-gray-700 rounded-lg px-3 py-2 focus:ring-2 ring-blue-500 focus:outline-none ${
          error ? 'border-red-500' : 'border-gray-600'
        } ${className}`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-red-400 text-sm mt-1">{error}</span>}
    </div>
  );
}
