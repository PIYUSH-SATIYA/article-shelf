import { create } from 'zustand'
import type { ListParams } from '@/api/types'

type SortField = NonNullable<ListParams['sort_by']>
type SortOrder = NonNullable<ListParams['order']>

const getInitialFromURL = () => {
  if (typeof window === 'undefined') return {}
  const q = new URLSearchParams(window.location.search)
  const sortBy = q.get('sort_by')
  const order = q.get('order')
  const limit = Number(q.get('limit'))
  const page = Number(q.get('page'))
  const SORT_FIELDS = ['created_at', 'updated_at', 'priority', 'title']
  return {
    search:   q.get('search') ?? '',
    status:   q.get('status') ?? '',
    priority: q.get('priority') ?? '',
    tag:      q.get('tag') ?? '',
    sortBy:   (SORT_FIELDS.includes(sortBy ?? '') ? sortBy : 'priority') as SortField,
    order:    (['asc', 'desc'].includes(order ?? '') ? order : 'asc') as SortOrder,
    limit:    Number.isFinite(limit) && limit > 0 ? limit : 25,
    page:     Number.isFinite(page) && page >= 0 ? page : 0,
  }
}

const initial = getInitialFromURL()

export type DialogMode = 'create' | 'edit' | null

export type UIStore = {
  // Selection
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleSelectAll: (ids: number[]) => void
  clearSelection: () => void

  // Article dialog (centered, create + edit)
  dialogMode: DialogMode
  editingArticleId: number | null
  initialUrl: string
  openCreateDialog: (url?: string) => void
  openEditDialog: (id: number) => void
  closeDialog: () => void

  // Command palette
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void

  // Filters
  search: string
  status: string
  priority: string
  tag: string
  sortBy: SortField
  order: SortOrder
  limit: number
  page: number

  setSearch:   (v: string) => void
  setStatus:   (v: string) => void
  setPriority: (v: string) => void
  setTag:      (v: string) => void
  setSortBy:   (v: SortField) => void
  setOrder:    (v: SortOrder) => void
  setLimit:    (v: number) => void
  setPage:     (v: number) => void
  resetFilters: () => void

  // Toast
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' }>
  addToast: (message: string, type?: 'success' | 'error') => void
  removeToast: (id: string) => void
}

export const useStore = create<UIStore>((set) => ({
  // Selection
  selectedIds: new Set(),
  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { selectedIds: next }
    }),
  toggleSelectAll: (ids) =>
    set((s) => {
      const allSelected = ids.every((id) => s.selectedIds.has(id))
      return { selectedIds: allSelected ? new Set() : new Set(ids) }
    }),
  clearSelection: () => set({ selectedIds: new Set() }),

  // Article dialog
  dialogMode: null,
  editingArticleId: null,
  initialUrl: '',
  openCreateDialog: (url = '') => set({ dialogMode: 'create', editingArticleId: null, initialUrl: url }),
  openEditDialog: (id) => set({ dialogMode: 'edit', editingArticleId: id, initialUrl: '' }),
  closeDialog: () => set({ dialogMode: null, editingArticleId: null, initialUrl: '' }),

  // Command palette
  paletteOpen: false,
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),

  // Filters
  search:   initial.search   ?? '',
  status:   initial.status   ?? '',
  priority: initial.priority ?? '',
  tag:      initial.tag      ?? '',
  sortBy:   initial.sortBy   ?? 'priority',
  order:    initial.order    ?? 'asc',
  limit:    initial.limit    ?? 25,
  page:     initial.page     ?? 0,

  setSearch:   (v) => set({ search: v, page: 0 }),
  setStatus:   (v) => set({ status: v, page: 0 }),
  setPriority: (v) => set({ priority: v, page: 0 }),
  setTag:      (v) => set({ tag: v, page: 0 }),
  setSortBy:   (v) => set({ sortBy: v }),
  setOrder:    (v) => set({ order: v }),
  setLimit:    (v) => set({ limit: v, page: 0 }),
  setPage:     (v) => set({ page: v }),
  resetFilters: () => set({ search: '', status: '', priority: '', tag: '', page: 0 }),

  // Toast
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3200)
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
