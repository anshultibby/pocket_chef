import { useState, useEffect } from 'react';
import { PantryItemCreate } from '@/types';

const defaultValues: PantryItemCreate = {
  data: {
    name: '',
    original_name: '',
    quantity: 1,
    unit: '',
    category: '',
    notes: '',
    expiry_date: null,
    price: null
  },
  nutrition: {
    standard_unit: '100 grams'
  }
};

export function useItemForm({ 
  initialValues,
  onSubmit, 
  onClose 
}: {
  initialValues?: PantryItemCreate;
  onSubmit: (values: PantryItemCreate) => Promise<void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<PantryItemCreate>(initialValues || defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize values when initialValues changes
  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!values.data.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!values.data.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }
    if (values.data.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string | number | null, section: 'data' | 'nutrition' = 'data') => {
    setValues(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: field === 'expiry_date' && value 
          ? new Date(value).toISOString()  // Convert to ISO string for backend
          : (value === '' && field !== 'name' && field !== 'unit' && field !== 'notes' 
            ? null 
            : value)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Format the date before submitting
      const formattedValues = {
        ...values,
        data: {
          ...values.data,
          expiry_date: values.data.expiry_date 
            ? new Date(values.data.expiry_date).toISOString().split('T')[0]
            : null
        }
      };

      await onSubmit(formattedValues);
      onClose();
    } catch (err) {
      setErrors({ 
        form: err instanceof Error 
          ? err.message 
          : 'Failed to add item. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, handleChange, handleSubmit, isSubmitting, errors };
}
