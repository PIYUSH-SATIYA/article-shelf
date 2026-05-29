import { apiClient } from "./client"
import type {
  Article,
  ArticleCreateInput,
  ArticleUpdateInput,
  BulkDeleteResult,
  BulkIdsInput,
  BulkStatusInput,
  BulkUpdateResult,
  CsvImportResult,
  ListParams,
} from "./types"

export const articlesApi = {
  list(params: ListParams, signal?: AbortSignal) {
    return apiClient.request<Article[]>("/articles", {
      query: params,
      signal,
    })
  },

  get(articleId: number, signal?: AbortSignal) {
    return apiClient.request<Article>(`/articles/${articleId}`, { signal })
  },

  create(payload: ArticleCreateInput) {
    return apiClient.request<Article>("/articles", {
      method: "POST",
      body: payload,
    })
  },

  update(articleId: number, payload: ArticleUpdateInput) {
    return apiClient.request<Article>(`/articles/${articleId}`, {
      method: "PATCH",
      body: payload,
    })
  },

  remove(articleId: number) {
    return apiClient.request<{ message: string }>(`/articles/${articleId}`, {
      method: "DELETE",
    })
  },

  bulkDelete(payload: BulkIdsInput) {
    return apiClient.request<BulkDeleteResult>("/articles/bulk/delete", {
      method: "POST",
      body: payload,
    })
  },

  bulkArchive(payload: BulkIdsInput) {
    return apiClient.request<BulkUpdateResult>("/articles/bulk/archive", {
      method: "POST",
      body: payload,
    })
  },

  bulkStatus(payload: BulkStatusInput) {
    return apiClient.request<BulkUpdateResult>("/articles/bulk/status", {
      method: "PATCH",
      body: payload,
    })
  },

  exportCsv() {
    return apiClient.request<string>("/articles/export/csv")
  },

  importCsv(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiClient.request<CsvImportResult>("/articles/import/csv", {
      method: "POST",
      body: formData,
    })
  },
}
