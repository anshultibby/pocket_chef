import { useFormContext } from 'react-hook-form';

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
  className?: string;
  list?: string;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  min,
  step,
  className,
  list,
  rows,
  options,
}: FormFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string;

  const inputProps = {
    ...register(name),
    placeholder,
    min,
    step,
    list,
    className: `w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white 
      focus:ring-2 ring-blue-500 focus:outline-none ${className}
      ${error ? 'border border-red-500' : ''}`
  };

  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-400">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      {type === 'select' && options ? (
        <select {...inputProps}>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea 
          {...inputProps}
          rows={rows || 3}
        />
      ) : (
        <input {...inputProps} type={type} />
      )}
      
      {error && (
        <span className="text-red-400 text-sm">{error}</span>
      )}
    </div>
  );
}
