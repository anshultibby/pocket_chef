import { z } from 'zod';

export const itemFormSchema = z.object({
  display_name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  quantity: z.number()
    .positive('Quantity must be positive')
    .min(0.1, 'Quantity must be at least 0.1'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
  expiry_date: z.string().nullable().optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;
