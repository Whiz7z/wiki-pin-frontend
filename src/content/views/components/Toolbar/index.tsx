import SelectElementIcon from '@/assets/icons/SelectElementIcon'
import { Box, Button, IconButton, Typography } from '@mui/material'
import React, { useState } from 'react'
import { styles } from './styles'
import { useAuthStoreContent } from '@/hooks/useAuthStoreContent'
import AddPinForm from '../../../forms/AddPinForm'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useElementSelection } from '../SelectMode/SelectMode'
import { useShowPinsMode } from '../ShowPinsMode/ShowPinsMode'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'

import type { Pin } from '@/services/pinsApi'
import { useUi } from '@/content/context/UiContext'
import { useAuthStore } from '@/stores'

type ToolbarMode = 'normal' | 'select' | 'showPins'

const MODE_ORDER: ToolbarMode[] = ['normal', 'select', 'showPins']

const Toolbar = () => {
  const { user } = useAuthStore()
  const isLoggedIn = !!user
  const [mode, setMode] = useState<ToolbarMode>('showPins')
  const enableElementSelection = mode === 'select'
  const showPinsEnabled = mode === 'showPins'
  const { isElementSelected, removeOutline, clearSelectedElement } = useElementSelection(
    enableElementSelection
  )
  const { pinsCount, currentPinIndex, highlightedPin, scrollToPin } = useShowPinsMode(showPinsEnabled)
  const { openModal } = useUi()

  const cycleMode = () => {
    setMode((prev) => {
      const i = MODE_ORDER.indexOf(prev)
      return MODE_ORDER[(i + 1) % MODE_ORDER.length]
    })
  }

  const handleClearSelection = () => {
    removeOutline()
    clearSelectedElement()
  }

  const handleScrollToPin = (direction: 'next' | 'previous') => {
    scrollToPin(direction)
  }

  const openPinContent = (pin: Pin) => {
    openModal('pinContent', { pin })
  }

  return (
    <Box className="App" sx={styles.root}>
      <Box sx={styles.authInfo}>
        <Typography variant="body1" color={isLoggedIn ? "success.main" : "error.main"}>
          {isLoggedIn ? `Logged in as ${user?.name}` : 'Logged out'}
        </Typography>
      </Box>
      {enableElementSelection && isElementSelected && <AddPinForm />}
      <Box sx={styles.buttonContainer}>

        {showPinsEnabled && (
          <Box sx={styles.highlightedPinActions}>
            {highlightedPin && <Button variant="contained" color="primary" size="small" onClick={() => openPinContent(highlightedPin)}>View pin</Button>}
            <Box sx={styles.navigatePinsContainer}>
              <Typography variant="button" color="primary">
                {currentPinIndex === 0 ? '' : currentPinIndex + ' /'}  {pinsCount} pins
              </Typography>
              <IconButton color="primary" size="small" onClick={() => handleScrollToPin('previous')}>
                <NavigateBeforeIcon />
              </IconButton>

              <IconButton color="primary" size="small" onClick={() => handleScrollToPin('next')}>
                <NavigateNextIcon />
              </IconButton>
            </Box>
          </Box>
        )}
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={cycleMode}
          endIcon={
            mode === 'select' ? (
              <SelectElementIcon size={12} color="#ffffff" />
            ) : (
              <VisibilityOutlinedIcon />
            )
          }
        >
          <Typography variant="button">
            {mode === 'normal' && 'Normal'}
            {mode === 'select' && 'Select mode'}
            {mode === 'showPins' && 'Show pins'}
          </Typography>
        </Button>
        {enableElementSelection && isElementSelected && (
          <IconButton color="error" size="small" onClick={handleClearSelection}>
            <DeleteForeverIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  )
}

export default Toolbar
