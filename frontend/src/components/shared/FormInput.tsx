import { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({ label, error, className = '', ...props }: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        {...props}
        className={`w-full bg-gray-700 rounded-lg px-3 py-2 focus:ring-2 ring-blue-500 focus:outline-none ${
          error ? 'border-red-500' : 'border-gray-600'
        } ${className}`}
      />
      {error && <span className="text-red-400 text-sm mt-1">{error}</span>}
    </div>
  );
}
