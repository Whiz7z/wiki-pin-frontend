import React from 'react'
import { Dialog, Paper, Theme } from '@mui/material'
import { useUi } from '@/content/context/UiContext'
import type { ModalName } from '@/content/context/UiContext'
import { PinContentModal, type PinContentModalParams } from './PinContentModal'

function getModalContent(
  name: ModalName,
  params: Record<string, unknown>,
  onClose: () => void
): React.ReactNode {
  switch (name) {
    case 'pinContent':
      return <PinContentModal params={params as unknown as PinContentModalParams} onClose={onClose} />
    default:
      return null
  }
}

interface ModalsProps {
  /** Mount the dialog portal inside this element (e.g. shadow DOM container) so it stays inside the extension UI. */
  container?: HTMLElement | null
}

const styles = {
  paper: (theme: Theme) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: '10px',
    padding: '24px',
  }),
}

const Modals = ({ container }: ModalsProps) => {
  const { modal, closeModal } = useUi()
  const open = modal.name !== null
  const content = modal.name ? getModalContent(modal.name, modal.params, closeModal) : null

  return (
    <Dialog
      open={open}
      onClose={closeModal}
      maxWidth="sm"
      fullWidth
      container={container ?? undefined}
      PaperComponent={(props) => <Paper {...props} sx={styles.paper} />}
    >
      {content}
    </Dialog>
  )
}

export default Modals
