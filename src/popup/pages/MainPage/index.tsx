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
      
        <CardHeader title="Wiki Pin" sx={styles.header} action={<Button variant="text" color="error" onClick={() => { logout() }} size='small'>Log out</Button>} />
      <Card>
        <CardContent>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={styles.tabs}>
            <Tab label="My Articles" value="my-articles" sx={styles.tab} />
            <Tab label="All Articles" value="all-articles" sx={styles.tab} />
          </Tabs>

          <Articles type={tab} />
        </CardContent>
      </Card>
    </Container>
  )
}

export default MainPage