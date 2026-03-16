import React from 'react'
import { Article } from '@/services/articlesApi'
import { Accordion, AccordionDetails, AccordionSummary, Box, IconButton, Link, Theme, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import PushPinIcon from '@mui/icons-material/PushPin'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useAuthStore } from '@/stores'
import { useRouter } from '@/popup/router'

const styles = {
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
    gap: 1,
    alignItems: 'center',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: 1,
  },
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  accordion: (theme: Theme) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'none',
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: '6px',
    '& .MuiAccordionSummary-root.Mui-expanded': {
      minHeight: '64px !important',
      height: '64px !important',
    },
  }),
  accordionSummary: () => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 1,
  }),
  pinList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  detailsContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  pinListContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
}

export default function ArticleItem({ article }: { article: Article }) {
  const { user } = useAuthStore()
  const { navigate } = useRouter()
  

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box sx={styles.title}>
          <Typography variant="h6" sx={{ wordBreak: 'break-all' }}><Link href={article.url} target="_blank" title={article.url}>{article.title}</Link>
          </Typography>
        </Box>


        <Box sx={styles.actions}>
          <IconButton>
            <EditIcon />
          </IconButton>
          <IconButton>
            <PushPinIcon />
          </IconButton>
        </Box>
      </Box>
      <Box sx={styles.content}>
        <Accordion sx={styles.accordion}>
          <AccordionSummary >
            <Box sx={styles.accordionSummary}>
              <Typography variant="body1" title="Edit article">
                ({article._count?.pins} pins)
              </Typography>
              <IconButton>
                <ArrowDropDownIcon />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails >
            <Box sx={styles.detailsContainer}>
              <Box sx={styles.pinListContainer}>
                <Typography variant="body1" color="success">My pins</Typography>
                <Box sx={styles.pinList}>
                  {article.pins?.filter((pin) => pin.authorId === user?.id).map((pin) => (
                    <Box key={pin.id}>
                      <Typography
                        variant="body1"
                        component="button"
                        onClick={() => navigate('pin', { params: { pinId: pin.id } })}
                        sx={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left',
                          font: 'inherit',
                          color: 'inherit',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {pin.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={styles.pinListContainer}>
                <Typography variant="body1" color="error">Other pins</Typography>
                <Box sx={styles.pinList}>
                  {article.pins?.filter((pin) => pin.authorId !== user?.id).map((pin) => (
                    <Box key={pin.id}>
                      <Typography
                        variant="body1"
                        component="button"
                        onClick={() => navigate('pin', { params: { pinId: pin.id } })}
                        sx={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left',
                          font: 'inherit',
                          color: 'inherit',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {pin.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  )
}