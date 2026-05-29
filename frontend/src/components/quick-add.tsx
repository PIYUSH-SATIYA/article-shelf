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

  const hasUrl = Boolean(url.trim())

  return (
    <div className="quick-add-wrap">
      {/* Fast URL capture */}
      <form onSubmit={handleSubmit} className="quick-add-form">
        <input
          ref={urlRef}
          id="quick-add-url"
          type="url"
          placeholder="Paste a URL to quick-save to inbox…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="quick-add-input"
        />
        <button
          type="submit"
          disabled={!hasUrl || isPending}
          title="Quick-save to inbox (Enter)"
          className={`btn-save ${hasUrl ? 'active' : ''}`}
        >
          {isPending ? 'Saving…' : '↵ Save'}
        </button>
      </form>

      {/* Full form "New Article" button */}
      <button
        type="button"
        onClick={openCreateDialog}
        title="Add article with details (N)"
        className="btn-new"
      >
        <Plus size={15} />
        New
      </button>
    </div>
  )
}
