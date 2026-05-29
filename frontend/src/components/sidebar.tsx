import {
  Archive,
  BookOpen,
  CheckCheck,
  Download,
  Inbox,
  Library,
  Tag,
  Upload,
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

export function Sidebar() {
  const status   = useStore((s) => s.status)
  const tag      = useStore((s) => s.tag)
  const setStatus = useStore((s) => s.setStatus)
  const setTag    = useStore((s) => s.setTag)
  const resetFilters = useStore((s) => s.resetFilters)
  const addToast  = useStore((s) => s.addToast)
  const importRef = useRef<HTMLInputElement>(null)

  // Fetch all articles for sidebar counts + tag list (no filters)
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

  return (
    <aside
      className="sidebar"
      style={{
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26,
            background: 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Library size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Shelf
          </span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
        {/* Status nav */}
        <div style={{ padding: '0 8px', marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Library
          </p>
          {STATUS_NAV.map(({ value, label, icon: Icon }) => {
            const count = value === '' ? allCount : (counts[value] ?? 0)
            const isActive = status === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (value === '') resetFilters()
                  else setStatus(value)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: isActive ? 500 : 400,
                  transition: 'background 0.1s, color 0.1s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <Icon size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: 11,
                    color: isActive ? 'var(--accent-text)' : 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                    minWidth: 20,
                    textAlign: 'right',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ padding: '0 8px', marginTop: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={10} /> Tags
            </p>
            {tags.map((t) => {
              const isActive = tag === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(isActive ? '' : t)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--accent-muted)' : 'transparent',
                    color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'var(--font-sans)',
                    transition: 'background 0.1s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isActive ? 'var(--accent)' : 'var(--border-strong)',
                    flexShrink: 0,
                  }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Utility */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '8px',
        flexShrink: 0,
      }}>
        <SidebarAction icon={<Download size={13} />} label="Export CSV" onClick={handleExport} />
        <SidebarAction
          icon={<Upload size={13} />}
          label="Import CSV"
          onClick={() => importRef.current?.click()}
        />
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
        <div style={{
          marginTop: 8,
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-tertiary)',
          fontSize: 11,
        }}>
          <kbd style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 3,
            padding: '1px 4px',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}>⌘K</kbd>
          <span>Command palette</span>
        </div>
      </div>
    </aside>
  )
}

function SidebarAction({
  icon, label, onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 8px',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 12,
        fontFamily: 'var(--font-sans)',
        transition: 'background 0.1s, color 0.1s',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
        ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
        ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
      }}
    >
      {icon}
      {label}
    </button>
  )
}
