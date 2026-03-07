export const styles = {
  root: {
    width: 'auto',
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleButton: {
    width: '32px',
    height: '32px',
    backgroundColor: 'red',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonIcon: {
    width: '16px',
    height: '16px',
    position: 'absolute',
    top: '50%',
    left: 'calc(50%)',
    transform: 'translate(calc(50% - 12px), calc(50% - 12px))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}