/**
 * If the input doesn't start with a protocol, prepend https://.
 * This lets users type "example.com/path" without the https:// prefix.
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  // Already has a protocol
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  // Has another protocol (ftp, etc.)
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed
  // Bare domain — prepend https://
  return `https://${trimmed}`
}

/**
 * Extract a human-readable title from a URL (just the hostname).
 */
export function guessTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.slice(0, 80)
  }
}
