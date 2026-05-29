import { Loader2 } from 'lucide-react'
import { useArticles } from '@/hooks/use-articles'
import { useStore } from '@/store'
import type { ListParams } from '@/api/types'
import { ArticleRow, ROW_COLUMNS } from './article-row'

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
    <div
      role="table"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header — uses same ROW_COLUMNS as rows */}
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: ROW_COLUMNS,
          alignItems: 'center',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 8px',
          minHeight: 32,
        }}
      >
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
        <ColHeader>Title / URL</ColHeader>
        <ColHeader>Tags</ColHeader>
        <ColHeader align="center">Status</ColHeader>
        <ColHeader align="center">Pri</ColHeader>
        <ColHeader align="right">Added</ColHeader>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {isFetching && !isLoading && (
            <Loader2 size={11} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
          )}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div style={{
          padding: '48px 16px', textAlign: 'center',
          color: 'var(--text-tertiary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13,
        }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Loading…
        </div>
      ) : articles.length === 0 ? (
        <div style={{
          padding: '48px 16px', textAlign: 'center',
          color: 'var(--text-tertiary)', fontSize: 13,
        }}>
          No articles match your filters.
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

function ColHeader({ children, align }: { children?: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: 'var(--text-tertiary)',
      textAlign: align ?? 'left',
    }}>
      {children}
    </span>
  )
}
