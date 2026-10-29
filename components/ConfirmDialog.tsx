import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Props { open: boolean; title?: string; message: string; confirmLabel?: string; loading?: boolean; onConfirm: () => void; onCancel: () => void }

export function ConfirmDialog({ open, title = 'Please confirm', message, confirmLabel = 'Delete', loading = false, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} title={title} onClose={loading ? () => undefined : onCancel}
      footer={<>
        <Button variant="secondary" onClick={onCancel} disabled={loading} data-testid="confirm-cancel">Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading} loadingText="Deleting..." data-testid="confirm-accept">{confirmLabel}</Button>
      </>}>
      {message}
    </Modal>
  );
}
