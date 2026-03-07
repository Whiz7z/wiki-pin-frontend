import { Box, Card, CardContent, Tab, Tabs } from '@mui/material'
import React, { useState } from 'react'
import { styles } from './styles'
import Articles from './Articles'


const MainPage = () => {
  const [tab, setTab] = useState<'pins' | 'articles'>('pins')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'pins' | 'articles') => {
    setTab(newValue)
  }

  return (
    <Box sx={styles.root}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab label="Pins" value="pins"  />
            <Tab label="Articles" value="articles" />
          </Tabs>

          {tab === 'pins' && <div>Pins</div>}
          {tab === 'articles' && <Articles />}
        </CardContent>
      </Card>
    </Box>
  )
}

export default MainPage