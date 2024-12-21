import { MeasurementUnit, MEASUREMENT_UNITS } from '@/types';

// Define the shape of the form values
export interface ItemFormValues {
  displayName: string;
  quantity: number;
  unit: MeasurementUnit;
  category?: string;
  expiryDate?: string;
}

// Create a type for the validation rules that matches the form values
export type ValidationRules = {
  [K in keyof ItemFormValues]: (value: ItemFormValues[K]) => string | undefined;
};

export const useValidationRules = (): Partial<ValidationRules> => {
  return {
    displayName: (value: string) => {
      if (!value.trim()) return 'Name is required';
      if (value.length < 2) return 'Name must be at least 2 characters';
      return undefined;
    },
    
    quantity: (value: number) => {
      if (value <= 0) return 'Quantity must be greater than 0';
      if (!Number.isFinite(value)) return 'Invalid quantity';
      return undefined;
    },
    
    unit: (value: MeasurementUnit) => {
      if (!MEASUREMENT_UNITS.includes(value)) return 'Invalid unit';
      return undefined;
    },
    
    category: (value: string | undefined) => {
      if (value && value.length > 30) return 'Category must be less than 30 characters';
      return undefined;
    },
    
    expiryDate: (value: string | undefined) => {
      if (!value) return undefined;
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Invalid date';
      if (date < new Date()) return 'Expiry date cannot be in the past';
      return undefined;
    }
  };
};
