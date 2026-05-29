export type Article = {
  id: number
  title: string
  url: string
  reason: string | null
  notes: string | null
  tags: string[] | null
  source: string | null
  status: string
  priority: number
  created_at: string
  updated_at: string
}

export type ArticleCreateInput = {
  title: string
  url: string
  reason?: string | null
  notes?: string | null
  tags?: string[] | null
  source?: string | null
  status?: string
  priority?: number
}

export type ArticleUpdateInput = {
  title?: string | null
  url?: string | null
  reason?: string | null
  notes?: string | null
  tags?: string[] | null
  source?: string | null
  status?: string | null
  priority?: number | null
}

export type BulkIdsInput = {
  ids: number[]
}

export type BulkStatusInput = {
  ids: number[]
  status: string
}

export type BulkDeleteResult = {
  deleted_count: number
}

export type BulkUpdateResult = {
  updated_count: number
}

export type CsvFailedRow = {
  row_number: number
  reason: string
}

export type CsvImportResult = {
  imported_count: number
  skipped_count: number
  failed_rows: CsvFailedRow[]
}

export type ListParams = {
  status?: string
  priority?: number
  tag?: string
  search?: string
  limit?: number
  offset?: number
  sort_by?: "created_at" | "updated_at" | "priority" | "title"
  order?: "asc" | "desc"
}
