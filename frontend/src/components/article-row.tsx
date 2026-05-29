import { Archive, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteArticle, useUpdateArticle } from '@/hooks/use-articles'
import { useStore } from '@/store'
import type { Article } from '@/api/types'

const STATUS_COLORS: Record<string, string> = {
  inbox: 'var(--s-inbox)', unread: 'var(--s-unread)',
  reading: 'var(--s-reading)', done: 'var(--s-done)',
  archived: 'var(--s-archived)',
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--p-1)', 2: 'var(--p-2)', 3: 'var(--p-3)',
  4: 'var(--p-4)', 5: 'var(--p-5)',
}

function relativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`
  if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}w`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url }
}

function getSnippet(text: string | null | undefined, query: string): React.ReactNode {
  if (!text || !query) return null
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  if (index === -1) return null

  const start = Math.max(0, index - 30)
  const end = Math.min(text.length, index + query.length + 30)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''

  const before = text.slice(start, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length, end)

  return (
    <>
      {prefix}{before}
      <span style={{ color: 'var(--amber)', fontWeight: 500 }}>{match}</span>
      {after}{suffix}
    </>
  )
}

interface ArticleRowProps {
  article: Article
  isSelected: boolean
}

export function ArticleRow({ article, isSelected }: ArticleRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const openEditDialog = useStore((s) => s.openEditDialog)
  const toggleSelect = useStore((s) => s.toggleSelect)
  const addToast = useStore((s) => s.addToast)
  const search = useStore((s) => s.search)

  const { mutateAsync: updateArticle } = useUpdateArticle(article.id)
  const { mutateAsync: deleteArticle } = useDeleteArticle()

  const priorityColor = PRIORITY_COLORS[article.priority] ?? 'var(--text-3)'
  const statusColor = STATUS_COLORS[article.status] ?? 'var(--text-3)'

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    
    let newStatus = 'archived'
    if (article.status === 'archived') {
      newStatus = localStorage.getItem(`prev_status_${article.id}`) || 'unread'
    } else {
      localStorage.setItem(`prev_status_${article.id}`, article.status)
    }

    try { 
      await updateArticle({ status: newStatus })
      addToast(newStatus === 'archived' ? 'Archived' : `Restored to ${newStatus}`)
    }
    catch { addToast(`Failed to ${newStatus === 'archived' ? 'archive' : 'restore'}`, 'error') }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    if (!window.confirm(`Delete "${article.title}"?`)) return
    try { await deleteArticle(article.id); addToast('Deleted') }
    catch { addToast('Failed to delete', 'error') }
    setMenuOpen(false)
  }

  let matchContext: React.ReactNode = null
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    if (article.reason && article.reason.toLowerCase().includes(q)) {
      matchContext = <span className="article-row-match">Reason: {getSnippet(article.reason, q)}</span>
    } else if (article.notes && article.notes.toLowerCase().includes(q)) {
      matchContext = <span className="article-row-match">Note: {getSnippet(article.notes, q)}</span>
    } else if (article.source && article.source.toLowerCase().includes(q)) {
      matchContext = <span className="article-row-match">Source: {getSnippet(article.source, q)}</span>
    } else if (article.tags && article.tags.some(t => t.toLowerCase().includes(q))) {
      matchContext = <span className="article-row-match">Tag match</span>
    }
  }

  const [isExpanded, setIsExpanded] = useState(false)
  const hasDetails = Boolean(article.reason || article.notes)

  const handleRowClick = (e: React.MouseEvent) => {
    // If clicking a button, input, or link, don't navigate
    const target = e.target as HTMLElement
    if (target.closest('button, input, a, .article-row-expanded')) return
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onClick={handleRowClick}
      onMouseLeave={() => setMenuOpen(false)}
      className={`article-row ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
    >
      <div className="article-row-main">
        {/* Checkbox */}
        <div
          className="article-row-check"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleSelect(article.id) }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(article.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${article.title}`}
          />
        </div>

        {/* Status dot */}
        <span className={`article-status-dot ${article.status}`} title={article.status} />

        {/* Content */}
        <div className="article-row-content">
          <div className="article-row-top">
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className={`article-row-title ${article.status === 'archived' ? 'archived' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              {article.title}
            </a>
            <span
              className="article-row-priority"
              style={{ color: priorityColor, borderColor: priorityColor + '33' }}
            >
              P{article.priority}
            </span>
          </div>
          <div className="article-row-bottom">
            <span className="article-row-domain">{getDomain(article.url)}</span>
            {(article.tags ?? []).length > 0 && (
              <>
                <span style={{ color: 'var(--border-strong)' }}>·</span>
                <span className="article-row-tags">
                  {(article.tags ?? []).slice(0, 2).map((tag) => (
                    <span key={tag} className="article-tag">{tag}</span>
                  ))}
                  {(article.tags ?? []).length > 2 && (
                    <span className="article-tag-more">+{(article.tags ?? []).length - 2}</span>
                  )}
                </span>
              </>
            )}
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span className="article-row-status-text" style={{ color: statusColor }}>
              {article.status}
            </span>
          </div>
          {matchContext}
        </div>

        {/* Date */}
        <span className="article-row-date">{relativeDate(article.created_at)}</span>

        {/* Actions */}
        <div className="article-row-actions">
          {hasDetails && (
            <button type="button" title="Toggle details" className="icon-btn"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsExpanded(!isExpanded) }}>
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
          <button type="button" title="Edit" className="icon-btn"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); openEditDialog(article.id) }}>
            <Pencil size={13} />
          </button>
          <button type="button" title="Archive" className="icon-btn" onClick={handleArchive}>
            <Archive size={13} />
          </button>
          <div className="row-menu-wrap">
            <button type="button" title="More" className="icon-btn"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpen(!menuOpen) }}>
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <div className="row-menu-popup"
                onClick={(e) => { e.stopPropagation(); e.preventDefault() }}>
                <button type="button" className="menu-action-btn danger" onClick={handleDelete}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="article-row-expanded">
          {article.reason && (
            <div className="expanded-section">
              <span className="expanded-label">Reason</span>
              <p className="expanded-text">{article.reason}</p>
            </div>
          )}
          {article.notes && (
            <div className="expanded-section">
              <span className="expanded-label">Notes</span>
              <p className="expanded-text" style={{ whiteSpace: 'pre-wrap' }}>{article.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
