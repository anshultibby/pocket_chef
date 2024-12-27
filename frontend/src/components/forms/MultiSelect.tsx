import { useState, useRef, useEffect } from 'react';
import { useController, Control } from 'react-hook-form';
import { FormField } from './FormField';

interface MultiSelectProps {
  name: string;
  control: Control<any>;
  options: readonly string[];
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function MultiSelect({ 
  name, 
  control, 
  options, 
  label, 
  required, 
  disabled 
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    field: { value = [], onChange },
    fieldState: { error }
  } = useController({
    name,
    control,
    rules: { required: required ? 'This field is required' : false },
    defaultValue: []
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const currentValue = Array.isArray(value) ? value : [];
    const newValue = currentValue.includes(option)
      ? currentValue.filter((v: string) => v !== option)
      : [...currentValue, option];
    onChange(newValue);
  };

  return (
    <FormField label={label} error={error?.message} required={required}>
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`bg-gray-800 rounded-lg px-4 py-2 cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${error ? 'ring-1 ring-red-500' : ''}`}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${name}-options`}
        >
          {Array.isArray(value) && value.length === 0 ? (
            <span className="text-gray-400">Select options...</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Array.isArray(value) && value.map((v: string) => (
                <span
                  key={v}
                  className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-sm"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>

        {isOpen && !disabled && (
          <div 
            id={`${name}-options`}
            role="listbox"
            className="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-lg"
          >
            <div className="max-h-60 overflow-auto py-2">
              {options.map(option => (
                <div
                  key={option}
                  role="option"
                  aria-selected={Array.isArray(value) && value.includes(option)}
                  onClick={() => toggleOption(option)}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-700 ${
                    Array.isArray(value) && value.includes(option) ? 'text-indigo-400' : 'text-gray-200'
                  }`}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}
