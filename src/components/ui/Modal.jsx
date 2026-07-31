import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function Modal({ title, onClose, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
