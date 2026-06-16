import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning'
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel, variant = 'danger' }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass-card max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onCancel} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 text-white/40">
          <X className="w-4 h-4" />
        </button>
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${
          variant === 'danger' ? 'bg-accent-pink/20 text-accent-pink' : 'bg-amber-500/20 text-amber-400'
        }`}>
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/50 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1">{cancelLabel}</button>
          <button onClick={onConfirm} className={`btn-primary flex-1 ${
            variant === 'danger' ? '!bg-gradient-to-r !from-accent-pink !to-rose-500' : ''
          }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
