import { Save, Tag, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useArticle, useCreateArticle, useUpdateArticle } from '@/hooks/use-articles'
import { useStore } from '@/store'
import type { ArticleCreateInput, ArticleUpdateInput } from '@/api/types'

const STATUS_OPTIONS = ['inbox', 'unread', 'reading', 'done', 'archived']
const PRIORITY_OPTIONS = [1, 2, 3, 4, 5]

const EMPTY: FormState = {
  url: '', title: '', reason: '', notes: '',
  source: '', status: 'inbox', priority: 3, tags: [], tagInput: '',
}

type FormState = {
  url: string
  title: string
  reason: string
  notes: string
  source: string
  status: string
  priority: number
  tags: string[]
  tagInput: string
}

export function ArticleDialog() {
  const dialogMode  = useStore((s) => s.dialogMode)
  const editingId   = useStore((s) => s.editingArticleId)
  const closeDialog = useStore((s) => s.closeDialog)
  const addToast    = useStore((s) => s.addToast)

  const isCreate = dialogMode === 'create'
  const isEdit   = dialogMode === 'edit'

  const { data: article } = useArticle(isEdit ? editingId : null)
  const { mutateAsync: createArticle, isPending: isCreating } = useCreateArticle()
  const { mutateAsync: updateArticle, isPending: isSaving } = useUpdateArticle(editingId ?? 0)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [dirty, setDirty] = useState(false)
  const urlInputRef   = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEdit && article) {
      setForm({
        url: article.url,
        title: article.title,
        reason: article.reason ?? '',
        notes: article.notes ?? '',
        source: article.source ?? '',
        status: article.status,
        priority: article.priority,
        tags: article.tags ?? [],
        tagInput: '',
      })
      setDirty(false)
    }
  }, [isEdit, article])

  useEffect(() => {
    if (isCreate) {
      setForm(EMPTY)
      setDirty(false)
      setTimeout(() => urlInputRef.current?.focus(), 80)
    }
  }, [isCreate])

  useEffect(() => {
    if (isEdit && article) {
      setTimeout(() => titleInputRef.current?.focus(), 80)
    }
  }, [isEdit, article])

  useEffect(() => {
    if (!dialogMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeDialog() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dialogMode, form, dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!dialogMode) return null

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const addTag = () => {
    const t = form.tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t], tagInput: '' }))
      setDirty(true)
    } else {
      setForm((prev) => ({ ...prev, tagInput: '' }))
    }
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
    setDirty(true)
  }

  function guessTitle(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, '') }
    catch { return url.slice(0, 80) }
  }

  const handleSubmit = async () => {
    if (isCreate) {
      const trimmedUrl = form.url.trim()
      if (!trimmedUrl) { addToast('URL is required', 'error'); return }
      const finalTitle = form.title.trim() || guessTitle(trimmedUrl)
      const payload: ArticleCreateInput = {
        url: trimmedUrl,
        title: finalTitle,
        reason:   form.reason.trim()  || undefined,
        notes:    form.notes.trim()   || undefined,
        source:   form.source.trim()  || undefined,
        status:   form.status,
        priority: form.priority,
        tags:     form.tags.length > 0 ? form.tags : undefined,
      }
      try {
        await createArticle(payload)
        addToast('Article saved')
        closeDialog()
      } catch (err: unknown) {
        addToast(err instanceof Error ? err.message : 'Failed to save', 'error')
      }
    } else if (isEdit && editingId) {
      const payload: ArticleUpdateInput = {
        title:    form.title.trim()   || undefined,
        url:      form.url.trim()     || undefined,
        reason:   form.reason.trim()  || null,
        notes:    form.notes.trim()   || null,
        source:   form.source.trim()  || null,
        status:   form.status,
        priority: form.priority,
        tags:     form.tags.length > 0 ? form.tags : null,
      }
      try {
        await updateArticle(payload)
        addToast('Saved')
        closeDialog()
      } catch (err: unknown) {
        addToast(err instanceof Error ? err.message : 'Failed to save', 'error')
      }
    }
  }

  const isPending  = isCreating || isSaving
  const canSubmit  = isCreate ? form.url.trim().length > 0 : dirty

  return (
    <div className="dialog-backdrop" onClick={closeDialog}>
      <div
        className="dialog-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isCreate ? 'Add Article' : 'Edit Article'}
      >
        {/* Header */}
        <div className="dialog-header">
          <h2 className="dialog-title">{isCreate ? 'Add Article' : 'Edit Article'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEdit && editingId && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                #{editingId}
              </span>
            )}
            <button
              type="button"
              onClick={closeDialog}
              className="dialog-close-btn"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="dialog-body">
          {/* URL */}
          <div className="field-group">
            <label className="field-label">
              URL {isCreate && <span style={{ color: 'var(--danger)', fontSize: 10 }}>*</span>}
            </label>
            <input
              ref={urlInputRef}
              type="url"
              value={form.url}
              onChange={(e) => setField('url', e.target.value)}
              placeholder="https://…"
              className="field-input"
            />
          </div>

          {/* Title */}
          <div className="field-group">
            <label className="field-label">
              Title
              {isCreate && (
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {' '}(auto-fills from URL if blank)
                </span>
              )}
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={isCreate && form.url ? guessTitle(form.url) : 'Article title'}
              className="field-input"
            />
          </div>

          {/* Status + Priority */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="field-select"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setField('priority', Number(e.target.value))}
                className="field-select"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>P{p}{p === 1 ? ' — Urgent' : p === 5 ? ' — Low' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="field-group">
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Tag size={10} /> Tags
            </label>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              display: 'flex', flexWrap: 'wrap', gap: 5,
              minHeight: 40,
              transition: 'border-color var(--transition-base)',
            }}>
              {form.tags.map((t) => (
                <span key={t} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '2px 7px',
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-muted-border)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 11, color: 'var(--accent-text)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
                  ><X size={10} /></button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                value={form.tagInput}
                placeholder={form.tags.length === 0 ? 'Type + Enter to add tags…' : ''}
                onChange={(e) => setForm((p) => ({ ...p, tagInput: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
                  if (e.key === 'Backspace' && !form.tagInput && form.tags.length > 0) {
                    setForm((p) => ({ ...p, tags: p.tags.slice(0, -1) }))
                    setDirty(true)
                  }
                }}
                style={{
                  flex: 1, minWidth: 80, border: 'none', background: 'transparent',
                  color: 'var(--text-primary)', fontSize: 12,
                  fontFamily: 'var(--font-mono)', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="field-group">
            <label className="field-label">Why save this?</label>
            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setField('reason', e.target.value)}
              placeholder="What made you want to save this?"
              className="field-input"
            />
          </div>

          {/* Notes */}
          <div className="field-group">
            <label className="field-label">Notes</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Key takeaways, actions, quotes…"
              className="field-input"
            />
          </div>

          {/* Source */}
          <div className="field-group">
            <label className="field-label">Source</label>
            <input
              type="text"
              value={form.source}
              onChange={(e) => setField('source', e.target.value)}
              placeholder="newsletter, blog, tweet, HN…"
              className="field-input"
            />
          </div>

          {/* Metadata (edit only) */}
          {isEdit && article && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              padding: '10px 12px', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            }}>
              <div>
                <p className="field-label" style={{ marginBottom: 3 }}>Created</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(article.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="field-label" style={{ marginBottom: 3 }}>Updated</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(article.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dialog-footer">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className={`btn btn-primary`}
            style={{ opacity: (!canSubmit || isPending) ? 0.55 : 1, cursor: (!canSubmit || isPending) ? 'not-allowed' : 'pointer' }}
          >
            <Save size={13} />
            {isPending ? 'Saving…' : isCreate ? 'Save Article' : 'Save Changes'}
          </button>
          <button type="button" onClick={closeDialog} className="btn btn-ghost">
            Cancel
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd>⌘↵</kbd> save
          </span>
        </div>
      </div>
    </div>
  )
}
