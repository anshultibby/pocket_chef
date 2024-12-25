import { PantryItem, PantryItemCreate } from '@/types';
import { create } from 'zustand';

type ModalType = 'addItem' | 'receipt' | 'selectedItem' | 'duplicateItem';

interface ModalData {
  receiptItems?: PantryItemCreate[];
  receiptImage?: string | null;
  initialValues?: PantryItemCreate;
  onAdd?: (item: PantryItemCreate) => void;
  onConfirm?: (items: PantryItemCreate[]) => Promise<void>;
  mode?: 'create' | 'edit';
  existingItem?: PantryItem;
  newItem?: PantryItemCreate;
  onMergeQuantities?: () => void;
  onMergeAndEdit?: () => void;
  onCreateNew?: () => void;
  isProcessing?: boolean;
  selectedItem?: PantryItem;
  itemId?: string;
}

interface ModalState {
  type: ModalType | null;
  data?: ModalData;
}

interface UIStore {
  // State
  searchTerm: string;
  selectedCategories: string[];
  modalState: ModalState;

  // Actions
  setSearchTerm: (term: string) => void;
  onSearchChange: (value: string) => void;
  setSelectedCategories: (categories: string[]) => void;
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  searchTerm: '',
  selectedCategories: [],
  modalState: { type: null },

  // Actions
  setSearchTerm: (term) => set({ searchTerm: term }),
  onSearchChange: (value) => set({ searchTerm: value }),
  setSelectedCategories: (categories) => set({ selectedCategories: categories }),
  openModal: (type, data) => set({ modalState: { type, data } }),
  closeModal: () => set({ modalState: { type: null } })
}));
