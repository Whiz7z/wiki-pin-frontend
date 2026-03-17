import { Button, Card, CardContent, CardHeader, Container, Tab, Tabs } from '@mui/material'
import React, { useState } from 'react'
import { styles } from './styles'
import { useAuthStore } from '@/stores'
import Articles from './Articles'

const MainPage = () => {
  const [tab, setTab] = useState<'my-articles' | 'all-articles'>('my-articles')
  const { logout } = useAuthStore()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'my-articles' | 'all-articles') => {
    setTab(newValue)
  }

  return (
    <Container sx={styles.root}>
      <Card>
        <CardHeader title="Wiki Pin" action={<Button variant="text" color="error" onClick={() => { logout() }}>Log out</Button>} />
      </Card>
      <Card>
        <CardContent>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 1 }}>
            <Tab label="My Articles" value="my-articles" />
            <Tab label="All Articles" value="all-articles" />
          </Tabs>

          <Articles type={tab} />
        </CardContent>
      </Card>
    </Container>
  )
}

export default MainPage