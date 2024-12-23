import { PantryItem, PantryItemCreate, PantryItemUpdate } from '@/types';

export interface PantryGridProps {
  groupedItems: Record<string, PantryItem[]>;
  onSelectItem: (item: PantryItem) => void;
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
  pantryItems: PantryItem[];
}

export interface AddItemModalProps {
  onAdd: (item: PantryItemCreate) => void;
  onClose: () => void;
}

export interface ItemEditModalProps {
  item: PantryItem;
  onClose: () => void;
  onUpdate: (updates: Partial<PantryItemUpdate>) => void;
}
