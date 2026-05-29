import { Archive, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteArticle, useUpdateArticle } from '@/hooks/use-articles'
import { useStore } from '@/store'
import type { Article } from '@/api/types'

/** Shared column template — must match ArticleList header */
export const ROW_COLUMNS = '32px 1fr 140px 72px 36px 56px 80px'

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  inbox:    { color: 'var(--status-inbox)',    bg: 'var(--status-inbox-bg)',    label: 'Inbox'    },
  unread:   { color: 'var(--status-unread)',   bg: 'var(--status-unread-bg)',   label: 'Unread'   },
  reading:  { color: 'var(--status-reading)',  bg: 'var(--status-reading-bg)',  label: 'Reading'  },
  done:     { color: 'var(--status-done)',     bg: 'var(--status-done-bg)',     label: 'Done'     },
  archived: { color: 'var(--status-archived)', bg: 'var(--status-archived-bg)', label: 'Archived' },
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--priority-1)',
  2: 'var(--priority-2)',
  3: 'var(--priority-3)',
  4: 'var(--priority-4)',
  5: 'var(--priority-5)',
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
  const [isHovered, setIsHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const openEditDialog = useStore((s) => s.openEditDialog)
  const toggleSelect   = useStore((s) => s.toggleSelect)
  const addToast       = useStore((s) => s.addToast)

  const { mutateAsync: updateArticle } = useUpdateArticle(article.id)
  const { mutateAsync: deleteArticle } = useDeleteArticle()

  const statusStyle   = STATUS_STYLES[article.status] ?? STATUS_STYLES['unread']
  const priorityColor = PRIORITY_COLORS[article.priority] ?? 'var(--text-tertiary)'

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await updateArticle({ status: 'archived' })
      addToast('Archived')
    } catch {
      addToast('Failed to archive', 'error')
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false) }}
      style={{
        display: 'grid',
        gridTemplateColumns: ROW_COLUMNS,
        alignItems: 'center',
        padding: '0 8px',
        borderBottom: '1px solid var(--border-subtle)',
        background: isSelected
          ? 'var(--accent-muted)'
          : isHovered
          ? 'var(--bg-hover)'
          : 'transparent',
        transition: 'background 0.1s',
        minHeight: 42,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {/* Checkbox */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleSelect(article.id) }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(article.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${article.title}`}
          style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
      </div>

      {/* Title + domain */}
      <div style={{ minWidth: 0, paddingRight: 8 }}>
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: article.status === 'archived' ? 'var(--text-tertiary)' : 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}>
          {article.title}
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-tertiary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)', marginTop: 1,
        }}>
          {getDomain(article.url)}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
        {(article.tags ?? []).slice(0, 2).map((tag) => (
          <span key={tag} style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 3,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)',
          }}>
            {tag}
          </span>
        ))}
        {(article.tags ?? []).length > 2 && (
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            +{(article.tags ?? []).length - 2}
          </span>
        )}
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: 10, padding: '2px 7px', borderRadius: 3,
        background: statusStyle.bg, color: statusStyle.color,
        whiteSpace: 'nowrap', fontWeight: 500,
        letterSpacing: '0.02em', textTransform: 'uppercase',
        textAlign: 'center', display: 'inline-block',
      }}>
        {statusStyle.label}
      </span>

      {/* Priority */}
      <span style={{
        fontSize: 11, fontFamily: 'var(--font-mono)', color: priorityColor,
        fontWeight: 500, textAlign: 'center',
      }}>
        P{article.priority}
      </span>

      {/* Date */}
      <span style={{
        fontSize: 11, color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
        textAlign: 'right',
      }}>
        {relativeDate(article.created_at)}
      </span>

      {/* Actions — only show on hover */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        justifyContent: 'flex-end',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.08s',
      }}>
        <IconBtn title="Edit" onClick={(e) => { e.stopPropagation(); e.preventDefault(); openEditDialog(article.id) }}>
          <Pencil size={13} />
        </IconBtn>
        <IconBtn title="Archive" onClick={handleArchive}>
          <Archive size={13} />
        </IconBtn>
        <div style={{ position: 'relative' }}>
          <IconBtn title="More" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpen(!menuOpen) }}>
            <MoreHorizontal size={13} />
          </IconBtn>
          {menuOpen && (
            <div
              onClick={(e) => { e.stopPropagation(); e.preventDefault() }}
              style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                zIndex: 100, overflow: 'hidden', minWidth: 140,
              }}
            >
              <MenuAction icon={<Trash2 size={12} />} label="Delete" danger onClick={handleDelete} />
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

function IconBtn({ children, title, onClick }: {
  children: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button" title={title} onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, border: 'none', background: 'transparent',
        borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)',
        cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-active)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-tertiary)'
      }}
    >
      {children}
    </button>
  )
}

function MenuAction({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean
}) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '8px 12px', border: 'none',
        background: 'transparent',
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)', textAlign: 'left',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? 'var(--danger-bg)' : 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {icon} {label}
    </button>
  )
}
