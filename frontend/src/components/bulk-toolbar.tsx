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
    <div className="bulk-toolbar">
      <div className="bulk-info">
        <CheckSquare size={13} />
        {ids.length} selected
      </div>

      <div className="bulk-divider" />

      <button type="button" className="bulk-btn" onClick={handleArchive}>
        <Archive size={12} /> Archive
      </button>

      <div style={{ display: 'flex', gap: 4 }}>
        <select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          className="compact-select"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="button" className="bulk-btn" onClick={handleStatus}>
          <Square size={12} /> Set status
        </button>
      </div>

      <button type="button" className="bulk-btn danger" onClick={handleDelete}>
        <Trash2 size={12} /> Delete
      </button>

      <div className="bulk-spacer" />
      <button type="button" className="bulk-clear-btn" onClick={clearSelection}>
        <X size={11} /> Clear
      </button>
    </div>
  )
}
