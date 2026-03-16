export const styles = {
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    marginTop: 2,
    gap: 1.5,
  },
  sectionTitle: {
    fontWeight: 600,
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
  },
  submitBtn: {
    alignSelf: 'flex-end',
  },
  listWrap: {
    width: '100%',
    minHeight: 120,
    maxHeight: 320,
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
  },
  scrollSx: {
    maxHeight: '346px',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  commentItem: {
    padding: 1,
    borderRadius: 1,
    backgroundColor: 'action.hover',
    '&:not(:last-child)': {
      marginBottom: 0.5,
    },
  },
  commentMeta: {
    marginBottom: 0.5,
  },
}
