export const styles = {
  root: {
    padding: 2,
    height: '100%',
    width: '100%',
  },
  headerRow: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 1,
    alignItems: 'center',
    marginBottom: 2,
  },
  titleField: {
    marginBottom: 1,
  },
  pinContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: 1,
    minHeight: '200px',
    maxHeight: '500px',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    scrollbarWidth: 'none',
  },
  anchorSessionButtons: {
    display: 'flex',
    marginBottom: 2,
    gap: 1,
    alignItems: 'center',
  },
  articleInfo: {
    display: 'flex',
    gap: 1,
    alignItems: 'center',
    marginBottom: 1,
  },
}