import { Theme } from '@mui/material'

export const styles = {
  root: (theme: Theme) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  }),
  header: (theme: Theme) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  content: (theme: Theme) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }),
  actionsRow: (theme: Theme) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    mb: 1,
  }),
  editDeleteRow: (theme: Theme) => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    mb: 1,
  }),
  deleteRow: (theme: Theme) => ({
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'flex-end',
  }),
  titleField: (theme: Theme) => ({
    marginBottom: '8px',
  }),
  contentCard: (theme: Theme) => ({
    padding: '8px',
    maxHeight: '220px',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  }),
  sectionTitle: (theme: Theme) => ({
    fontWeight: 600,
  }),
  commentsRoot: (theme: Theme) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '8px',
  }),
  addCommentForm: (theme: Theme) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }),
  addCommentBtn: (theme: Theme) => ({
    alignSelf: 'flex-end',
  }),
  commentsListWrap: (theme: Theme) => ({
    width: '100%',
    minHeight: 120,
    maxHeight: 260,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  }),
  commentsScrollSx: (theme: Theme) => ({
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
  commentMeta: (theme: Theme) => ({
    marginBottom: '4px',
  }),
}