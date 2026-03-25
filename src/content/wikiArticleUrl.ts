/**
 * Whether the extension should inject the content script on this URL.
 * Mirrors manifest `matches` / `exclude_matches` and adds checks (e.g. www portal).
 */

const NON_ARTICLE_TITLE_PREFIXES = [
  'Special:',
  'Wikipedia:',
  'Talk:',
  'User:',
  'User_talk:',
  'Help:',
  'File:',
  'MediaWiki:',
  'Template:',
  'Category:',
  'Draft:',
  'Module:',
  'Portal:',
] as const

function hostnameIsWikipediaArticleHost(hostname: string): boolean {
  if (hostname === 'www.wikipedia.org') return false
  const parts = hostname.split('.')
  if (parts.length < 3 || parts[parts.length - 1] !== 'org' || parts[parts.length - 2] !== 'wikipedia') {
    return false
  }
  // en.wikipedia.org
  if (parts.length === 3) return parts[0] !== 'www'
  // en.m.wikipedia.org (mobile)
  if (parts.length === 4 && parts[1] === 'm') return true
  return false
}

function titleFromWikiPath(pathname: string): string | null {
  if (!pathname.startsWith('/wiki/')) return null
  const raw = pathname.slice('/wiki/'.length)
  if (!raw) return null
  try {
    return decodeURIComponent(raw.replace(/_/g, ' '))
  } catch {
    return raw.replace(/_/g, ' ')
  }
}

function isNonArticleTitle(title: string): boolean {
  const first = title.split('/')[0] ?? title
  return NON_ARTICLE_TITLE_PREFIXES.some((p) => first.startsWith(p))
}

/** True when URL is a Wikipedia article view (any language), not portal / Special / Talk / etc. */
export function isWikipediaArticlePageUrl(href: string): boolean {
  try {
    const u = new URL(href)
    if (u.protocol !== 'https:') return false
    if (!hostnameIsWikipediaArticleHost(u.hostname)) return false
    const title = titleFromWikiPath(u.pathname)
    if (!title) return false
    return !isNonArticleTitle(title)
  } catch {
    return false
  }
}
