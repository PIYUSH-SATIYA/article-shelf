import { Archive, CheckSquare, Square, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useBulkArchive, useBulkDelete, useBulkStatus } from '@/hooks/use-articles'
import { useStore } from '@/store'

const STATUS_OPTIONS = ['inbox', 'unread', 'reading', 'done', 'archived']

export function BulkToolbar() {
  const selectedIds    = useStore((s) => s.selectedIds)
  const clearSelection = useStore((s) => s.clearSelection)
  const addToast       = useStore((s) => s.addToast)
  const [bulkStatus, setBulkStatus] = useState('archived')

  const { mutateAsync: bulkDelete  } = useBulkDelete()
  const { mutateAsync: bulkArchive } = useBulkArchive()
  const { mutateAsync: bulkStatus_ } = useBulkStatus()

  const ids = Array.from(selectedIds)
  if (ids.length === 0) return null

  const handleArchive = async () => {
    try {
      await bulkArchive(ids)
      clearSelection()
      addToast(`Archived ${ids.length} articles`)
    } catch { addToast('Failed', 'error') }
  }

  const handleStatus = async () => {
    try {
      await bulkStatus_({ ids, status: bulkStatus })
      clearSelection()
      addToast(`Updated ${ids.length} articles to "${bulkStatus}"`)
    } catch { addToast('Failed', 'error') }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${ids.length} article(s)?`)) return
    try {
      await bulkDelete(ids)
      clearSelection()
      addToast(`Deleted ${ids.length} articles`)
    } catch { addToast('Failed', 'error') }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: 'var(--accent-muted)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-lg)',
      flexWrap: 'wrap',
    }}>
      {/* Selection info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-text)', fontSize: 12, fontWeight: 500 }}>
        <CheckSquare size={13} />
        {ids.length} selected
      </div>

      <div style={{ width: 1, height: 16, background: 'var(--border-strong)' }} />

      {/* Archive */}
      <BulkBtn onClick={handleArchive} icon={<Archive size={12} />}>
        Archive
      </BulkBtn>

      {/* Status update */}
      <div style={{ display: 'flex', gap: 4 }}>
        <select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '5px 8px',
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <BulkBtn onClick={handleStatus} icon={<Square size={12} />}>
          Set status
        </BulkBtn>
      </div>

      {/* Delete */}
      <BulkBtn onClick={handleDelete} icon={<Trash2 size={12} />} danger>
        Delete
      </BulkBtn>

      {/* Spacer + clear */}
      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={clearSelection}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer', fontSize: 11,
          fontFamily: 'var(--font-sans)',
        }}
      >
        <X size={11} /> Clear
      </button>
    </div>
  )
}

function BulkBtn({
  children, onClick, icon, danger = false,
}: {
  children: React.ReactNode
  onClick: () => void
  icon: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        background: 'var(--bg-elevated)',
        border: `1px solid ${danger ? 'var(--danger)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 12,
        fontFamily: 'var(--font-sans)',
        transition: 'background 0.1s, color 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'var(--danger-bg)' : 'var(--bg-hover)'
        if (!danger) e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--bg-elevated)'
        e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-secondary)'
      }}
    >
      {icon} {children}
    </button>
  )
}
