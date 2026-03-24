

export const styles = {
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  articleList: {
    maxHeight: '380px',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    scrollbarWidth: 'none',
  },
}