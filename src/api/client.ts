/*
 * HTTP client for the Qaryati API.
 *
 * The browser calls the same origin under `/api/v1`: the Vite dev server (vite.config.ts) and nginx in
 * the frontend container (nginx.conf) forward `/api` to the backend, so there is no CORS setup and no
 * hard-coded host. `VITE_API_URL` overrides the base, e.g. to call a backend on another host.
 */

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1'

/**
 * Static preview build (`VITE_STATIC_PREVIEW=true`, used for the Netlify link): there is no backend, so
 * public GET requests are answered from a snapshot of the API taken with `npm run snapshot`, and every
 * write or sign-in is refused. Vite drops this code and the snapshot from every other build.
 */
export const STATIC_PREVIEW = import.meta.env.VITE_STATIC_PREVIEW === 'true'
let snapshot: Promise<Record<string, unknown>> | null = null

async function staticAnswer<T>(path: string, method: string): Promise<T> {
  if (method !== 'GET' || path.startsWith('/auth/')) {
    throw new ApiError(403, 'READ_ONLY_PREVIEW', 'This online copy is read-only. Signing in and editing work when the full platform runs with its server.')
  }
  snapshot ??= import('./static-snapshot.json?raw').then((m) => JSON.parse(m.default) as Record<string, unknown>)
  const data = (await snapshot)[path]
  if (data === undefined) throw new ApiError(404, 'NOT_IN_PREVIEW', 'This page is not part of the online copy.')
  return structuredClone(data) as T
}

/** One field-level validation message, as the API's error format sends it. */
export interface ApiErrorDetail {
  field: string
  messages: string[]
}

/** An error answer from the API (single error format: statusCode, error, message, details). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetail[]

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** The message to show a user: the first field message when there is one, otherwise the API message. */
  get userMessage(): string {
    const first = this.details[0]
    return first ? `${first.field}: ${first.messages[0]}` : this.message
  }
}

let accessToken: string | null = null
let onUnauthorized: (() => void) | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
}
/** Called when a signed-in request gets 401 (expired or revoked token), so the app can sign out. */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** Skip every cache on the way (browser and the API's own cache), e.g. right after an edit. */
  fresh?: boolean
  signal?: AbortSignal
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (import.meta.env.VITE_STATIC_PREVIEW === 'true') return staticAnswer<T>(path, options.method ?? 'GET')
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (options.fresh) headers['Cache-Control'] = 'no-cache'

  let res: Response
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: options.fresh ? 'no-store' : 'default',
      signal: options.signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', 'The server cannot be reached. Check that the backend is running.')
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? safeJson(text) : undefined

  if (!res.ok) {
    const body = (data ?? {}) as { error?: string; message?: string | string[]; details?: ApiErrorDetail[] }
    if (res.status === 401 && accessToken) onUnauthorized?.()
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message
    throw new ApiError(res.status, body.error ?? `HTTP_${res.status}`, message ?? res.statusText, body.details ?? [])
  }
  return data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Reads every page of a paginated list (`{ data, meta }` or the villages list's `{ data, pagination }`). */
export async function fetchAll<T>(path: string, query: RequestOptions['query'] = {}, maxItems = 2000): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; items.length < maxItems; page++) {
    const res = await api<{ data: T[]; meta?: { totalPages: number }; pagination?: { totalPages: number } }>(path, {
      query: { ...query, page, limit: 100 },
    })
    items.push(...res.data)
    const totalPages = res.meta?.totalPages ?? res.pagination?.totalPages ?? 1
    if (page >= totalPages || res.data.length === 0) break
  }
  return items
}

/** Runs async work over a list with at most `limit` calls in flight. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

/** A message to show for a failed request; anything that is not an ApiError gets a generic one. */
export const errorMessage = (error: unknown): string =>
  error instanceof ApiError ? error.userMessage : error instanceof Error ? error.message : 'Unexpected error'
