import { PantryControlsProps } from '@/types/pantry';
import { Tooltip } from '@/components/shared/ToolTip';
import { 
  PlusIcon, 
  DocumentArrowUpIcon, 
  TrashIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export default function PantryControls({
  searchTerm,
  onSearchChange,
  onAddItem,
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
  const checkPhotoPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    try {
      const permissionState = await Camera.checkPermissions();
      
      if (permissionState.photos === 'prompt' || permissionState.photos === 'denied') {
        const request = await Camera.requestPermissions({
          permissions: ['photos']
        });
        return request.photos === 'granted';
      }
      
      return permissionState.photos === 'granted';
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  };

  const handleUploadClick = async () => {
    if (isUploading) return;
    
    const hasPermission = await checkPhotoPermissions();
    if (!hasPermission) {
      // You might want to show a toast or alert here
      return;
    }
    
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-1 sm:space-y-0">
      {/* Mobile Search Expandable */}
      {showSearch && (
        <div className="sm:hidden relative w-full animate-slideDown mb-2">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gray-800/50 rounded-lg pl-9 pr-3 py-2 text-white w-full focus:ring-2 ring-blue-500 focus:outline-none text-base"
            autoFocus
          />
          <button 
            onClick={() => setShowSearch(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Desktop Controls */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        <div className="relative w-64">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gray-800/50 rounded-lg pl-9 pr-3 py-1.5 text-white w-full focus:ring-2 ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
            showFilters 
              ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50' 
              : 'bg-gray-800/50 text-gray-400 hover:text-white'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          Filter
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onUploadReceipt}
          className="hidden"
          accept="image/*"
          onClick={(e) => {
            const target = e.target as HTMLInputElement;
            target.value = '';
          }}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={onAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add Item
          </button>
          
          <button
            onClick={handleUploadClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
              isUploading 
                ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
            }`}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DocumentArrowUpIcon className="w-4 h-4" />
                Upload Receipt
              </>
            )}
          </button>

          <button
            onClick={onClearPantry}
            disabled={pantryItemsCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/30 text-red-300/70 transition-colors disabled:opacity-50 text-sm"
          >
            <TrashIcon className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Mobile Icon Controls */}
      <div className="relative sm:hidden">
        {/* Remove the pr-14 to allow full width */}
        <div className="flex flex-wrap gap-2">
          {/* Category buttons */}
        </div>
        
        {/* Change justify-end to justify-start */}
        <div className="flex gap-2 justify-start">
          <button
            onClick={() => setShowSearch(true)}
            className="w-10 h-10 rounded-full bg-gray-800/50 text-gray-400 hover:text-white flex items-center justify-center"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              showFilters 
                ? 'bg-blue-600/20 text-blue-400' 
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
          </button>

          <Tooltip content="Add Item">
            <button
              onClick={onAddItem}
              className="w-10 h-10 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 flex items-center justify-center"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Upload Receipt">
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isUploading 
                  ? 'bg-gray-700/50 text-gray-400' 
                  : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
              }`}
            >
              {isUploading ? 
                <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 
                <DocumentArrowUpIcon className="w-5 h-5" />
              }
            </button>
          </Tooltip>

          <Tooltip content="Clear Pantry">
            <button
              onClick={onClearPantry}
              disabled={pantryItemsCount === 0}
              className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 flex items-center justify-center"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onUploadReceipt}
          className="hidden"
          accept="image/*"
          onClick={(e) => {
            const target = e.target as HTMLInputElement;
            target.value = '';
          }}
        />
      </div>
    </div>
  );
}