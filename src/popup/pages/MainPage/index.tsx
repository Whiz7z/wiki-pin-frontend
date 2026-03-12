import { Box, Button, Card, CardContent, CardHeader, Container, Tab, Tabs } from '@mui/material'
import React, { useState } from 'react'
import { styles } from './styles'
import Articles from './Articles'
import { useAuthStore } from '@/stores'


const MainPage = () => {
  const [tab, setTab] = useState<'pins' | 'articles'>('pins')
  const { logout } = useAuthStore()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'pins' | 'articles') => {
    setTab(newValue)
  }

  return (
    <Container sx={styles.root}>
      <Card>
        <CardHeader title="Wiki Pin" action={<Button variant="text" color="error" onClick={() => { logout() }}>Log out</Button>} />
        
      </Card>
      <Card>
        <CardContent>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab label="Pins" value="pins" />
            <Tab label="Articles" value="articles" />
          </Tabs>

          {tab === 'pins' && <div>Pins</div>}
          {tab === 'articles' && <Articles />}
        </CardContent>
      </Card>
    </Container>
  )
}

export default MainPage