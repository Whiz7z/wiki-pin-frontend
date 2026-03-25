export const WIKI_PIN_ANCHOR_SESSION_KEY = 'wikiPinAnchorSession'

export type WikiPinAnchorSession = {
  pinId: string
  mode: 'refresh' | 'reanchor'
  articleUrl: string
}

export function parseAnchorSession(raw: unknown): WikiPinAnchorSession | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const pinId = typeof o.pinId === 'string' ? o.pinId : null
  const mode = o.mode === 'refresh' || o.mode === 'reanchor' ? o.mode : null
  const articleUrl = typeof o.articleUrl === 'string' ? o.articleUrl : null
  if (!pinId || !mode || !articleUrl) return null
  return { pinId, mode, articleUrl }
}

/** Match stored article URL to current page (ignore hash; compare origin + pathname). */
export function articlePageMatchesSession(storedUrl: string, windowHref: string): boolean {
  try {
    const a = new URL(storedUrl)
    const b = new URL(windowHref)
    return a.origin === b.origin && a.pathname === b.pathname
  } catch {
    return false
  }
}
