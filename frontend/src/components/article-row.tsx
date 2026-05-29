import { Archive, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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

  const priorityColor = PRIORITY_COLORS[article.priority] ?? 'var(--text-3)'
  const statusColor   = STATUS_COLORS[article.status] ?? 'var(--text-3)'

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    try { await updateArticle({ status: 'archived' }); addToast('Archived') }
    catch { addToast('Failed to archive', 'error') }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    if (!window.confirm(`Delete "${article.title}"?`)) return
    try { await deleteArticle(article.id); addToast('Deleted') }
    catch { addToast('Failed to delete', 'error') }
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

      {/* Status dot */}
      <span className={`article-status-dot ${article.status}`} title={article.status} />

      {/* Content */}
      <div className="article-row-content">
        <div className="article-row-top">
          <span className={`article-row-title ${article.status === 'archived' ? 'archived' : ''}`}>
            {article.title}
          </span>
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
      </div>

      {/* Date */}
      <span className="article-row-date">{relativeDate(article.created_at)}</span>

      {/* Actions */}
      <div className="article-row-actions">
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
    </a>
  )
}
