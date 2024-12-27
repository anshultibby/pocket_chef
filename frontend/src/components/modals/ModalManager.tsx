'use client';

import { useReceiptStore } from '@/stores/receiptStore';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';

export function ModalManager() {
  const { 
    showConfirmation,
    pendingItems,
    receiptImage,
    confirmItems,
    clearUpload 
  } = useReceiptStore();

  return (
    <>
      {showConfirmation && pendingItems && (
        <ReceiptConfirmation
          items={pendingItems}
          receiptImage={receiptImage}
          onConfirm={confirmItems}
          onCancel={clearUpload}
        />
      )}
      {/* Other modals */}
    </>
  );
}
