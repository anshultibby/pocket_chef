import { PantryControlsProps } from '@/types/pantry';
import { Tooltip } from '@/components/shared/ToolTip';
import { useState } from 'react';

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
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="space-y-1 sm:space-y-0">
      {/* Mobile Search Expandable */}
      {showSearch && (
        <div className="sm:hidden relative w-full animate-slideDown mb-2">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gray-800/50 rounded-lg px-4 py-2 text-white w-full focus:ring-2 ring-blue-500 focus:outline-none text-base"
            autoFocus
          />
          <button 
            onClick={() => setShowSearch(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Desktop Controls */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        <div className="relative w-64">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gray-800/50 rounded-lg px-8 py-1.5 text-white w-full focus:ring-2 ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors text-sm"
          >
            <span>+</span>
            Add Item
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
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
            disabled={pantryItemsCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors disabled:opacity-50 text-sm"
          >
            <span>🗑️</span>
            Clear
          </button>
        </div>
      </div>

      {/* Mobile Icon Controls */}
      <div className="relative sm:hidden">
        {/* Categories take most of the width */}
        <div className="flex flex-wrap gap-2 pr-14">
          {/* Category buttons */}
        </div>
        
        {/* Controls stacked vertically */}
        <div className="absolute right-0 top-0 flex flex-col gap-2">
          <Tooltip content="Search">
            <button
              onClick={() => setShowSearch(true)}
              className="w-10 h-10 rounded-full bg-gray-800/50 text-gray-400 hover:text-white flex items-center justify-center"
            >
              🔍
            </button>
          </Tooltip>

          <Tooltip content="Add Item">
            <button
              onClick={onAddItem}
              className="w-10 h-10 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 flex items-center justify-center"
            >
              +
            </button>
          </Tooltip>

          <Tooltip content="Upload Receipt">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isUploading 
                  ? 'bg-gray-700/50 text-gray-400' 
                  : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
              }`}
            >
              {isUploading ? '⟳' : '📄'}
            </button>
          </Tooltip>

          <Tooltip content="Clear Pantry">
            <button
              onClick={onClearPantry}
              disabled={pantryItemsCount === 0}
              className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 flex items-center justify-center"
            >
              🗑️
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}