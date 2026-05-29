import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { articlesApi } from '@/api/articles'
import type { ArticleCreateInput, ArticleUpdateInput, ListParams } from '@/api/types'

// ─── Keys ──────────────────────────────────────────────────────
export const articleKeys = {
  all:    () => ['articles'] as const,
  list:   (params: ListParams) => ['articles', 'list', params] as const,
  detail: (id: number) => ['articles', 'detail', id] as const,
}

// ─── Queries ───────────────────────────────────────────────────
export function useArticles(params: ListParams) {
  return useQuery({
    queryKey: articleKeys.list(params),
    queryFn:  ({ signal }) => articlesApi.list(params, signal),
    placeholderData: (prev) => prev, // keep previous data while loading (no flash)
    staleTime: 1000 * 30, // 30s before background refetch
  })
}

export function useArticle(id: number | null) {
  return useQuery({
    queryKey: articleKeys.detail(id!),
    queryFn:  ({ signal }) => articlesApi.get(id!, signal),
    enabled:  id !== null,
    staleTime: 1000 * 60,
  })
}

// ─── Mutations ─────────────────────────────────────────────────
export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ArticleCreateInput) => articlesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.all() })
    },
  })
}

export function useUpdateArticle(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ArticleUpdateInput) => articlesApi.update(id, payload),
    onSuccess: (updated) => {
      // Update the single article in cache immediately
      qc.setQueryData(articleKeys.detail(id), updated)
      // Invalidate list queries so they refetch
      qc.invalidateQueries({ queryKey: articleKeys.all() })
    },
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => articlesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.all() })
    },
  })
}

export function useBulkDelete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => articlesApi.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.all() })
    },
  })
}

export function useBulkArchive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => articlesApi.bulkArchive({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.all() })
    },
  })
}

export function useBulkStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) =>
      articlesApi.bulkStatus({ ids, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.all() })
    },
  })
}

export function useImportCsv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => articlesApi.importCsv(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.all() })
    },
  })
}
