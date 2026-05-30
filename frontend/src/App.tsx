import { useEffect, useDeferredValue, useMemo, useRef, useState } from 'react'
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
import { Library, Menu, Plus } from 'lucide-react'

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

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Capture share params EAGERLY (before any effects can modify the URL)
  const initialShareParams = useRef(() => {
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('action') !== 'share') return null
    const sharedUrl = sp.get('url') || ''
    const sharedText = sp.get('text') || ''
    let finalUrl = sharedUrl.trim()
    if (!finalUrl && sharedText) {
      const urlMatch = sharedText.match(/https?:\/\/[^\s]+/i)
      finalUrl = urlMatch ? urlMatch[0] : sharedText.trim()
    }
    return finalUrl || null
  })
  const shareUrl = useRef<string | null>(typeof initialShareParams.current === 'function' ? initialShareParams.current() : null)

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

  // Handle PWA Web Share Target (uses pre-captured params from ref)
  useEffect(() => {
    const url = shareUrl.current
    if (url) {
      shareUrl.current = null // consume it
      useStore.getState().openCreateDialog(url)
    }
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        paletteOpen ? closePalette() : openPalette()
        return
      }

      if (e.key === 'Escape') {
        if (sidebarOpen) { setSidebarOpen(false); return }
        if (paletteOpen) { closePalette(); return }
        if (dialogMode)  { closeDialog();  return }
      }

      if (isEditing) return

      if (e.key === '/') {
        e.preventDefault()
        document.getElementById('filter-search')?.focus()
        return
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        openCreateDialog()
        return
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        const el = document.getElementById('quick-add-url') as HTMLInputElement | null
        el?.focus()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen, dialogMode, sidebarOpen, openPalette, closePalette, openCreateDialog, closeDialog])

  return (
    <div className="app-layout">
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <header className="mobile-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="mobile-logo">
            <div className="sidebar-logo-icon" style={{ width: 24, height: 24 }}>
              <Library size={12} color="#0B0B0B" />
            </div>
            Shelf
          </div>
          <div style={{ flex: 1 }} />
          <button
            className="mobile-menu-btn"
            onClick={() => openCreateDialog()}
            aria-label="New article"
            title="New article (N)"
          >
            <Plus size={20} />
          </button>
        </header>

        <main className="main-content">
          <QuickAdd />
          <FilterBar />
          <BulkToolbar />
          <ArticleList />
          <Pagination total={(!status ? articles.filter(a => a.status !== 'archived') : articles).length} />
        </main>
      </div>

      {/* Overlays */}
      <ArticleDialog />
      <CommandPalette />
      <Toast />
    </div>
  )
}
