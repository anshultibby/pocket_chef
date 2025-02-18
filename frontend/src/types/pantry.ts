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
  onBulkAdd: () => void;
  onUploadReceipt: (event?: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPantry: () => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  pantryItemsCount: number;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

export interface CategoryFiltersProps {
  categories: string[];
  selectedCategories: string[];
  onSelectCategory: (category: string) => void;
  onClearCategories: () => void;
}

export interface AddItemModalProps {
  initialValues?: PantryItemCreate;
  onAdd: (item: PantryItemCreate) => void | Promise<void>;
  onClose: () => void;
  isEditing?: boolean;
  isRecipeUse?: boolean;
  originalQuantity?: number;
}

export interface ItemEditModalProps {
  item: PantryItem;
  onClose: () => void;
  onUpdate: (updates: Partial<PantryItemUpdate>) => void;
}
