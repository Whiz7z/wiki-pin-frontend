import type { PinRelevance } from '@/services/pinsApi'

const RELEVANCE_ORDER: PinRelevance[] = ['active', 'at_risk', 'needs_reassignment', 'unknown']

export function isPinRelevance(value: string): value is PinRelevance {
  return (RELEVANCE_ORDER as string[]).includes(value)
}

/** Short label for chips (English). */
export function relevanceShortLabel(relevance: string | undefined): string {
  const r = relevance ?? 'unknown'
  switch (r) {
    case 'active':
      return 'Active'
    case 'at_risk':
      return 'At risk'
    case 'needs_reassignment':
      return 'Needs reassign'
    case 'unknown':
      return 'Unknown'
    default:
      return r
  }
}

/** User-facing explanation for decayReason from API. */
export function relevanceChipColor(
  relevance: string | undefined,
): 'success' | 'warning' | 'error' | 'default' {
  const r = relevance ?? 'unknown'
  if (r === 'active') return 'success'
  if (r === 'at_risk') return 'warning'
  if (r === 'needs_reassignment') return 'error'
  return 'default'
}

export function decayReasonLabel(reason: string | null | undefined): string | null {
  if (reason == null || reason === '') return null
  switch (reason) {
    case 'missing_anchor_text':
      return 'No anchor text stored for this pin.'
    case 'anchor_text_changed':
      return 'The text at this location changed on the page.'
    default:
      return reason
  }
}
