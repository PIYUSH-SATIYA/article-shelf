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

  useEffect(() => { setCursor(0) }, [query])

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
      <div className="palette-backdrop" onClick={closePalette} />
      <div className="palette-modal" role="dialog" aria-modal="true" aria-label="Command palette">
        {/* Search row */}
        <div className="palette-search-row">
          <Search size={16} className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, notes, or run a command…"
            className="palette-input"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="palette-clear-btn">
              <X size={14} />
            </button>
          )}
          <kbd>Esc</kbd>
        </div>

        {/* Results */}
        <div className="palette-results">
          {!query && (
            <p className="palette-section-label">Quick actions</p>
          )}
          {results.length === 0 ? (
            <p className="palette-no-results">No results for "{query}"</p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.type === 'action' ? item.action : `article-${item.id}`}
                type="button"
                onClick={() => executeResult(i)}
                className={`palette-result-btn ${i === cursor ? 'cursor-active' : ''}`}
                onMouseEnter={() => setCursor(i)}
              >
                <span className="palette-result-icon">
                  {item.type === 'action' ? item.icon : <Library size={13} />}
                </span>
                <span className="palette-result-label">
                  {item.type === 'action' ? item.label : item.title}
                </span>
                {item.type === 'article' && (
                  <span className="palette-result-type">article</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="palette-footer">
          {[['↑↓', 'navigate'], ['↵', 'select'], ['Esc', 'close']].map(([key, hint]) => (
            <span key={key} className="palette-footer-hint">
              <kbd>{key}</kbd>
              {hint}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
