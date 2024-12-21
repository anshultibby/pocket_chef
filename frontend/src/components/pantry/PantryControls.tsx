import { PantryControlsProps } from '@/types/pantry';

export default function PantryControls({
  searchTerm,
  onSearchChange,
  onAddItem,
  onUploadReceipt,
  onClearPantry,
  isUploading,
  fileInputRef,
  pantryItemsCount
}: PantryControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className="relative w-64">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-gray-800/50 rounded-lg px-10 py-2 text-white w-full focus:ring-2 ring-blue-500 focus:outline-none text-sm"
        />
      </div>
  
      <button
        onClick={onAddItem}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors"
      >
        <span>+</span>
        Add Item
      </button>
      
      <input
        type="file"
        accept="image/*"
        onChange={onUploadReceipt}
        className="hidden"
        ref={fileInputRef}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isUploading 
            ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
        }`}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <span className="animate-spin">⟳</span>
            Processing...
          </>
        ) : (
          <>
            <span>📄</span>
            Upload Receipt
          </>
        )}
      </button>
  
      <button
        onClick={onClearPantry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
        disabled={isUploading || pantryItemsCount === 0}
      >
        <span>🗑️</span>
        Clear Pantry
      </button>
    </div>
  );
}