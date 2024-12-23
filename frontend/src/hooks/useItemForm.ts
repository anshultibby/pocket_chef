import { useState } from 'react';
import { PantryItemCreate } from '@/types';

const defaultValues: PantryItemCreate = {
  data: {
    name: '',
    quantity: 1,
    unit: '',
    standard_name: '',
    category: '',
    notes: '',
    expiry_date: null,
    price: null
  },
  nutrition: {}
};

// Add validation function
const formatDateForBackend = (dateString: string | null): string | null => {
  if (!dateString) return null;
  // Format as ISO string and take just the date part
  return new Date(dateString).toISOString().split('T')[0];
};

export function useItemForm({ onSubmit, onClose }: {
  onSubmit: (values: PantryItemCreate) => Promise<void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<PantryItemCreate>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          : (value === '' && field !== 'name' && field !== 'unit' ? null : value)
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
    } catch (error) {
      setErrors({ form: 'Failed to add item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, handleChange, handleSubmit, isSubmitting, errors };
}
