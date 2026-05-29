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
  const dialogMode = useStore((s) => s.dialogMode)
  const editingId  = useStore((s) => s.editingArticleId)
  const closeDialog = useStore((s) => s.closeDialog)
  const addToast   = useStore((s) => s.addToast)

  const isCreate = dialogMode === 'create'
  const isEdit   = dialogMode === 'edit'

  const { data: article } = useArticle(isEdit ? editingId : null)
  const { mutateAsync: createArticle, isPending: isCreating } = useCreateArticle()
  const { mutateAsync: updateArticle, isPending: isSaving } = useUpdateArticle(editingId ?? 0)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [dirty, setDirty] = useState(false)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Populate form when article loads (edit mode)
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

  // Reset form on create mode open
  useEffect(() => {
    if (isCreate) {
      setForm(EMPTY)
      setDirty(false)
      setTimeout(() => urlInputRef.current?.focus(), 80)
    }
  }, [isCreate])

  // Auto-focus title when editing
  useEffect(() => {
    if (isEdit && article) {
      setTimeout(() => titleInputRef.current?.focus(), 80)
    }
  }, [isEdit, article])

  // Keyboard: Esc to close
  useEffect(() => {
    if (!dialogMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDialog()
      }
      // Ctrl/⌘+Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
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

  const isPending = isCreating || isSaving
  const canSubmit = isCreate ? form.url.trim().length > 0 : dirty

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDialog}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 80,
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(620px, 94vw)',
        maxHeight: '90vh',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            {isCreate ? 'Add Article' : 'Edit Article'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEdit && editingId && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                #{editingId}
              </span>
            )}
            <button
              type="button"
              onClick={closeDialog}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: 'none',
                color: 'var(--text-tertiary)', cursor: 'pointer',
              }}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{
          overflowY: 'auto', flex: 1,
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* URL */}
          <Field label="URL" required={isCreate}>
            <input
              ref={urlInputRef}
              type="url"
              value={form.url}
              onChange={(e) => setField('url', e.target.value)}
              placeholder="https://…"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          {/* Title */}
          <Field label="Title" hint={isCreate ? '(auto-fills from URL if blank)' : undefined}>
            <input
              ref={titleInputRef}
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={isCreate && form.url ? guessTitle(form.url) : 'Article title'}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          {/* Status + Priority — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) => setField('priority', Number(e.target.value))}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>P{p}{p === 1 ? ' — Urgent' : p === 5 ? ' — Low' : ''}</option>)}
              </select>
            </Field>
          </div>

          {/* Tags */}
          <Field label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Tag size={10} /> Tags</span>}>
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 8px',
              display: 'flex', flexWrap: 'wrap', gap: 5,
              minHeight: 36,
            }}>
              {form.tags.map((t) => (
                <span key={t} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '2px 6px',
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent)',
                  borderRadius: 3,
                  fontSize: 11, color: 'var(--accent-text)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {t}
                  <button
                    type="button" onClick={() => removeTag(t)}
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
                  color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none',
                }}
              />
            </div>
          </Field>

          {/* Reason */}
          <Field label="Why save this?">
            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setField('reason', e.target.value)}
              placeholder="What made you want to save this?"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Key takeaways, actions, quotes…"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          {/* Source */}
          <Field label="Source">
            <input
              type="text"
              value={form.source}
              onChange={(e) => setField('source', e.target.value)}
              placeholder="newsletter, blog, tweet, HN…"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          {/* Metadata (edit only) */}
          {isEdit && article && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              padding: '10px', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            }}>
              <Meta label="Created" value={new Date(article.created_at).toLocaleString()} />
              <Meta label="Updated" value={new Date(article.updated_at).toLocaleString()} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 8, alignItems: 'center',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 20px',
              background: canSubmit ? 'var(--accent)' : 'var(--bg-elevated)',
              border: `1px solid ${canSubmit ? 'var(--accent)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              color: canSubmit ? '#fff' : 'var(--text-tertiary)',
              fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)',
              cursor: canSubmit && !isPending ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            <Save size={13} />
            {isPending ? 'Saving…' : isCreate ? 'Save Article' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={closeDialog}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 3, padding: '1px 5px', fontSize: 10,
              fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
            }}>⌘↵</kbd>
            save
          </span>
        </div>
      </div>
    </>
  )
}

/* ─── Helpers ────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  resize: 'vertical',
  transition: 'border-color 0.15s',
}

function focusStyle(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = 'var(--border-focus)'
}
function blurStyle(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = 'var(--border-default)'
}

function Field({ label, hint, required, children }: {
  label: React.ReactNode; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--text-tertiary)',
        marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {label}
        {required && <span style={{ color: 'var(--danger)', fontSize: 10 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', fontSize: 10 }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', margin: 0 }}>
        {value}
      </p>
    </div>
  )
}
