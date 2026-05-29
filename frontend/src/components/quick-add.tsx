import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useCreateArticle } from '@/hooks/use-articles'
import { useStore } from '@/store'

function guessTitle(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url.slice(0, 80) }
}

export function QuickAdd() {
  const urlRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const addToast = useStore((s) => s.addToast)
  const openCreateDialog = useStore((s) => s.openCreateDialog)

  const { mutateAsync: createArticle, isPending } = useCreateArticle()

  // Fast capture: URL only, press Enter → saves to inbox instantly
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return

    try {
      await createArticle({
        url: trimmedUrl,
        title: guessTitle(trimmedUrl),
        status: 'inbox',
        priority: 3,
      })
      setUrl('')
      addToast('Saved to inbox')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      addToast(msg, 'error')
    }
  }

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center',
    }}>
      {/* Fast URL capture */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '6px 8px',
        }}
      >
        <input
          ref={urlRef}
          id="quick-add-url"
          type="url"
          placeholder="Paste URL to quick-save…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 12px',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        />
        <button
          type="submit"
          disabled={!url.trim() || isPending}
          title="Quick-save to inbox (Enter)"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '7px 12px',
            background: url.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
            border: '1px solid',
            borderColor: url.trim() ? 'var(--accent)' : 'var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: url.trim() ? '#fff' : 'var(--text-tertiary)',
            fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)',
            cursor: url.trim() && !isPending ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, border-color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {isPending ? 'Saving…' : '↵ Save'}
        </button>
      </form>

      {/* Full form "New Article" button */}
      <button
        type="button"
        onClick={openCreateDialog}
        title="Add article with details (N)"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px',
          background: 'var(--accent)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          color: '#fff',
          fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)' }}
      >
        <Plus size={14} />
        New
      </button>
    </div>
  )
}
