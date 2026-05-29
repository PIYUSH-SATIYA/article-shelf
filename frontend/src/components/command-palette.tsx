import { Archive, BookOpen, CheckCheck, Inbox, Library, Plus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useArticles } from '@/hooks/use-articles'
import { useStore } from '@/store'

const QUICK_ACTIONS = [
  { label: 'Show Inbox',    icon: <Inbox size={13} />,     action: 'status:inbox'    },
  { label: 'Show Reading',  icon: <BookOpen size={13} />,  action: 'status:reading'  },
  { label: 'Show Done',     icon: <CheckCheck size={13} />, action: 'status:done'    },
  { label: 'Show Archived', icon: <Archive size={13} />,   action: 'status:archived' },
  { label: 'Show All',      icon: <Library size={13} />,   action: 'status:'         },
  { label: 'Add article',   icon: <Plus size={13} />,      action: 'create'          },
]

export function CommandPalette() {
  const paletteOpen  = useStore((s) => s.paletteOpen)
  const closePalette = useStore((s) => s.closePalette)
  const setStatus    = useStore((s) => s.setStatus)
  const resetFilters = useStore((s) => s.resetFilters)

  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  // Fetch articles for search
  const { data: articles = [] } = useArticles({
    search: query || undefined,
    limit: 8,
    sort_by: 'created_at',
    order: 'desc',
  })

  const filteredActions = query
    ? QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_ACTIONS

  const results: Array<{ type: 'action'; label: string; icon: React.ReactNode; action: string } | { type: 'article'; id: number; title: string; url: string }> = [
    ...filteredActions.map((a) => ({ type: 'action' as const, ...a })),
    ...articles.map((a) => ({ type: 'article' as const, id: a.id, title: a.title, url: a.url })),
  ]

  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [paletteOpen])

  useEffect(() => {
    setCursor(0)
  }, [query])

  const executeResult = (idx: number) => {
    const item = results[idx]
    if (!item) return
    if (item.type === 'action') {
      if (item.action === 'create') {
        useStore.getState().openCreateDialog()
      } else if (item.action.startsWith('status:')) {
        const s = item.action.replace('status:', '')
        if (s === '') resetFilters()
        else setStatus(s)
      }
    } else {
      useStore.getState().openEditDialog(item.id)
    }
    closePalette()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!paletteOpen) return
      if (e.key === 'Escape') { closePalette(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
      if (e.key === 'Enter')     { e.preventDefault(); executeResult(cursor) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen, cursor, results])

  if (!paletteOpen) return null

  return (
    <>
      <div
        onClick={closePalette}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90 }}
      />
      <div
        style={{
          position: 'fixed',
          top: '20vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(560px, 90vw)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles or run a command…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
          <kbd style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
          }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {!query && (
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', padding: '8px 14px 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Quick actions
            </p>
          )}
          {results.length === 0 ? (
            <p style={{ padding: '24px 14px', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
              No results for "{query}"
            </p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.type === 'action' ? item.action : `article-${item.id}`}
                type="button"
                onClick={() => executeResult(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 14px',
                  border: 'none',
                  background: i === cursor ? 'var(--bg-hover)' : 'transparent',
                  color: i === cursor ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                  borderLeft: `3px solid ${i === cursor ? 'var(--accent)' : 'transparent'}`,
                }}
                onMouseEnter={() => setCursor(i)}
              >
                <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {item.type === 'action' ? item.icon : <Library size={13} />}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.type === 'action' ? item.label : item.title}
                </span>
                {item.type === 'article' && (
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    article
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 12,
          fontSize: 10,
          color: 'var(--text-tertiary)',
        }}>
          {[['↑↓', 'navigate'], ['↵', 'select'], ['Esc', 'close']].map(([key, hint]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 2, padding: '1px 5px', fontFamily: 'var(--font-mono)', fontSize: 9 }}>{key}</kbd>
              {hint}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
