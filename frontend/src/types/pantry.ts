import { PantryItemWithIngredient, PantryItemCreate, PantryItemUpdate, MeasurementUnit } from '@/types';

export interface PantryGridProps {
  groupedItems: Record<string, PantryItemWithIngredient[]>;
  onSelectItem: (item: PantryItemWithIngredient) => void;
  onDeleteItem: (id: string) => void;
}

export interface PantryControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddItem: () => void;
  onUploadReceipt: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPantry: () => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  pantryItemsCount: number;
}

export interface CategoryFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  pantryItems: PantryItemWithIngredient[];
}

export interface AddItemModalProps {
  onAdd: (item: PantryItemCreate) => void;
  onClose: () => void;
}

export interface ItemEditModalProps {
  item: PantryItemWithIngredient;
  onClose: () => void;
  onUpdate: (updates: Partial<PantryItemUpdate>) => void;
}

export interface ItemFormValues {
  display_name: string;
  quantity: number;
  unit: MeasurementUnit;
  notes?: string;
  expiry_date?: string | null;
}
