import SelectElementIcon from '@/assets/icons/SelectElementIcon'
import { Box, Button, IconButton, Typography } from '@mui/material'
import React, { useState } from 'react'
import { styles } from './styles'
import { useAuthStoreContent } from '@/hooks/useAuthStoreContent'
import AddPinForm from '../../../forms/AddPinForm'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useElementSelection } from './SelectMode'
import { useShowPinsMode } from './ShowPinsMode'

type ToolbarMode = 'normal' | 'select' | 'showPins'

const MODE_ORDER: ToolbarMode[] = ['normal', 'select', 'showPins']

const Toolbar = () => {
  const [mode, setMode] = useState<ToolbarMode>('normal')
  const enableElementSelection = mode === 'select'
  const showPinsEnabled = mode === 'showPins'
  const { isElementSelected, removeOutline, clearSelectedElement } = useElementSelection(
    enableElementSelection
  )
  useShowPinsMode(showPinsEnabled)
  const { user, accessToken, isLoading } = useAuthStoreContent()

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

  return (
    <Box className="App" sx={styles.root}>
      {isElementSelected && <AddPinForm />}
      <Box sx={styles.buttonContainer}>
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
        {isElementSelected && (
          <IconButton color="error" size="small" onClick={handleClearSelection}>
            <DeleteForeverIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  )
}

export default Toolbar
