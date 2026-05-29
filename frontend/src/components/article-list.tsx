import { BookOpen, Loader2 } from 'lucide-react'
import { useArticles } from '@/hooks/use-articles'
import { useStore } from '@/store'
import type { ListParams } from '@/api/types'
import { ArticleRow } from './article-row'

export function ArticleList() {
  const search      = useStore((s) => s.search)
  const status      = useStore((s) => s.status)
  const priority    = useStore((s) => s.priority)
  const tag         = useStore((s) => s.tag)
  const sortBy      = useStore((s) => s.sortBy)
  const order       = useStore((s) => s.order)
  const limit       = useStore((s) => s.limit)
  const page        = useStore((s) => s.page)
  const selectedIds = useStore((s) => s.selectedIds)

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

  if (isError) {
    return (
      <div style={{
        padding: '32px 16px', textAlign: 'center',
        color: 'var(--red)', background: 'var(--red-dim)',
        borderRadius: 'var(--r-lg)', border: '1px solid var(--red)', fontSize: 13,
      }}>
        {error instanceof Error ? error.message : 'Failed to load articles'}
      </div>
    )
  }

  const displayArticles = !status 
    ? articles.filter(a => a.status !== 'archived') 
    : articles

  return (
    <div className="article-list-wrap" role="list">
      {/* Subtle refetch indicator */}
      {isFetching && !isLoading && (
        <div style={{
          position: 'absolute', top: 0, right: 16,
          padding: '6px',
        }}>
          <Loader2 size={12} style={{ color: 'var(--amber)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {isLoading ? (
        <div className="article-list-empty">
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--amber)' }} />
          <p>Loading…</p>
        </div>
      ) : displayArticles.length === 0 ? (
        <div className="article-list-empty">
          <div className="article-list-empty-icon">
            <BookOpen size={22} />
          </div>
          <p>Nothing here yet</p>
          <span>Paste a URL above or press <kbd>N</kbd> to add your first article</span>
        </div>
      ) : (
        displayArticles.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            isSelected={selectedIds.has(article.id)}
          />
        ))
      )}
    </div>
  )
}
