import { useController, Control } from 'react-hook-form';
import { FormField } from './FormField';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name: string;
  control: Control<any>;
  options: SelectOption[];
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Select({ name, control, options, label, required, disabled }: SelectProps) {
  const {
    field: { value, onChange },
    fieldState: { error }
  } = useController({
    name,
    control,
    rules: { required: required ? 'This field is required' : false }
  });

  return (
    <FormField label={label} error={error?.message} required={required}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-gray-800 rounded-lg px-4 py-2 text-white 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   ${error ? 'ring-1 ring-red-500' : ''}`}
      >
        <option value="">Select an option...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
