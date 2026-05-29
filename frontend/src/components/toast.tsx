import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { useStore } from '@/store'

export function Toast() {
  const toasts      = useStore((s) => s.toasts)
  const removeToast = useStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 320,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            background: 'var(--bg-elevated)',
            border: `1px solid ${t.type === 'error' ? 'var(--danger)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            color: t.type === 'error' ? 'var(--danger)' : 'var(--text-primary)',
            fontSize: 13,
            pointerEvents: 'all',
            animation: 'slideIn 0.2s ease',
          }}
        >
          {t.type === 'error'
            ? <AlertCircle size={14} style={{ flexShrink: 0, color: 'var(--danger)' }} />
            : <CheckCircle size={14} style={{ flexShrink: 0, color: 'var(--success)' }} />
          }
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', display: 'flex', padding: 2,
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
