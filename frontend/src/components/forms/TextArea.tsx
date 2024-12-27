import { useController, Control } from 'react-hook-form';
import { FormField } from './FormField';

interface TextAreaProps {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export function TextArea({
  name,
  control,
  label,
  placeholder,
  required,
  disabled,
  rows = 4,
  className = ''
}: TextAreaProps) {
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
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full bg-gray-800 rounded-lg px-4 py-2 text-white 
                   placeholder:text-gray-500 resize-vertical min-h-[100px]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   ${error ? 'ring-1 ring-red-500' : ''}
                   ${className}`}
      />
    </FormField>
  );
}
