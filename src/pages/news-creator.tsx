import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import TablePagination from '@mui/material/TablePagination'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import Box from '@mui/material/Box'
import { NewsApproachSequenceComposition } from 'src/remotion/NewsApproachSequenceComposition'

const LONG_TIMEOUT_MS = 8 * 60 * 1000
const BATCH_JOB_STORAGE_KEY = 'news_creator_batch_job_id'
const PREVIEW_FPS = 30
const Player = dynamic(() => import('@remotion/player').then(mod => mod.Player), { ssr: false })

type BseItem = {
  id: number
  newsId: string
  newsDate: string
  company: string
  headline: string
  category: string
  pdfUrl: string
  matchStatus: 'matched' | 'unmatched' | 'pending'
  matchScore: number
  newApproachReady: boolean
  scriptEnglish: string
  scriptAudioEnglish: string
  highlightTerms: string[]
}

type BatchProgress = {
  id: string
  status: 'running' | 'stopping' | 'stopped' | 'completed' | 'failed'
  date: string
  category: string
  forcedMatchStatus: string
  model: string
  total: number
  processed: number
  success: number
  failed: number
  skipped: number
  progress: number
  currentNewsId: number | null
  currentHeadline: string
  gapMs: number
  errors: Array<{ newsId: number; headline: string; message: string }>
  startedAt: string
  finishedAt: string | null
}

type FullVideoRow = {
  id: number
  date: string
  category: string
  title: string
  fileName: string
  videoUrl: string
  totalNews: number
  createdAt: string | null
}

const isoToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
}

const NewsCreatorListPage: NextPage = () => {
  const router = useRouter()
  const [bseModalOpen, setBseModalOpen] = useState(false)
  const [bseDate, setBseDate] = useState(isoToday())
  const [filterDate, setFilterDate] = useState(isoToday())
  const [category, setCategory] = useState('all')
  const [matchView, setMatchView] = useState<'matched' | 'unmatched' | 'all'>('matched')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<BseItem[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [matchedRows, setMatchedRows] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [batchStarting, setBatchStarting] = useState(false)
  const [batchStopping, setBatchStopping] = useState(false)
  const [batchJobId, setBatchJobId] = useState('')
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null)
  const [loadingMarketPreview, setLoadingMarketPreview] = useState(false)
  const [loadingPageSequencePreview, setLoadingPageSequencePreview] = useState(false)
  const [marketPreviewReady, setMarketPreviewReady] = useState(false)
  const [pageSequenceItems, setPageSequenceItems] = useState<Array<{ heading: string; script: string; audioUrl?: string }>>([])
  const [pageSequenceCompanyGroups, setPageSequenceCompanyGroups] = useState<Array<{ category: string; companies: string[] }>>([])
  const [pageSequenceDurations, setPageSequenceDurations] = useState<number[]>([])
  const [pageSequenceFrames, setPageSequenceFrames] = useState(PREVIEW_FPS * 20)
  const [pageSequenceSourceRows, setPageSequenceSourceRows] = useState<Array<{ id: number; newsId: string; company: string; headline: string; category: string }>>([])
  const [downloadingPreview, setDownloadingPreview] = useState(false)
  const [fullVideos, setFullVideos] = useState<FullVideoRow[]>([])

  const apiBase = useMemo(
    () => String(process.env.NEXT_PUBLIC_API_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, ''),
    []
  )
  const toAbsoluteSrc = (url: string) => {
    const raw = String(url || '').trim()
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    const normalized = raw.startsWith('/') ? raw : `/${raw}`
    return `${apiBase}${normalized}`
  }
  const getAudioDuration = (src: string): Promise<number> =>
    new Promise(resolve => {
      const audio = new Audio()
      const done = (value: number) => resolve(Number.isFinite(value) && value > 0 ? value : 0)
      audio.preload = 'metadata'
      audio.onloadedmetadata = () => done(audio.duration || 0)
      audio.onerror = () => done(0)
      audio.src = src
    })

  const handleDownloadPreview = async () => {
    if (!marketPreviewReady) return
    try {
      setError('')
      setSuccess('')
      setDownloadingPreview(true)
      const scenes = pageSequenceItems.map((item, idx) => ({
        id: idx + 1,
        heading: item.heading,
        onScreenText: item.script,
        durationSec: Number(pageSequenceDurations[idx] || 6),
        audioUrl: item.audioUrl,
        category:
          pageSequenceCompanyGroups.find(group =>
            (group.companies || []).some(company => String(company || '').trim() === String(item.heading || '').trim())
          )?.category || 'Other'
      }))

      if (!scenes.length) throw new Error('No sequence scenes available to render')

      const createRes = await axiosInstance.post(
        ENDURL.NEWS_RENDER_VIDEO,
        {
          title: "Today's Market Updates",
          format: 'landscape',
          qualityMode: 'standard',
          renderMode: 'news_sequence',
          scenes
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const jobId = String(createRes?.data?.data?.jobId || '').trim()
      if (!jobId) throw new Error('Render job was not created')

      const maxTries = 240
      for (let i = 0; i < maxTries; i += 1) {
        const statusUrl = ENDURL.NEWS_RENDER_STATUS.replace(':jobId', jobId)
        const statusRes = await axiosInstance.get(statusUrl, { timeout: LONG_TIMEOUT_MS })
        const status = String(statusRes?.data?.data?.status || '').toLowerCase()
        if (status === 'completed') {
          const videoUrl = String(statusRes?.data?.data?.videoUrl || '').trim()
          if (!videoUrl) throw new Error('Render completed but video URL missing')
          try {
            await axiosInstance.post(
              ENDURL.NEWS_BSE_VIDEOS_CREATE,
              {
                date: filterDate,
                category: category || 'all',
                title: "Today's Market Updates",
                renderJobId: jobId,
                fileName: String(statusRes?.data?.data?.fileName || ''),
                videoUrl,
                status: 'completed',
                newsRows: pageSequenceSourceRows.map(row => ({
                  newsRowId: row.id,
                  newsId: row.newsId,
                  company: row.company,
                  headline: row.headline,
                  category: row.category
                }))
              },
              { timeout: LONG_TIMEOUT_MS }
            )
            await loadFullVideos()
            await loadList()
          } catch (_) {
            // keep download path non-blocking even if record save fails
          }
          const a = document.createElement('a')
          const date = filterDate || new Date().toISOString().slice(0, 10)
          a.href = toAbsoluteSrc(videoUrl)
          a.download = `market-preview-${date}.mp4`
          document.body.appendChild(a)
          a.click()
          a.remove()
          setSuccess('Render completed. Download started.')
          return
        }
        if (status === 'failed') {
          const errMsg = String(statusRes?.data?.data?.error || 'Render failed')
          throw new Error(errMsg)
        }
        await new Promise(resolve => setTimeout(resolve, 2500))
      }
      throw new Error('Render is taking too long, please check status again')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to render and download preview')
    } finally {
      setDownloadingPreview(false)
    }
  }

  const mapRows = (list: any[]): BseItem[] =>
    list.map((item: any) => ({
      id: Number(item?.id || 0),
      newsId: String(item?.newsId || ''),
      newsDate: String(item?.newsDate || ''),
      company: String(item?.company || ''),
      headline: String(item?.headline || ''),
      category: String(item?.category || ''),
      pdfUrl: String(item?.pdfUrl || ''),
      matchStatus: String(item?.matchStatus || 'pending') as 'matched' | 'unmatched' | 'pending',
      matchScore: Number(item?.matchScore || 0),
      newApproachReady: Boolean(
        String(item?.importantPointsText || '').trim() &&
          String(item?.scriptEnglish || '').trim() &&
          String(item?.scriptAudioEnglish || '').trim() &&
          Array.isArray(item?.highlightTerms) &&
          item.highlightTerms.length > 0
      ),
      scriptEnglish: String(item?.scriptEnglish || '').trim(),
      scriptAudioEnglish: String(item?.scriptAudioEnglish || '').trim(),
      highlightTerms: Array.isArray(item?.highlightTerms)
        ? item.highlightTerms.map((term: any) => String(term || '').trim()).filter(Boolean)
        : []
    }))

  const loadCategories = async () => {
    try {
      const res = await axiosInstance.get(ENDURL.NEWS_BSE_CATEGORIES, { timeout: LONG_TIMEOUT_MS })
      const list: string[] = Array.isArray(res?.data?.data?.rows) ? res.data.data.rows.map((item: any) => String(item || '').trim()).filter(Boolean) : []
      setCategories(list)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load categories')
    }
  }

  const loadList = async () => {
    try {
      const params = new URLSearchParams({
        limit: String(rowsPerPage),
        offset: String(page * rowsPerPage),
        date: filterDate,
        category,
        matchStatus: matchView,
        excludeUsedForVideo: category !== 'all' ? 'true' : 'false'
      })
      const res = await axiosInstance.get(`${ENDURL.NEWS_BSE_LIST}?${params.toString()}`, { timeout: LONG_TIMEOUT_MS })
      const data = res?.data?.data || {}
      setRows(Array.isArray(data?.rows) ? mapRows(data.rows) : [])
      setTotalRows(Number(data?.totalRows || 0))
      setMatchedRows(Number(data?.matchedRows || 0))
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load BSE news')
    }
  }

  const loadFullVideos = async () => {
    try {
      const params = new URLSearchParams({
        date: filterDate,
        limit: '50',
        offset: '0'
      })
      const res = await axiosInstance.get(`${ENDURL.NEWS_BSE_VIDEOS_LIST}?${params.toString()}`, { timeout: LONG_TIMEOUT_MS })
      const rowsData = Array.isArray(res?.data?.data?.rows) ? res.data.data.rows : []
      setFullVideos(
        rowsData.map((row: any) => ({
          id: Number(row?.id || 0),
          date: String(row?.date || ''),
          category: String(row?.category || ''),
          title: String(row?.title || ''),
          fileName: String(row?.fileName || ''),
          videoUrl: String(row?.videoUrl || ''),
          totalNews: Number(row?.totalNews || 0),
          createdAt: row?.createdAt || null
        }))
      )
    } catch (_) {
      // non-blocking
    }
  }

  useEffect(() => {
    loadCategories()
    if (typeof window !== 'undefined') {
      const stored = String(window.localStorage.getItem(BATCH_JOB_STORAGE_KEY) || '').trim()
      if (stored) setBatchJobId(stored)
    }
  }, [])

  useEffect(() => {
    loadList()
    loadFullVideos()
  }, [filterDate, category, matchView, page, rowsPerPage])

  useEffect(() => {
    setPage(0)
  }, [filterDate, category, matchView])

  useEffect(() => {
    if (!batchJobId) return
    let timer: ReturnType<typeof setInterval> | null = null
    let stopped = false

    const poll = async () => {
      try {
        const url = ENDURL.NEWS_NEW_APPROACH_BATCH_STATUS.replace(':jobId', batchJobId)
        const res = await axiosInstance.get(url, { timeout: LONG_TIMEOUT_MS })
        const data = (res?.data?.data || null) as BatchProgress | null
        setBatchProgress(data)
        if (!data) return
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'stopped') {
          if (timer) clearInterval(timer)
          if (!stopped) {
            setBatchJobId('')
            if (typeof window !== 'undefined') window.localStorage.removeItem(BATCH_JOB_STORAGE_KEY)
            loadList()
            setSuccess(
              data.status === 'completed'
                ? `Batch completed. Success: ${data.success}, Failed: ${data.failed}, Skipped: ${data.skipped}`
                : data.status === 'stopped'
                ? `Batch stopped. Progress: ${data.processed}/${data.total}`
                : `Batch failed. Success: ${data.success}, Failed: ${data.failed}, Skipped: ${data.skipped}`
            )
          }
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to poll batch status')
      }
    }

    poll()
    timer = setInterval(poll, 2000)
    return () => {
      stopped = true
      if (timer) clearInterval(timer)
    }
  }, [batchJobId])

  const handleFetch = async () => {
    try {
      setError('')
      setSuccess('')
      setLoading(true)
      await axiosInstance.post(ENDURL.NEWS_BSE_FETCH, { date: bseDate, limit: 50, offset: 0 }, { timeout: LONG_TIMEOUT_MS })
      setFilterDate(bseDate)
      await loadCategories()
      await loadList()
      setBseModalOpen(false)
      setSuccess('Latest data fetched and DB list refreshed.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch latest BSE data')
    } finally {
      setLoading(false)
    }
  }

  const handleStopGeneratingContent = async () => {
    if (!batchJobId) return
    try {
      setBatchStopping(true)
      setError('')
      setSuccess('')
      const url = ENDURL.NEWS_NEW_APPROACH_STOP_BATCH.replace(':jobId', batchJobId)
      const res = await axiosInstance.post(url, {}, { timeout: LONG_TIMEOUT_MS })
      const data = (res?.data?.data || null) as BatchProgress | null
      if (data) setBatchProgress(data)
      setSuccess('Stop requested. Current row will be reset before batch stops.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to stop content generation batch')
    } finally {
      setBatchStopping(false)
    }
  }

  const handleStartGeneratingContent = async () => {
    try {
      setError('')
      setSuccess('')
      setBatchStarting(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_NEW_APPROACH_START_BATCH,
        {
          date: filterDate,
          category,
          model: 'gemma3:1b'
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const data = (res?.data?.data || null) as BatchProgress | null
      if (!data?.id) throw new Error('Batch job id not received')
      setBatchProgress(data)
      setBatchJobId(String(data.id))
      if (typeof window !== 'undefined') window.localStorage.setItem(BATCH_JOB_STORAGE_KEY, String(data.id))
      setSuccess('Batch started. Generating Step 1, 2, 3, highlight words, and English audio for matched news.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to start content generation batch')
    } finally {
      setBatchStarting(false)
    }
  }

  const handleLoadMarketPreview = async () => {
    try {
      setError('')
      setSuccess('')
      setLoadingMarketPreview(true)
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0',
        date: filterDate,
        category,
        matchStatus: 'matched'
      })
      const res = await axiosInstance.get(`${ENDURL.NEWS_BSE_LIST}?${params.toString()}`, { timeout: LONG_TIMEOUT_MS })
      const rawRows = Array.isArray(res?.data?.data?.rows) ? mapRows(res.data.data.rows) : []
      if (!rawRows.length) {
        throw new Error('No matched news found for selected date/category')
      }
      const selectedRows = rawRows
        .filter(row => String(row.scriptEnglish || '').trim() && String(row.scriptAudioEnglish || '').trim())
        .slice(0, 20)
      if (!selectedRows.length) {
        throw new Error('No ready news found. Generate Step 3 script+audio first.')
      }
      const intro = "Welcome to today's market updates. Here are the top company headlines for this session."
      const outro = 'That was your quick market roundup. See you in the next bulletin.'

      const introOutroRes = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCENE_AUDIOS,
        {
          language: 'en',
          model: 'lessac',
          scenes: [
            { id: 1, heading: 'Market Opening', narration: intro },
            { id: 2, heading: 'Closing Bell', narration: outro }
          ],
          options: { normalizeText: true, splitSentences: false }
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const generatedScenes = Array.isArray(introOutroRes?.data?.data?.scenes) ? introOutroRes.data.data.scenes : []
      const introAudio = toAbsoluteSrc(String(generatedScenes.find((scene: any) => Number(scene?.id) === 1)?.audioUrl || '').trim())
      const outroAudio = toAbsoluteSrc(String(generatedScenes.find((scene: any) => Number(scene?.id) === 2)?.audioUrl || '').trim())
      if (!introAudio || !outroAudio) {
        throw new Error('Failed to generate intro/outro audio')
      }

      const groupMap = new Map<string, Set<string>>()
      selectedRows.forEach(row => {
        const cat = String(row.category || 'Other').trim() || 'Other'
        const company = String(row.company || '').trim()
        if (!company) return
        if (!groupMap.has(cat)) groupMap.set(cat, new Set<string>())
        groupMap.get(cat)!.add(company)
      })
      const companyGroups = Array.from(groupMap.entries()).map(([cat, companies]) => ({
        category: cat,
        companies: Array.from(companies)
      }))

      const composedItems = [
        { heading: 'Market Opening', script: intro, audioUrl: introAudio },
        ...selectedRows.map(row => ({
          heading: row.company,
          script: row.scriptEnglish,
          audioUrl: toAbsoluteSrc(row.scriptAudioEnglish)
        })),
        { heading: 'Closing Bell', script: outro, audioUrl: outroAudio }
      ]

      const durations = await Promise.all(
        composedItems.map(async item => {
          const d = await getAudioDuration(item.audioUrl || '')
          return Math.max(3, Number(d || 6))
        })
      )
      const frames = Math.max(PREVIEW_FPS * 10, Math.round(durations.reduce((sum, sec) => sum + sec, 0) * PREVIEW_FPS))

      setPageSequenceItems(composedItems)
      setPageSequenceCompanyGroups(companyGroups)
      setPageSequenceDurations(durations)
      setPageSequenceFrames(frames)
      setPageSequenceSourceRows(
        selectedRows.map(row => ({
          id: Number(row.id || 0),
          newsId: String(row.newsId || ''),
          company: String(row.company || ''),
          headline: String(row.headline || ''),
          category: String(row.category || '')
        }))
      )
      setMarketPreviewReady(true)
      setSuccess(`Market preview loaded: intro + ${selectedRows.length} news scenes + outro.`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load market preview')
    } finally {
      setLoadingMarketPreview(false)
    }
  }

  const handleLoadPageSequencePreview = async () => {
    try {
      setError('')
      setSuccess('')
      setLoadingPageSequencePreview(true)

      const candidates = rows
        .map(row => ({
          heading: String(row.company || '').trim(),
          script: String(row.scriptEnglish || '').trim(),
          audioUrl: toAbsoluteSrc(String(row.scriptAudioEnglish || '').trim()),
          category: String(row.category || '').trim() || 'Other'
        }))
        .filter(item => item.heading && item.script && item.audioUrl)
        .slice(0, 20)

      if (!candidates.length) {
        throw new Error('No ready news on this page. Generate Step 3 script+audio first.')
      }

      const groupMap = new Map<string, Set<string>>()
      candidates.forEach(item => {
        if (!groupMap.has(item.category)) groupMap.set(item.category, new Set<string>())
        groupMap.get(item.category)!.add(item.heading)
      })
      const companyGroups = Array.from(groupMap.entries()).map(([cat, companies]) => ({
        category: cat,
        companies: Array.from(companies)
      }))

      const durations = await Promise.all(
        candidates.map(async item => {
          const d = await getAudioDuration(item.audioUrl || '')
          return Math.max(3, Number(d || 6))
        })
      )
      const frames = Math.max(PREVIEW_FPS * 10, Math.round(durations.reduce((sum, sec) => sum + sec, 0) * PREVIEW_FPS))

      setPageSequenceItems(candidates.map(({ heading, script, audioUrl }) => ({ heading, script, audioUrl })))
      setPageSequenceCompanyGroups(companyGroups)
      setPageSequenceDurations(durations)
      setPageSequenceFrames(frames)
      setPageSequenceSourceRows(
        rows
          .filter(row => String(row.scriptEnglish || '').trim() && String(row.scriptAudioEnglish || '').trim())
          .slice(0, candidates.length)
          .map(row => ({
            id: Number(row.id || 0),
            newsId: String(row.newsId || ''),
            company: String(row.company || ''),
            headline: String(row.headline || ''),
            category: String(row.category || '')
          }))
      )
      setMarketPreviewReady(true)
      setSuccess(`Loaded page-sequence preview for ${candidates.length} ready news items.`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load page sequence preview')
    } finally {
      setLoadingPageSequencePreview(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          News Creator
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Latest 50 BSE news from DB. Click a row action to create AI content.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Button variant='contained' onClick={() => setBseModalOpen(true)} disabled={loading}>
                {loading ? 'Fetching...' : 'Fetch New Data'}
              </Button>
              <Button variant='outlined' onClick={() => router.push('/news-creator/create')}>
                Open AI News Creator
              </Button>
              <Button variant='contained' color='success' onClick={handleStartGeneratingContent} disabled={batchStarting || !!batchJobId}>
                {batchStarting ? 'Starting...' : batchJobId ? 'Generation Running...' : 'Start Generating Content'}
              </Button>
              {batchJobId ? (
                <Button variant='outlined' color='error' onClick={handleStopGeneratingContent} disabled={batchStopping}>
                  {batchStopping ? 'Stopping...' : 'Stop Job'}
                </Button>
              ) : null}
              <TextField
                size='small'
                type='date'
                label='Date'
                value={filterDate}
                onChange={event => setFilterDate(event.target.value)}
                sx={{ minWidth: 170 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size='small'
                select
                label='Category'
                value={category}
                onChange={event => setCategory(event.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value='all'>All Categories</MenuItem>
                {categories.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size='small'
                select
                label='Show'
                value={matchView}
                onChange={event => setMatchView(event.target.value as 'matched' | 'unmatched' | 'all')}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value='matched'>Matched</MenuItem>
                <MenuItem value='unmatched'>Unmatched</MenuItem>
                <MenuItem value='all'>All</MenuItem>
              </TextField>
              <Chip label={`Rows: ${totalRows}`} color='primary' variant='outlined' />
              <Chip label={`Matched: ${matchedRows}`} color='success' variant='outlined' />
            </Stack>
            <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
              Batch always runs for matched news only, based on selected Date + Category, across all DB rows (not only visible 50).
            </Typography>
            {batchProgress ? (
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Chip
                    size='small'
                    label={`Status: ${batchProgress.status}`}
                    color={
                      batchProgress.status === 'running' || batchProgress.status === 'stopping'
                        ? 'warning'
                        : batchProgress.status === 'completed' || batchProgress.status === 'stopped'
                        ? 'success'
                        : 'error'
                    }
                  />
                  <Chip size='small' label={`Progress: ${batchProgress.progress}%`} />
                  <Chip size='small' label={`Processed: ${batchProgress.processed}/${batchProgress.total}`} />
                  <Chip size='small' label={`Success: ${batchProgress.success}`} color='success' variant='outlined' />
                  <Chip size='small' label={`Failed: ${batchProgress.failed}`} color='error' variant='outlined' />
                  <Chip size='small' label={`Skipped: ${batchProgress.skipped}`} variant='outlined' />
                </Stack>
                <LinearProgress variant='determinate' value={Math.max(0, Math.min(100, Number(batchProgress.progress || 0)))} />
                {batchProgress.currentHeadline ? (
                  <Typography variant='caption' color='text.secondary'>
                    Running: {batchProgress.currentHeadline}
                  </Typography>
                ) : null}
              </Stack>
            ) : null}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 620 }}>
              <Table size='small' stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Headline</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>New Approach</TableCell>
                    <TableCell>PDF</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>{row.newsDate || '-'}</TableCell>
                      <TableCell>{row.company || '-'}</TableCell>
                      <TableCell>{row.headline || '-'}</TableCell>
                      <TableCell>{row.category || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={row.matchStatus}
                          color={row.matchStatus === 'matched' ? 'success' : row.matchStatus === 'pending' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{row.matchScore}</TableCell>
                      <TableCell>
                        <Chip size='small' label={row.newApproachReady ? 'Done' : 'Pending'} color={row.newApproachReady ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell>
                        {row.pdfUrl ? (
                          <Button size='small' variant='text' href={row.pdfUrl} target='_blank' rel='noreferrer'>
                            Open
                          </Button>
                        ) : (
                          'No'
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction='row' spacing={1}>
                          <Button size='small' variant='contained' onClick={() => router.push(`/news-creator/create?newsId=${row.id}`)}>
                            Create Content
                          </Button>
                          <Button size='small' variant='outlined' onClick={() => router.push(`/news-creator/new-approach?newsId=${row.id}`)}>
                            {row.newApproachReady ? 'Open (Ready)' : 'New Approach'}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component='div'
              count={totalRows}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={event => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[25, 50, 100]}
            />
            <Stack direction='row' justifyContent='flex-end' sx={{ mt: 1 }}>
              <Button variant='outlined' onClick={handleLoadMarketPreview} disabled={loadingMarketPreview}>
                {loadingMarketPreview ? 'Loading Preview...' : 'Load Market Preview'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant='h6'>Market Preview Mode</Typography>
              <Typography variant='body2' color='text.secondary'>
                Market Preview: intro + news-by-news sequence + outro.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant='outlined' onClick={handleLoadMarketPreview} disabled={loadingMarketPreview}>
                  {loadingMarketPreview ? 'Loading Market Preview...' : 'Load Market Preview'}
                </Button>
                <Button variant='outlined' onClick={handleLoadPageSequencePreview} disabled={loadingPageSequencePreview}>
                  {loadingPageSequencePreview ? 'Loading Page Sequence...' : 'Load Page News Sequence Preview'}
                </Button>
                <Button variant='contained' onClick={handleDownloadPreview} disabled={downloadingPreview || !marketPreviewReady}>
                  {downloadingPreview ? 'Downloading...' : 'Download Preview'}
                </Button>
              </Stack>
              {marketPreviewReady ? (
                <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', p: 1 }}>
                  <Player
                    component={NewsApproachSequenceComposition}
                    durationInFrames={pageSequenceFrames}
                    fps={PREVIEW_FPS}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{ width: '100%', maxWidth: 980, aspectRatio: '16 / 9', margin: '0 auto' }}
                    inputProps={{
                      title: "Today's Market Updates",
                      dateLabel: filterDate,
                      items: pageSequenceItems,
                      sceneDurationsSec: pageSequenceDurations,
                      companyGroups: pageSequenceCompanyGroups
                    }}
                    controls
                    acknowledgeRemotionLicense
                  />
                </Box>
              ) : (
                <Alert severity='info'>Load either Market Preview or Page News Sequence Preview.</Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant='h6'>Videos Created Today</Typography>
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>News Count</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Video</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fullVideos.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date || '-'}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell>{item.title || '-'}</TableCell>
                        <TableCell>{item.totalNews}</TableCell>
                        <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</TableCell>
                        <TableCell>
                          {item.videoUrl ? (
                            <Button
                              size='small'
                              variant='outlined'
                              href={toAbsoluteSrc(item.videoUrl)}
                              target='_blank'
                              rel='noreferrer'
                            >
                              Open
                            </Button>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!fullVideos.length ? (
                      <TableRow>
                        <TableCell colSpan={6}>No videos recorded for selected date.</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={bseModalOpen} onClose={() => setBseModalOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Fetch BSE Data</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              type='date'
              label='Date'
              value={bseDate}
              onChange={event => setBseDate(event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBseModalOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleFetch} variant='contained' disabled={loading || !bseDate}>
            {loading ? 'Fetching...' : 'Fetch'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default NewsCreatorListPage
