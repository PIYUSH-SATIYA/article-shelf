import { Archive, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteArticle, useUpdateArticle } from '@/hooks/use-articles'
import { useStore } from '@/store'
import type { Article } from '@/api/types'

const STATUS_LABELS: Record<string, string> = {
  inbox: 'Inbox', unread: 'Unread', reading: 'Reading', done: 'Done', archived: 'Archived',
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--priority-1)', 2: 'var(--priority-2)', 3: 'var(--priority-3)',
  4: 'var(--priority-4)', 5: 'var(--priority-5)',
}

function relativeDate(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60)  return 'now'
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

interface ArticleRowProps {
  article: Article
  isSelected: boolean
}

export function ArticleRow({ article, isSelected }: ArticleRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const openEditDialog = useStore((s) => s.openEditDialog)
  const toggleSelect   = useStore((s) => s.toggleSelect)
  const addToast       = useStore((s) => s.addToast)

  const { mutateAsync: updateArticle } = useUpdateArticle(article.id)
  const { mutateAsync: deleteArticle } = useDeleteArticle()

  const priorityColor = PRIORITY_COLORS[article.priority] ?? 'var(--text-tertiary)'
  const statusLabel   = STATUS_LABELS[article.status] ?? article.status

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    try {
      await updateArticle({ status: 'archived' })
      addToast('Archived')
    } catch {
      addToast('Failed to archive', 'error')
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    if (!window.confirm(`Delete "${article.title}"?`)) return
    try {
      await deleteArticle(article.id)
      addToast('Deleted')
    } catch {
      addToast('Failed to delete', 'error')
    }
    setMenuOpen(false)
  }

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      onMouseLeave={() => setMenuOpen(false)}
      className={`article-row ${isSelected ? 'selected' : ''}`}
    >
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

      {/* Title + domain */}
      <div className="article-row-title-wrap">
        <div className={`article-row-title ${article.status === 'archived' ? 'archived' : ''}`}>
          {article.title}
        </div>
        <div className="article-row-domain">{getDomain(article.url)}</div>
      </div>

      {/* Tags */}
      <div className="article-row-tags col-tags">
        {(article.tags ?? []).slice(0, 2).map((tag) => (
          <span key={tag} className="article-tag">{tag}</span>
        ))}
        {(article.tags ?? []).length > 2 && (
          <span className="article-tag-more">+{(article.tags ?? []).length - 2}</span>
        )}
      </div>

      {/* Status badge */}
      <span className={`status-badge ${article.status}`}>{statusLabel}</span>

      {/* Priority */}
      <span className="priority-cell col-priority" style={{ color: priorityColor }}>
        P{article.priority}
      </span>

      {/* Date */}
      <span className="date-cell col-date">{relativeDate(article.created_at)}</span>

      {/* Row actions */}
      <div className="article-row-actions">
        <button
          type="button"
          title="Edit"
          className="icon-btn"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); openEditDialog(article.id) }}
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          title="Archive"
          className="icon-btn"
          onClick={handleArchive}
        >
          <Archive size={13} />
        </button>
        <div className="row-menu-wrap">
          <button
            type="button"
            title="More"
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpen(!menuOpen) }}
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <div
              className="row-menu-popup"
              onClick={(e) => { e.stopPropagation(); e.preventDefault() }}
            >
              <button
                type="button"
                className="menu-action-btn danger"
                onClick={handleDelete}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </a>
  )
}
