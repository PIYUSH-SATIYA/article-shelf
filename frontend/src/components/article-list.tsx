import { BookOpen, Loader2 } from 'lucide-react'
import { useArticles } from '@/hooks/use-articles'
import { useStore } from '@/store'
import type { ListParams } from '@/api/types'
import { ArticleRow } from './article-row'

export function ArticleList() {
  const search    = useStore((s) => s.search)
  const status    = useStore((s) => s.status)
  const priority  = useStore((s) => s.priority)
  const tag       = useStore((s) => s.tag)
  const sortBy    = useStore((s) => s.sortBy)
  const order     = useStore((s) => s.order)
  const limit     = useStore((s) => s.limit)
  const page      = useStore((s) => s.page)
  const selectedIds = useStore((s) => s.selectedIds)
  const toggleSelectAll = useStore((s) => s.toggleSelectAll)

  const params: ListParams = {
    search:   search.trim() || undefined,
    status:   status  || undefined,
    priority: priority ? Number(priority) : undefined,
    tag:      tag     || undefined,
    sort_by:  sortBy  || undefined,
    order:    order   || undefined,
    limit,
    offset:   page * limit,
  }

  const { data: articles = [], isLoading, isFetching, isError, error } = useArticles(params)

  const allIds = articles.map((a) => a.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  if (isError) {
    return (
      <div style={{
        padding: '32px 16px', textAlign: 'center',
        color: 'var(--danger)', background: 'var(--danger-bg)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--danger)', fontSize: 13,
      }}>
        {error instanceof Error ? error.message : 'Failed to load articles'}
      </div>
    )
  }

  return (
    <div role="table" className="article-list-wrap">
      {/* Header */}
      <div role="row" className="article-list-header">
        {/* Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => toggleSelectAll(allIds)}
            aria-label="Select all"
            disabled={articles.length === 0}
            style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
        </div>
        <span className="article-list-header-cell">Title / URL</span>
        <span className="article-list-header-cell col-tags">Tags</span>
        <span className="article-list-header-cell" style={{ textAlign: 'center' }}>Status</span>
        <span className="article-list-header-cell col-priority" style={{ textAlign: 'center' }}>Pri</span>
        <span className="article-list-header-cell col-date" style={{ textAlign: 'right' }}>Added</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {isFetching && !isLoading && (
            <Loader2 size={11} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
          )}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="article-list-empty">
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
          <p>Loading…</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="article-list-empty">
          <div className="article-list-empty-icon">
            <BookOpen size={22} />
          </div>
          <p>No articles here yet</p>
          <span>Paste a URL above or press N to add one</span>
        </div>
      ) : (
        articles.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            isSelected={selectedIds.has(article.id)}
          />
        ))
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
