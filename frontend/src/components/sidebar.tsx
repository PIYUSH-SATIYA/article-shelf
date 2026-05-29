import {
  Archive,
  BookOpen,
  CheckCheck,
  Download,
  Inbox,
  Library,
  Tag,
  Upload,
  X,
} from 'lucide-react'
import { useRef } from 'react'
import { articlesApi } from '@/api/articles'
import { useArticles } from '@/hooks/use-articles'
import { useStore } from '@/store'
import type { Article } from '@/api/types'

const STATUS_NAV = [
  { value: '',         label: 'All',      icon: Library  },
  { value: 'inbox',    label: 'Inbox',    icon: Inbox    },
  { value: 'reading',  label: 'Reading',  icon: BookOpen },
  { value: 'done',     label: 'Done',     icon: CheckCheck },
  { value: 'archived', label: 'Archived', icon: Archive  },
] as const

function extractTags(articles: Article[]): string[] {
  const tagSet = new Set<string>()
  for (const a of articles) {
    for (const t of a.tags ?? []) {
      if (t) tagSet.add(t.toLowerCase())
    }
  }
  return Array.from(tagSet).sort()
}

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const status      = useStore((s) => s.status)
  const tag         = useStore((s) => s.tag)
  const setStatus   = useStore((s) => s.setStatus)
  const setTag      = useStore((s) => s.setTag)
  const resetFilters = useStore((s) => s.resetFilters)
  const addToast    = useStore((s) => s.addToast)
  const importRef   = useRef<HTMLInputElement>(null)

  const { data: allArticles = [] } = useArticles({
    limit: 1000,
    sort_by: 'created_at',
    order: 'desc',
  })

  const counts: Record<string, number> = {}
  for (const a of allArticles) {
    counts[a.status] = (counts[a.status] ?? 0) + 1
  }
  const allCount = allArticles.length
  const tags = extractTags(allArticles)

  const handleExport = async () => {
    try {
      const csv = await articlesApi.exportCsv()
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'articles.csv'
      a.click()
      URL.revokeObjectURL(url)
      addToast('Exported articles.csv')
    } catch {
      addToast('Export failed', 'error')
    }
  }

  const handleImport = async (file: File | null) => {
    if (!file) return
    try {
      const result = await articlesApi.importCsv(file)
      addToast(`Imported ${result.imported_count} articles`)
    } catch {
      addToast('Import failed', 'error')
    }
  }

  const handleNavClick = (value: string) => {
    if (value === '') resetFilters()
    else setStatus(value)
    onClose?.()
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo-wrap">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Library size={14} color="#fff" />
          </div>
          <span className="sidebar-logo-text">Shelf</span>
          {/* Mobile close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="sidebar-action-btn"
              style={{ marginLeft: 'auto', width: 30, height: 30, padding: 0, justifyContent: 'center', display: 'flex', alignItems: 'center' }}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* Status nav */}
        <div className="sidebar-section">
          <p className="sidebar-section-label">Library</p>
          {STATUS_NAV.map(({ value, label, icon: Icon }) => {
            const count = value === '' ? allCount : (counts[value] ?? 0)
            const isActive = status === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleNavClick(value)}
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} className="sidebar-nav-icon" />
                <span style={{ flex: 1 }}>{label}</span>
                {count > 0 && (
                  <span className="sidebar-nav-count">{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="sidebar-section">
            <p className="sidebar-section-label">
              <Tag size={10} /> Tags
            </p>
            {tags.map((t) => {
              const isActive = tag === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTag(isActive ? '' : t); onClose?.() }}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  style={{ fontSize: 12 }}
                >
                  <span className="sidebar-tag-dot" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {t}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </nav>

      {/* Footer utilities */}
      <div className="sidebar-footer">
        <button type="button" className="sidebar-action-btn" onClick={handleExport}>
          <Download size={13} />
          Export CSV
        </button>
        <button
          type="button"
          className="sidebar-action-btn"
          onClick={() => importRef.current?.click()}
        >
          <Upload size={13} />
          Import CSV
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            handleImport(e.target.files?.[0] ?? null)
            e.target.value = ''
          }}
        />
        <div className="sidebar-kbd-hint">
          <kbd>⌘K</kbd>
          <span>Command palette</span>
        </div>
      </div>
    </aside>
  )
}
