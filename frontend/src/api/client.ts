export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

const DEFAULT_BASE_URL = "http://localhost:8000"

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  query?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query)
    const headers: Record<string, string> = {
      ...(options.headers ?? {}),
    }

    let body: BodyInit | undefined

    if (options.body instanceof FormData) {
      body = options.body
    } else if (options.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json"
      body = JSON.stringify(options.body)
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: options.signal,
    })

    if (!response.ok) {
      const detail = await this.readError(response)
      throw new ApiError(response.status, detail)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T
    }

    return (await response.text()) as T
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined | null>
  ) {
    const url = new URL(path, this.baseUrl)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue
        url.searchParams.set(key, String(value))
      }
    }
    return url.toString()
  }

  private async readError(response: Response) {
    try {
      const data = await response.json()
      if (data && typeof data.detail === "string") {
        return data.detail
      }
    } catch {
      // ignore json parse errors
    }

    return response.statusText || "Request failed"
  }
}

export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL
)
