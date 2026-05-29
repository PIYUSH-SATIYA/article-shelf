import { useEffect, useDeferredValue, useMemo } from 'react'
import { useStore } from '@/store'
import { useArticles } from '@/hooks/use-articles'
import { Sidebar }         from '@/components/sidebar'
import { QuickAdd }        from '@/components/quick-add'
import { FilterBar }       from '@/components/filter-bar'
import { ArticleList }     from '@/components/article-list'
import { BulkToolbar }     from '@/components/bulk-toolbar'
import { Pagination }      from '@/components/pagination'
import { ArticleDialog }   from '@/components/article-dialog'
import { CommandPalette }  from '@/components/command-palette'
import { Toast }           from '@/components/toast'
import type { ListParams } from '@/api/types'

export default function App() {
  const search    = useStore((s) => s.search)
  const status    = useStore((s) => s.status)
  const priority  = useStore((s) => s.priority)
  const tag       = useStore((s) => s.tag)
  const sortBy    = useStore((s) => s.sortBy)
  const order     = useStore((s) => s.order)
  const limit     = useStore((s) => s.limit)
  const page      = useStore((s) => s.page)

  const openPalette       = useStore((s) => s.openPalette)
  const closePalette      = useStore((s) => s.closePalette)
  const paletteOpen       = useStore((s) => s.paletteOpen)
  const dialogMode        = useStore((s) => s.dialogMode)
  const openCreateDialog  = useStore((s) => s.openCreateDialog)
  const closeDialog       = useStore((s) => s.closeDialog)

  const deferredSearch = useDeferredValue(search)

  const params: ListParams = useMemo(() => ({
    search:   deferredSearch.trim() || undefined,
    status:   status   || undefined,
    priority: priority ? Number(priority) : undefined,
    tag:      tag      || undefined,
    sort_by:  sortBy   || undefined,
    order:    order    || undefined,
    limit,
    offset:   page * limit,
  }), [deferredSearch, status, priority, tag, sortBy, order, limit, page])

  const { data: articles = [] } = useArticles(params)

  // Sync filter state to URL
  useEffect(() => {
    const q = new URLSearchParams()
    if (deferredSearch) q.set('search', deferredSearch)
    if (status)   q.set('status', status)
    if (priority) q.set('priority', priority)
    if (tag)      q.set('tag', tag)
    if (sortBy)   q.set('sort_by', sortBy)
    if (order)    q.set('order', order)
    if (limit !== 25) q.set('limit', String(limit))
    if (page > 0)     q.set('page', String(page))
    const str = q.toString()
    window.history.replaceState(null, '', str ? `?${str}` : window.location.pathname)
  }, [deferredSearch, status, priority, tag, sortBy, order, limit, page])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // ⌘K / Ctrl+K — command palette (works from anywhere)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        paletteOpen ? closePalette() : openPalette()
        return
      }

      // Esc — close overlays (dialog > palette)
      if (e.key === 'Escape') {
        if (paletteOpen) { closePalette(); return }
        if (dialogMode)  { closeDialog();  return }
      }

      // Don't intercept other keys when user is typing in an input
      if (isEditing) return

      // / — focus search
      if (e.key === '/') {
        e.preventDefault()
        document.getElementById('filter-search')?.focus()
        return
      }

      // N — open create dialog (full form)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        openCreateDialog()
        return
      }

      // C — focus quick-add URL input (fast capture)
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        const el = document.getElementById('quick-add-url') as HTMLInputElement | null
        el?.focus()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen, dialogMode, openPalette, closePalette, openCreateDialog, closeDialog])

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-base)',
    }}>
      <Sidebar />

      <main style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 24px',
        gap: 10,
        overflowY: 'auto',
        maxHeight: '100vh',
      }}>
        <QuickAdd />
        <FilterBar />
        <BulkToolbar />
        <ArticleList />
        <Pagination total={articles.length} />
      </main>

      {/* Overlays */}
      <ArticleDialog />
      <CommandPalette />
      <Toast />
    </div>
  )
}
