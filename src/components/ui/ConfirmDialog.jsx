import Modal from './Modal'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-sm">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{message}</p>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
            danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
