import { z } from 'zod';
import { UNITS } from '../constants/units';

export const nutritionSchema = z.object({
  standard_unit: z.string().optional(),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional()
}).partial().default({});

export const pantryItemDataSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  original_name: z.string().optional(),
  quantity: z.number()
    .min(0.1, 'Quantity must be greater than 0')
    .default(1),
  unit: z.string()
    .min(1, 'Unit is required')
    .default(UNITS.UNITS),
  notes: z.string().optional(),
  expiry_date: z.string().optional().nullable(),
  price: z.number().optional(),
  category: z.string().optional()
});

export const pantryItemCreateSchema = z.object({
  data: pantryItemDataSchema,
  nutrition: nutritionSchema
});

export type PantryItemFormValues = z.infer<typeof pantryItemCreateSchema>;
