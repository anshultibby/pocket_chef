import { useController } from 'react-hook-form';

interface PreferenceButtonProps {
  name: string;
  value: string;
  control: any;
}

export function PreferenceButton({ name, value, control }: PreferenceButtonProps) {
  const { field } = useController({
    name,
    control,
    defaultValue: [],
  });

  const isSelected = field.value?.includes(value);

  const toggleSelection = () => {
    const newValue = isSelected
      ? field.value.filter((v: string) => v !== value)
      : [...(field.value || []), value];
    field.onChange(newValue);
  };

  return (
    <button
      type="button"
      onClick={toggleSelection}
      className={`px-4 py-2 rounded-lg text-sm transition-all ${
        isSelected
          ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {value}
    </button>
  );
}

interface ServingsButtonProps {
  name: string;
  value: number;
  control: any;
}

export function ServingsButton({ name, value, control }: ServingsButtonProps) {
  const { field } = useController({
    name,
    control,
    defaultValue: 2,
  });

  const isSelected = field.value === value;

  return (
    <button
      type="button"
      onClick={() => field.onChange(value)}
      className={`px-4 py-2 rounded-lg text-sm transition-all ${
        isSelected
          ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {value}
    </button>
  );
}

interface ExperienceButtonProps {
  name: string;
  value: string;
  label: string;
  control: any;
}

export function ExperienceButton({ name, value, label, control }: ExperienceButtonProps) {
  const { field } = useController({
    name,
    control,
    defaultValue: 'beginner',
  });

  const isSelected = field.value === value;

  return (
    <button
      type="button"
      onClick={() => field.onChange(value)}
      className={`px-4 py-2 rounded-lg text-sm transition-all ${
        isSelected
          ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}
