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

  const setSearch    = useStore((s) => s.setSearch)
  const setStatus    = useStore((s) => s.setStatus)
  const setPriority  = useStore((s) => s.setPriority)
  const setTag       = useStore((s) => s.setTag)
  const setSortBy    = useStore((s) => s.setSortBy)
  const setOrder     = useStore((s) => s.setOrder)
  const setLimit     = useStore((s) => s.setLimit)
  const resetFilters = useStore((s) => s.resetFilters)

  const hasFilters = search || status || priority || tag

  return (
    <div className="filter-bar">
      {/* Search */}
      <div className="filter-search-wrap" style={{ flex: '1 1 180px', maxWidth: 320 }}>
        <Search size={13} className="search-icon" />
        <input
          ref={searchRef}
          id="filter-search"
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="filter-clear-btn"
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

      {/* Active tag pill */}
      {tag && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 8px 4px 10px',
          background: 'var(--accent-muted)',
          border: '1px solid var(--accent-muted-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12, color: 'var(--accent-text)',
        }}>
          <span>#{tag}</span>
          <button
            type="button"
            onClick={() => setTag('')}
            className="filter-clear-btn"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <div className="filter-spacer" />

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
        className="order-btn"
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

      {/* Reset */}
      {hasFilters && (
        <button type="button" onClick={resetFilters} className="filter-reset-btn">
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
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`compact-select ${value ? 'active' : ''}`}
      title={placeholder}
    >
      {children}
    </select>
  )
}
