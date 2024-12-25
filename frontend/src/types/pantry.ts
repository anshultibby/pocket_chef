import { PantryItem, PantryItemUpdate, PantryItemCreate } from '@/types';

export interface PantryGridProps {
  items: PantryItem[];
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
  selectedCategories: string[];
  onSelectCategory: (category: string) => void;
  onClearCategories: () => void;
}

export interface AddItemModalProps {
  onClose: () => void;
  isEditing?: boolean;
  initialValues?: PantryItemCreate;
  itemId?: string;
  onAdd?: (item: PantryItemCreate) => void;
}

export interface ItemEditModalProps {
  item: PantryItem;
  onClose: () => void;
  onUpdate: (updates: Partial<PantryItemUpdate>) => void;
}
