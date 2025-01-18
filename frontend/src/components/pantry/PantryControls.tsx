import { PantryControlsProps } from '@/types/pantry';
import { 
  PlusIcon, 
  DocumentArrowUpIcon, 
  TrashIcon, 
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ListBulletIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { Capacitor } from '@capacitor/core';
import { useReceiptStore } from '@/stores/receiptStore';

export default function PantryControls({
  searchTerm,
  onSearchChange,
  onAddItem,
  onBulkAdd,
  onUploadReceipt,
  onClearPantry,
  isUploading,
  fileInputRef,
  pantryItemsCount,
  showSearch,
  setShowSearch,
  showFilters,
  setShowFilters
}: PantryControlsProps) {
  const { handleNativeUpload, handleWebUpload } = useReceiptStore();

  const handleUploadClick = () => {
    if (isUploading) return;

    if (Capacitor.isNativePlatform()) {
      handleNativeUpload();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {showSearch ? (
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-800/50 rounded-lg px-4 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              autoFocus
            />
            <button 
              onClick={() => {
                setShowSearch(false);
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                showFilters 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'bg-gray-800/50 text-gray-400 hover:text-white'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filter</span>
            </button>
            
            <button
              onClick={() => setShowSearch(true)}
              className="px-3 py-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span>Search</span>
            </button>

            <button
              onClick={onAddItem}
              className="px-3 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Item</span>
            </button>

            <button
              onClick={onBulkAdd}
              className="px-3 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 flex items-center gap-2"
              title="Bulk Add Items"
            >
              <TableCellsIcon className="w-5 h-5" />
              <span>Bulk Add</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                isUploading 
                  ? 'bg-gray-700/50 text-gray-400' 
                  : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
              }`}
            >
              {isUploading ? 
                <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 
                <DocumentArrowUpIcon className="w-5 h-5" />
              }
              <span>Upload Receipt</span>
            </button>

            <button
              onClick={onClearPantry}
              disabled={pantryItemsCount === 0}
              className="px-3 py-2 rounded-lg bg-red-900/20 text-red-300/70 hover:bg-red-900/30 disabled:opacity-50 flex items-center gap-2"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}