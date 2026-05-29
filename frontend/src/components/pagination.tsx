import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'

interface PaginationProps {
  total: number
}

export function Pagination({ total }: PaginationProps) {
  const page  = useStore((s) => s.page)
  const limit = useStore((s) => s.limit)
  const setPage = useStore((s) => s.setPage)

  const canBack = page > 0
  const canNext = total === limit // if we got a full page, there might be more

  if (!canBack && !canNext) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 4px',
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        Page {page + 1} · {total} results
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <PageBtn onClick={() => setPage(page - 1)} disabled={!canBack} title="Previous page">
          <ChevronLeft size={14} />
          Prev
        </PageBtn>
        <PageBtn onClick={() => setPage(page + 1)} disabled={!canNext} title="Next page">
          Next
          <ChevronRight size={14} />
        </PageBtn>
      </div>
    </div>
  )
}

function PageBtn({
  children, onClick, disabled, title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 10px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        color: disabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        fontFamily: 'var(--font-sans)',
        transition: 'border-color 0.1s, color 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--border-strong)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.color = disabled ? 'var(--text-disabled)' : 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}
