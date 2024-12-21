import { z } from 'zod';

const measurementUnitEnum = z.enum(['units', 'grams', 'milliliters', 'pinch'] as const);

export const itemFormSchema = z.object({
  display_name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  quantity: z.number()
    .positive('Quantity must be positive')
    .min(0.1, 'Quantity must be at least 0.1'),
  unit: measurementUnitEnum,
  notes: z.string().optional(),
  expiry_date: z.string().nullable().optional(),
});

// Infer the type from the schema
export type ItemFormValues = z.infer<typeof itemFormSchema>;
