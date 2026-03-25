import { Theme } from "@mui/material";

export const styles = {
  container: () => ({
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    position: 'relative',
  }),
  scrollContainer: () => ({
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    gap: '8px',
    '&::-webkit-scrollbar': {
      display: 'none'
    },
  }),
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    py: 2,
  }
};
