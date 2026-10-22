import { useState, useEffect } from 'react'
import Modal from './Modal'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  typeToConfirm = null,
  onConfirm,
  onCancel,
}) {
  const [typedValue, setTypedValue] = useState('')

  useEffect(() => {
    setTypedValue('')
  }, [title])

  const isChallengePassed = !typeToConfirm || typedValue.trim() === typeToConfirm

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>

        {typeToConfirm && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-2">
            <p className="font-semibold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span>⚠️</span>
              <span>Irreversible Security Challenge</span>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              To prevent accidental data loss, please type{' '}
              <strong className="font-mono font-bold bg-rose-200/60 dark:bg-rose-900/80 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-200">
                {typeToConfirm}
              </strong>{' '}
              below to unlock the button:
            </p>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={`Type "${typeToConfirm}" to confirm`}
              className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isChallengePassed}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition cursor-pointer ${
              !isChallengePassed
                ? 'opacity-40 cursor-not-allowed bg-slate-400 dark:bg-slate-700'
                : danger
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                : 'bg-sky-600 hover:bg-sky-700 active:scale-95'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
