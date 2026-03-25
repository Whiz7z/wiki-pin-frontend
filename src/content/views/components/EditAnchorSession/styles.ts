/** DOM outline styles for highlighted page elements (not MUI `sx`). */
export const anchorOutlines = {
  refresh: '3px solid #f59e0b',
  old: '3px solid #2563eb',
  new: '3px solid #16a34a',
} as const

/** Fixed layout so loading and loaded states share the same card size. */
const CARD_WIDTH_PX = 360
/** Fixed height for the main panel body (below title). */
const CONTENT_MIN_HEIGHT_PX = 260

export const styles = {
  card: {
    width: CARD_WIDTH_PX,
    minWidth: CARD_WIDTH_PX,
    maxWidth: CARD_WIDTH_PX,
    display: 'flex',
    flexDirection: 'column' as const,
    p: 2,
    boxSizing: 'border-box' as const,
    boxShadow: 6,
  },

  title: {
    flexShrink: 0,
    mb: 0,
  },

  /** Same width × height for spinner, errors, and form (scroll inside if needed). */
  contentSlot: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    height: CONTENT_MIN_HEIGHT_PX,
    minHeight: CONTENT_MIN_HEIGHT_PX,
    maxHeight: CONTENT_MIN_HEIGHT_PX,
    mt: 1,
    gap: 2,
    overflow: 'hidden',
  },

  loadingCenter: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: 0,
  },

  hint: {
    flexShrink: 0,
  },

  textField: {
    flexShrink: 0,
  },

  alert: {
    mb: 1,
    flexShrink: 0,
  },

  xpathCaption: {
    wordBreak: 'break-all' as const,
    flexShrink: 0,
  },

  actionsRow: {
    display: 'flex',
    gap: 1,
    flexWrap: 'wrap' as const,
    flexShrink: 0,
    mt: 'auto',
  },

  errorBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
    flex: 1,
    minHeight: 0,
    height: '100%',
    justifyContent: 'center',
    overflow: 'auto',
  },

  formBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    gap: 2,
    minHeight: 0,
    height: '100%',
    overflow: 'auto',
  },
}
