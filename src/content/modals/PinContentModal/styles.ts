import { Theme } from '@mui/material'

export const styles = {
  root: () => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  }),
  header: () => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  content: () => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }),
  actionsRow: () => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    mb: 1,
  }),
  editDeleteRow: () => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    mb: 1,
  }),
  deleteRow: () => ({
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'flex-end',
  }),
  titleField: () => ({
    marginBottom: '8px',
  }),
  contentCard: () => ({
    padding: '8px',
    maxHeight: '220px',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  }),
  sectionTitle: () => ({
    fontWeight: 600,
  }),
  commentsRoot: () => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '8px',
  }),
  addCommentForm: () => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }),
  addCommentBtn: () => ({
    alignSelf: 'flex-end',
  }),
  commentsListWrap: () => ({
    width: '100%',
    minHeight: 120,
    maxHeight: 260,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  }),
  commentsScrollSx: () => ({
    maxHeight: '346px',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  }),
  commentItem: (theme: Theme) => ({
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: theme.palette.action.hover,
  }),
  commentMeta: () => ({
    marginBottom: '4px',
  }),
  anchorSessionButtons: () => ({
    display: 'flex',
    marginBottom: 2,
    gap: 1,
    alignItems: 'center',
  }),
}