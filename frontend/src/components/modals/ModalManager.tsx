import AddItemModal from './AddItemModal';
import ReceiptConfirmation from '../ReceiptConfirmation';
import { useUIStore } from '@/stores/uiStore';
import { DuplicateItemModal } from './DuplicateItemModal';

export default function ModalManager() {
  const { modalState, closeModal } = useUIStore();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      {modalState.type === 'addItem' && (
        <AddItemModal 
          initialValues={modalState.data?.initialValues}
          onAdd={modalState.data?.onAdd}
          onClose={closeModal}
          isEditing={modalState.data?.mode === 'edit'}
        />
      )}

      {modalState.type === 'receipt' && modalState.data && modalState.data.receiptItems && (
        <ReceiptConfirmation 
          items={modalState.data.receiptItems}
          receiptImage={modalState.data.receiptImage ?? null}
          onConfirm={async (items) => {
            if (modalState.data?.onConfirm) {
              await modalState.data.onConfirm(items);
            }
            closeModal();
          }}
          onCancel={() => closeModal()}
          onClose={() => closeModal()}
        />
      )}

      {modalState.type === 'selectedItem' && modalState.data && 
       modalState.data.existingItem && 
       modalState.data.newItem && 
       modalState.data.onMergeQuantities && 
       modalState.data.onMergeAndEdit && 
       modalState.data.onCreateNew && (
        <DuplicateItemModal 
          existingItem={modalState.data.existingItem}
          newItem={modalState.data.newItem}
          onMergeQuantities={modalState.data.onMergeQuantities}
          onMergeAndEdit={modalState.data.onMergeAndEdit}
          onCreateNew={modalState.data.onCreateNew}
          onCancel={() => closeModal()}
          isProcessing={modalState.data.isProcessing}
        />
      )}
    </div>
  );
}
