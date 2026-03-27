import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useRouter } from 'next/router'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { SocialTemplateOneComposition } from 'src/remotion/SocialTemplateOneComposition'
import { SocialTemplateTwoOverlayComposition } from 'src/remotion/SocialTemplateTwoOverlayComposition'
import { SocialTemplateThreeHeaderComposition } from 'src/remotion/SocialTemplateThreeHeaderComposition'

const Player = dynamic(() => import('@remotion/player').then(mod => mod.Player), { ssr: false })

const LONG_TIMEOUT_MS = 8 * 60 * 1000

type RssRow = {
  id: number
  source: string
  title: string
  link: string
  pub_date?: string
  status: string
  raw_text?: string
  images?: string[]
  cleaned_text?: string
  template_one?: SocialTemplateOne | null
  template_two?: SocialTemplateTwo | null
  template_three?: SocialTemplateThree | null
  template_generated_at?: string
  error?: string
  created_at?: string
  finished_at?: string
}

type SocialTemplateOne = {
  title: string
  subtitle?: string
  highlights: string[]
  cta: string
  image?: string | null
}

type SocialTemplateTwo = {
  heading: string[]
  image?: string | null
}

type SocialTemplateThree = {
  title: string
  image?: string | null
}

type Progress = {
  pending: number
  processing: number
  completed: number
  failed: number
}

type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'all' | 'custom'

const toDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const shiftDate = (base: Date, offsetDays: number) => {
  const next = new Date(base)
  next.setDate(next.getDate() + offsetDays)
  return next
}

const getDateRangeFromPreset = (preset: DateRangePreset, customFromDate: string, customToDate: string) => {
  const today = new Date()
  const todayStr = toDateInput(today)

  if (preset === 'today') return { fromDate: todayStr, toDate: todayStr }
  if (preset === 'yesterday') {
    const yesterday = toDateInput(shiftDate(today, -1))
    return { fromDate: yesterday, toDate: yesterday }
  }
  if (preset === 'last7') return { fromDate: toDateInput(shiftDate(today, -6)), toDate: todayStr }
  if (preset === 'last30') return { fromDate: toDateInput(shiftDate(today, -29)), toDate: todayStr }
  if (preset === 'custom') return { fromDate: customFromDate || '', toDate: customToDate || '' }
  return { fromDate: '', toDate: '' }
}

const FilteredNewsPage: NextPage = () => {
  const router = useRouter()
  const [rows, setRows] = useState<RssRow[]>([])
  const [progress, setProgress] = useState<Progress>({ pending: 0, processing: 0, completed: 0, failed: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processingLink, setProcessingLink] = useState<Record<string, boolean>>({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<RssRow | null>(null)
  const [editedCleanedText, setEditedCleanedText] = useState('')
  const [bodyLoading, setBodyLoading] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [templateSlideIndex, setTemplateSlideIndex] = useState(0)
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('today')
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')

  const clampWords = (text: string, maxWords: number) => {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean)
    if (words.length <= maxWords) return words.join(' ')
    return `${words.slice(0, maxWords).join(' ')}...`
  }

  const lineClampStyle = (lines: number) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden'
  })

  const load = async () => {
    try {
      setError('')
      setLoading(true)
      const { fromDate, toDate } = getDateRangeFromPreset(dateRangePreset, customFromDate, customToDate)
      if (dateRangePreset === 'custom') {
        if (!fromDate || !toDate) {
          throw new Error('Select both From and To dates for the custom range')
        }
        if (fromDate > toDate) {
          throw new Error('From date cannot be after To date')
        }
      }
      const params = {
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {})
      }
      const [listRes, progRes] = await Promise.all([
        axiosInstance.get(ENDURL.NEWS_CONTENT_RSS_ITEMS, { params, timeout: LONG_TIMEOUT_MS }),
        axiosInstance.get(ENDURL.NEWS_CONTENT_RSS_PROGRESS, { params, timeout: LONG_TIMEOUT_MS })
      ])
      const nextRows = Array.isArray(listRes?.data?.data) ? listRes.data.data : []
      setRows(nextRows)
      setProgress(progRes?.data?.data || { pending: 0, processing: 0, completed: 0, failed: 0 })
      return nextRows
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load filtered news')
      return []
    } finally {
      setLoading(false)
    }
  }

  const handleProcessOne = async (link: string) => {
    if (!link) return
    try {
      setError('')
      setProcessingLink(prev => ({ ...prev, [link]: true }))
      await axiosInstance.post(
        ENDURL.NEWS_CONTENT_RSS_PROCESS_ONE,
        { link },
        { timeout: LONG_TIMEOUT_MS }
      )
      const updatedRows = await load()
      const row = updatedRows.find(item => item.link === link)
      if (row) {
        setDetailRow(row)
        setDetailOpen(true)
        setEditedCleanedText(String(row?.cleaned_text || ''))
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to process news')
    } finally {
      setProcessingLink(prev => ({ ...prev, [link]: false }))
    }
  }

  const handleOpenDetail = (row: RssRow) => {
    setDetailRow(row)
    setDetailOpen(true)
    setEditedCleanedText(String(row?.cleaned_text || ''))
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setDetailRow(null)
    setEditedCleanedText('')
  }

  const handleSendToNewsContent = () => {
    if (!detailRow) return
    const payload = {
      title: detailRow.title || '',
      rawText: detailRow.raw_text || '',
      images: detailRow.images || [],
      script: detailRow.cleaned_text || ''
    }
    const go = async () => {
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_RSS_LINK_VIDEO,
        { link: detailRow.link },
        { timeout: LONG_TIMEOUT_MS }
      )
      const videoId = String(res?.data?.data?.videoId || '')
      if (!videoId) throw new Error('Video id missing')
      try {
        window.localStorage.setItem('newsContentPrefill', JSON.stringify({ ...payload, targetId: videoId }))
      } catch (_) {
        // ignore
      }
      router.push(`/news-content/${videoId}`)
    }
    go().catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to link news content video'))
  }

  useEffect(() => {
    const total = detailRow?.images?.length || 0
    if (!detailOpen || total <= 1) return
    setCarouselIndex(0)
    const timer = setInterval(() => {
      setCarouselIndex(prev => (total ? (prev + 1) % total : 0))
    }, 2500)
    return () => clearInterval(timer)
  }, [detailOpen, detailRow?.images?.length])

  useEffect(() => {
    if (!detailOpen) return
    setTemplateSlideIndex(0)
    const timer = setInterval(() => {
      setTemplateSlideIndex(prev => (prev + 1) % 3)
    }, 2600)
    return () => clearInterval(timer)
  }, [detailOpen])

  const handleFetchArticleBody = async () => {
    if (!detailRow?.link) return
    try {
      setBodyLoading(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_RSS_ARTICLE_BODY,
        { link: detailRow.link },
        { timeout: LONG_TIMEOUT_MS }
      )
      const rawText = String(res?.data?.data?.rawText || '').trim()
      const images = Array.isArray(res?.data?.data?.images) ? res.data.data.images : []
      const nextRow = { ...detailRow, raw_text: rawText, images }
      setDetailRow(nextRow)
      setRows(prev => prev.map(row => (row.id === nextRow.id ? nextRow : row)))
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch article body')
    } finally {
      setBodyLoading(false)
    }
  }

  useEffect(() => {
    if (dateRangePreset !== 'custom') {
      load()
      return
    }

    if (customFromDate && customToDate) {
      load()
    }
  }, [dateRangePreset, customFromDate, customToDate])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Stack spacing={3}>
          <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
            <Typography variant='h4' sx={{ fontWeight: 700 }}>
              Filtered News
            </Typography>
            <Button variant='outlined' onClick={load} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>

          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                <FormControl size='small' sx={{ minWidth: 220 }}>
                  <InputLabel id='filtered-news-date-range-label'>Date Range</InputLabel>
                  <Select
                    labelId='filtered-news-date-range-label'
                    value={dateRangePreset}
                    label='Date Range'
                    onChange={e => setDateRangePreset(e.target.value as DateRangePreset)}
                  >
                    <MenuItem value='today'>Today</MenuItem>
                    <MenuItem value='yesterday'>Yesterday</MenuItem>
                    <MenuItem value='last7'>Last 7 Days</MenuItem>
                    <MenuItem value='last30'>Last 30 Days</MenuItem>
                    <MenuItem value='all'>All Data</MenuItem>
                    <MenuItem value='custom'>Custom Range</MenuItem>
                  </Select>
                </FormControl>

                {dateRangePreset === 'custom' ? (
                  <>
                    <TextField
                      size='small'
                      type='date'
                      label='From'
                      value={customFromDate}
                      onChange={e => setCustomFromDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      size='small'
                      type='date'
                      label='To'
                      value={customToDate}
                      onChange={e => setCustomToDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                ) : null}

                <Typography variant='body2' color='text.secondary'>
                  Default view loads only today&apos;s saved filtered news.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack direction='row' spacing={3}>
              <Typography variant='body2'>Pending: {progress.pending}</Typography>
              <Typography variant='body2'>Processing: {progress.processing}</Typography>
              <Typography variant='body2'>Completed: {progress.completed}</Typography>
              <Typography variant='body2'>Failed: {progress.failed}</Typography>
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
                  <TableCell>Source</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Summary</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{String(row.cleaned_text || row.error || '').slice(0, 160)}</TableCell>
                    <TableCell>
                      {row.finished_at ? new Date(row.finished_at).toLocaleString() : row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size='small'
                        variant='contained'
                        disabled={processingLink[row.link]}
                        onClick={() => handleProcessOne(row.link)}
                      >
                        {processingLink[row.link] ? 'Processing...' : 'Process Now'}
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        sx={{ ml: 1 }}
                        onClick={() => handleOpenDetail(row)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      {loading ? 'Loading...' : 'No filtered news yet.'}
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

      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth='md' fullWidth>
        <DialogTitle>News Detail</DialogTitle>
        <DialogContent>
            <Stack spacing={2}>
              <Button variant='contained' onClick={handleSendToNewsContent}>
                Send To News Content
              </Button>
              <Typography variant='h6'>{detailRow?.title || 'Untitled'}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Source: {detailRow?.source || '-'} • {detailRow?.pub_date ? new Date(detailRow.pub_date).toLocaleString() : '-'}
            </Typography>
            {detailRow?.link ? (
              <Typography variant='body2' color='primary'>
                {detailRow.link}
              </Typography>
            ) : null}
            <Divider />
            {detailRow?.images?.length ? (
              <Stack spacing={1}>
                <Typography variant='subtitle2'>Images</Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  {detailRow.images.map((src, idx) => (
                    <img
                      key={`img-${idx}`}
                      src={src}
                      alt={`article-${idx}`}
                      style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ))}
                </Stack>
              </Stack>
            ) : null}
            <Divider />
            <Stack direction='row' spacing={2} alignItems='center'>
              <Typography variant='subtitle2'>Raw Text</Typography>
              <Button size='small' variant='outlined' onClick={handleFetchArticleBody} disabled={bodyLoading}>
                {bodyLoading ? 'Fetching...' : 'Fetch Article Body'}
              </Button>
            </Stack>
            <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
              {detailRow?.raw_text || 'No raw text available.'}
            </Typography>
            <Divider />
            <Typography variant='subtitle2'>Rewritten News</Typography>
            <TextField
              multiline
              minRows={6}
              value={editedCleanedText || detailRow?.cleaned_text || detailRow?.error || ''}
              onChange={event => {
                const value = event.target.value
                setEditedCleanedText(value)
                if (detailRow) {
                  setDetailRow({ ...detailRow, cleaned_text: value })
                }
              }}
              placeholder='No content available yet.'
              sx={{ '& .MuiInputBase-input': { whiteSpace: 'pre-wrap' } }}
              fullWidth
            />
            <Divider />
            <Typography variant='subtitle2'>Template Previews</Typography>
            <Stack spacing={2}>
              {detailRow?.template_one ? (
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Template 1
                  </Typography>
                  <Player
                    component={SocialTemplateOneComposition}
                    durationInFrames={180}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1080}
                    inputProps={{ ...detailRow.template_one, brand: 'R4D News' }}
                    style={{ width: '100%', maxWidth: 420 }}
                    controls
                  />
                </Card>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Template 1 not generated yet.
                </Typography>
              )}
              {detailRow?.template_two ? (
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Template 2
                  </Typography>
                  <Player
                    component={SocialTemplateTwoOverlayComposition}
                    durationInFrames={180}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1080}
                    inputProps={{ ...detailRow.template_two, brand: 'R4D News' }}
                    style={{ width: '100%', maxWidth: 420 }}
                    controls
                  />
                </Card>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Template 2 not generated yet.
                </Typography>
              )}
              {detailRow?.template_three ? (
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Template 3
                  </Typography>
                  <Player
                    component={SocialTemplateThreeHeaderComposition}
                    durationInFrames={180}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1080}
                    inputProps={{ ...detailRow.template_three, brand: 'R4D News' }}
                    style={{ width: '100%', maxWidth: 420 }}
                    controls
                  />
                </Card>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Template 3 not generated yet.
                </Typography>
              )}
            </Stack>
            <Divider />
            <Typography variant='subtitle2'>Image Templates (HTML Preview)</Typography>
            <Stack spacing={2}>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Single Image Post
                </Typography>
                <div
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(148,163,184,0.35)'
                  }}
                >
                  {detailRow?.images?.[0] ? (
                    <img
                      src={detailRow.images[0]}
                      alt='single-template'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#000'
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: '#0f172a',
                      color: '#fff',
                      padding: '14px 18px',
                      boxShadow: 'none',
                      minHeight: 56
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>
                      <span style={lineClampStyle(2)}>
                        {detailRow?.template_one?.title || detailRow?.title || 'Top Story'}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginTop: 6 }}>
                      <span style={lineClampStyle(2)}>
                        {detailRow?.template_one?.subtitle || 'Tap to read the full update'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Single Image Variant (Title Top + Subtitle Footer)
                </Typography>
                <div
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(148,163,184,0.35)'
                  }}
                >
                  {detailRow?.images?.[0] ? (
                    <img
                      src={detailRow.images[0]}
                      alt='single-variant-top'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#000'
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      background: '#111827',
                      color: '#fff',
                      padding: '12px 18px',
                      boxShadow: 'none',
                      minHeight: 48
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      <span style={lineClampStyle(2)}>
                        {detailRow?.template_three?.title || detailRow?.template_one?.title || detailRow?.title || 'Top Story'}
                      </span>
                    </div>
                  </div>
                  {detailRow?.template_one?.subtitle ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: '#0f172a',
                        color: '#e2e8f0',
                        padding: '12px 18px',
                        boxShadow: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        minHeight: 56
                      }}
                    >
                      <span style={lineClampStyle(3)}>{detailRow.template_one.subtitle}</span>
                    </div>
                  ) : null}
                </div>
              </Card>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Single Image Variant (Slide Story)
                </Typography>
                <div
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(148,163,184,0.35)'
                  }}
                >
                  {templateSlideIndex === 0 ? (
                    <>
                      {detailRow?.images?.[0] ? (
                        <img
                          src={detailRow.images[0]}
                          alt='single-variant-heading'
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'top center',
                            background: '#000'
                          }}
                        />
                      ) : null}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: '#0f172a',
                          color: '#fff',
                          padding: '14px 18px',
                          boxShadow: 'none',
                          minHeight: 64
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 800 }}>
                          <span style={lineClampStyle(3)}>
                            {detailRow?.template_two?.heading?.[0] || detailRow?.template_one?.title || 'Top Story'}
                          </span>
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            right: 14,
                            bottom: 10,
                            fontSize: 12,
                            color: '#facc15',
                            fontWeight: 700
                          }}
                        >
                          Next &gt;
                        </div>
                      </div>
                    </>
                  ) : templateSlideIndex === 1 ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 12,
                        padding: '24px 26px',
                        background: 'linear-gradient(160deg, #0f172a 0%, #1f2937 50%, #0b1120 100%)',
                        color: '#f8fafc'
                      }}
                    >
                      {(detailRow?.template_one?.highlights || detailRow?.template_two?.heading || [])
                        .slice(0, 4)
                        .map((line, idx) => (
                          <div key={`point-${idx}`} style={{ fontSize: 18, fontWeight: 700, color: '#facc15' }}>
                            • {line}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#0b1120'
                      }}
                    >
                      <img
                        src='/images/shorts/shorts_follow.png'
                        alt='shorts-follow'
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </Card>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Multi Image Post (Carousel + Highlights)
                </Typography>
                <div
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(148,163,184,0.35)'
                  }}
                >
                  {detailRow?.images?.length ? (
                    <>
                      <img
                        src={detailRow.images[carouselIndex % detailRow.images.length]}
                        alt='carousel'
                        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                      />
                      {(() => {
                        const points =
                          detailRow?.template_one?.highlights ||
                          detailRow?.template_two?.heading ||
                          []
                        const totalImages = detailRow.images.length
                        if (!points.length) return null
                        const perImage = Math.min(totalImages, points.length)
                        const start = (carouselIndex % totalImages) * perImage
                        const slice = points.slice(start, start + perImage)
                        const visible = slice.length ? slice : points.slice(0, perImage)
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              left: 12,
                              bottom: 12,
                              right: 12,
                              background: 'rgba(15,23,42,0.72)',
                              color: '#facc15',
                              padding: '10px 12px',
                              borderRadius: 10
                            }}
                          >
                            {visible.map((point, idx) => (
                              <div key={`hl-${idx}`} style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
                                • {clampWords(point, 10)}
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                      <div
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                          background: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          fontSize: 12,
                          padding: '4px 8px',
                          borderRadius: 999
                        }}
                      >
                        {carouselIndex + 1}/{detailRow.images.length}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8'
                      }}
                    >
                      No images found.
                    </div>
                  )}
                </div>
              </Card>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Grid>
  )
}

export default FilteredNewsPage
