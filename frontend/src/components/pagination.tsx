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
  const canNext = total === limit

  if (!canBack && !canNext) return null

  return (
    <div className="pagination-wrap">
      <span className="pagination-info">
        Page {page + 1} · {total} results
      </span>
      <div className="pagination-btns">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={!canBack}
          title="Previous page"
          className="page-btn"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={!canNext}
          title="Next page"
          className="page-btn"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
