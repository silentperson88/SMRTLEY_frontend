import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'

const LONG_TIMEOUT_MS = 8 * 60 * 1000

type VideoRow = {
  id: number
  language: string
  status: string
  script: string
  audio_url?: string
  created_at?: string
  updated_at?: string
}

const NewsContentListPage: NextPage = () => {
  const router = useRouter()
  const [rows, setRows] = useState<VideoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rssItems, setRssItems] = useState<Array<{ title: string; link: string; pubDate?: string }>>([])
  const [rssLoading, setRssLoading] = useState(false)
  const [rssSource, setRssSource] = useState<'toi' | 'ht' | ''>('')
  const [savedLinks, setSavedLinks] = useState<Record<string, boolean>>({})
  const [savingLink, setSavingLink] = useState<Record<string, boolean>>({})

  const load = async () => {
    try {
      setError('')
      setLoading(true)
      const res = await axiosInstance.get(ENDURL.NEWS_CONTENT_VIDEOS_LIST, { timeout: LONG_TIMEOUT_MS })
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setRows(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    try {
      setError('')
      setSuccess('')
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_VIDEOS_CREATE,
        { language: 'english' },
        { timeout: LONG_TIMEOUT_MS }
      )
      const created = res?.data?.data
      if (created?.id) {
        setSuccess('Video draft created.')
        router.push(`/news-content/${created.id}`)
        return
      }
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create video')
    }
  }

  const handleLoadRss = async (source: 'toi' | 'ht') => {
    try {
      setError('')
      setRssLoading(true)
      setRssSource(source)
      const res = await axiosInstance.get(ENDURL.NEWS_CONTENT_RSS, {
        params: { source },
        timeout: LONG_TIMEOUT_MS
      })
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setRssItems(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch RSS')
    } finally {
      setRssLoading(false)
    }
  }

  const handleSaveRss = async (item: { title: string; link: string; pubDate?: string }, source: 'toi' | 'ht') => {
    try {
      if (!item.link) return
      setSavingLink(prev => ({ ...prev, [item.link]: true }))
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_RSS_SAVE,
        { title: item.title, link: item.link, pubDate: item.pubDate || '', source },
        { timeout: LONG_TIMEOUT_MS }
      )
      const saved = Boolean(res?.data?.data?.saved)
      setSavedLinks(prev => ({ ...prev, [item.link]: true }))
      setSuccess(saved ? 'News saved.' : 'News already saved.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save news')
    } finally {
      setSavingLink(prev => ({ ...prev, [item.link]: false }))
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            News Content
          </Typography>
          <Stack direction='row' spacing={2}>
            <Button variant='outlined' onClick={() => router.push('/filtered-news')}>
              Filtered News
            </Button>
            <Button variant='outlined' onClick={() => router.push('/music-library')}>
              Music Library
            </Button>
            <Button variant='contained' onClick={handleCreate}>
              Generate Video
            </Button>
          </Stack>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                Fetch RSS News
              </Typography>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Button variant='outlined' onClick={() => handleLoadRss('toi')} disabled={rssLoading}>
                  {rssLoading && rssSource === 'toi' ? 'Loading...' : 'Times of India'}
                </Button>
                <Button variant='outlined' onClick={() => handleLoadRss('ht')} disabled={rssLoading}>
                  {rssLoading && rssSource === 'ht' ? 'Loading...' : 'Hindustan Times'}
                </Button>
              </Stack>
              <List dense>
                {rssItems.map((item, idx) => (
                  <ListItem key={`rss-${idx}`} divider sx={{ alignItems: 'flex-start' }}>
                    <Stack direction='row' spacing={2} alignItems='center' sx={{ width: '100%' }}>
                      <ListItemText
                        primary={item.title}
                        secondary={item.pubDate ? new Date(item.pubDate).toLocaleString() : ''}
                      />
                      <Button
                        variant={savedLinks[item.link] ? 'outlined' : 'contained'}
                        size='small'
                        disabled={savingLink[item.link]}
                        onClick={() => handleSaveRss(item, rssSource || 'toi')}
                      >
                        {savingLink[item.link]
                          ? 'Saving...'
                          : savedLinks[item.link]
                            ? 'Selected'
                            : 'Select News'}
                      </Button>
                    </Stack>
                  </ListItem>
                ))}
                {!rssItems.length ? (
                  <ListItem>
                    <ListItemText primary={rssLoading ? 'Loading...' : 'No RSS items loaded.'} />
                  </ListItem>
                ) : null}
              </List>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Script</TableCell>
                  <TableCell>Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/news-content/${row.id}`)}
                  >
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.language}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{String(row.script || '').slice(0, 80)}</TableCell>
                    <TableCell>{row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {!rows.length ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      {loading ? 'Loading...' : 'No videos created yet.'}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      {error ? (
        <Grid item xs={12}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      ) : null}
      {success ? (
        <Grid item xs={12}>
          <Alert severity='success'>{success}</Alert>
        </Grid>
      ) : null}
    </Grid>
  )
}

export default NewsContentListPage
