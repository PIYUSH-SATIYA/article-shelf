import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { useStore } from '@/store'

export function Toast() {
  const toasts      = useStore((s) => s.toasts)
  const removeToast = useStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`}>
          <span className="toast-icon">
            {t.type === 'error'
              ? <AlertCircle size={14} style={{ color: 'var(--red)' }} />
              : <CheckCircle size={14} style={{ color: 'var(--green)' }} />
            }
          </span>
          <span className="toast-msg">{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="toast-close-btn"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
