import { useState } from 'react';
import { 
  PlusIcon, 
  DocumentArrowUpIcon,
  TableCellsIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface FloatingActionMenuProps {
  onAddItem: () => void;
  onBulkAdd: () => void;
  onUploadReceipt: () => void;
  onToggleSearch: () => void;
  isUploading: boolean;
}

export function FloatingActionMenu({
  onAddItem,
  onBulkAdd,
  onUploadReceipt,
  onToggleSearch,
  isUploading,
}: FloatingActionMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed right-4 bottom-20 sm:bottom-4 z-50">
      {/* Sub-actions */}
      <div className="relative">
        <div className={`absolute bottom-14 right-0 flex flex-col gap-2 transition-all duration-200 ${
          isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}>
          <button
            onClick={() => {
              onToggleSearch();
              setIsExpanded(false);
            }}
            className="w-12 h-12 rounded-full bg-gray-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-gray-500"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              onAddItem();
              setIsExpanded(false);
            }}
            className="w-12 h-12 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-green-400"
          >
            <PlusIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              onBulkAdd();
              setIsExpanded(false);
            }}
            className="w-12 h-12 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-green-400"
          >
            <TableCellsIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              onUploadReceipt();
              setIsExpanded(false);
            }}
            disabled={isUploading}
            className="w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-blue-400 disabled:opacity-50"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
            isExpanded 
              ? 'bg-gray-700 text-white' 
              : 'bg-blue-500 text-white hover:bg-blue-400'
          }`}
        >
          {isExpanded ? (
            <XMarkIcon className="w-5 h-5" />
          ) : (
            <EllipsisVerticalIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
} 