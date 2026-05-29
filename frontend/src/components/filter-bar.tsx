import { ArrowDown, ArrowUp, Search, X } from 'lucide-react'
import { useRef } from 'react'
import { useStore } from '@/store'
import type { ListParams } from '@/api/types'

const STATUS_OPTIONS = ['inbox', 'unread', 'reading', 'done', 'archived']
const PRIORITY_OPTIONS = [1, 2, 3, 4, 5]
const SORT_OPTIONS: { value: NonNullable<ListParams['sort_by']>; label: string }[] = [
  { value: 'created_at',  label: 'Date added' },
  { value: 'updated_at',  label: 'Last updated' },
  { value: 'priority',    label: 'Priority' },
  { value: 'title',       label: 'Title' },
]
const PAGE_SIZES = [10, 25, 50]

export function FilterBar() {
  const searchRef = useRef<HTMLInputElement>(null)

  const search    = useStore((s) => s.search)
  const status    = useStore((s) => s.status)
  const priority  = useStore((s) => s.priority)
  const tag       = useStore((s) => s.tag)
  const sortBy    = useStore((s) => s.sortBy)
  const order     = useStore((s) => s.order)
  const limit     = useStore((s) => s.limit)

  const setSearch   = useStore((s) => s.setSearch)
  const setStatus   = useStore((s) => s.setStatus)
  const setPriority = useStore((s) => s.setPriority)
  const setTag      = useStore((s) => s.setTag)
  const setSortBy   = useStore((s) => s.setSortBy)
  const setOrder    = useStore((s) => s.setOrder)
  const setLimit    = useStore((s) => s.setLimit)
  const resetFilters = useStore((s) => s.resetFilters)

  const hasFilters = search || status || priority || tag

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160, maxWidth: 340 }}>
        <Search
          size={13}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={searchRef}
          id="filter-search"
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px 6px 30px',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', display: 'flex', padding: 2,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <CompactSelect
        id="filter-status"
        value={status}
        onChange={setStatus}
        placeholder="Status"
      >
        <option value="">All status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </CompactSelect>

      {/* Priority filter */}
      <CompactSelect
        id="filter-priority"
        value={priority}
        onChange={setPriority}
        placeholder="Priority"
      >
        <option value="">All priority</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={String(p)}>P{p}</option>
        ))}
      </CompactSelect>

      {/* Tag filter */}
      {tag && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 8px 4px 10px',
          background: 'var(--accent-muted)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12, color: 'var(--accent-text)',
        }}>
          <span>#{tag}</span>
          <button
            type="button"
            onClick={() => setTag('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sort */}
      <CompactSelect
        id="filter-sort"
        value={sortBy}
        onChange={(v) => setSortBy(v as NonNullable<ListParams['sort_by']>)}
        placeholder="Sort"
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </CompactSelect>

      {/* Order toggle */}
      <button
        type="button"
        onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
        title={order === 'desc' ? 'Newest first — click for oldest' : 'Oldest first — click for newest'}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 10px',
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-strong)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        {order === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
        {order === 'desc' ? 'Newest' : 'Oldest'}
      </button>

      {/* Page size */}
      <CompactSelect
        id="filter-pagesize"
        value={String(limit)}
        onChange={(v) => setLimit(Number(v))}
        placeholder="Per page"
      >
        {PAGE_SIZES.map((s) => (
          <option key={s} value={String(s)}>{s} / page</option>
        ))}
      </CompactSelect>

      {/* Reset filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={resetFilters}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px',
            color: 'var(--text-tertiary)',
            fontSize: 12,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
          }}
        >
          <X size={11} /> Clear
        </button>
      )}
    </div>
  )
}

function CompactSelect({
  id, value, onChange, placeholder, children,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  children: React.ReactNode
}) {
  const hasValue = Boolean(value)
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: hasValue ? 'var(--accent-muted)' : 'var(--bg-surface)',
        border: `1px solid ${hasValue ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '6px 10px',
        color: hasValue ? 'var(--accent-text)' : 'var(--text-secondary)',
        fontSize: 12,
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        paddingRight: 24,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238b8fa8'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
      title={placeholder}
    >
      {children}
    </select>
  )
}
