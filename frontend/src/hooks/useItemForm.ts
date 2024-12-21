import { useState } from 'react';
import { itemFormSchema, ItemFormValues } from '@/schemas/pantry';
import { z } from 'zod';

interface UseItemFormProps {
  initialValues?: Partial<ItemFormValues>;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
  onClose: () => void;
}

export function useItemForm({ 
  initialValues, 
  onSubmit, 
  onClose,
}: UseItemFormProps) {
  const [values, setValues] = useState<Partial<ItemFormValues>>({
    display_name: '',
    quantity: 1,
    unit: 'units',
    notes: '',
    expiry_date: null,
    ...initialValues,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ItemFormValues, value: string | number | null) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate the form values
      const validatedData = itemFormSchema.parse(values);
      
      setIsSubmitting(true);
      await onSubmit(validatedData);
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Convert Zod errors into a more friendly format
        const formattedErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path) {
            formattedErrors[error.path[0]] = error.message;
          }
        });
        setErrors(formattedErrors);
      } else {
        setErrors({ form: 'An unexpected error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    handleChange,
    handleSubmit,
    isSubmitting,
    errors,
  };
}
