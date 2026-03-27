import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { NewsApproachOneComposition } from 'src/remotion/NewsApproachOneComposition'
import { ShortScriptAudioPreviewComposition } from 'src/remotion/ShortScriptAudioPreviewComposition'

const LONG_TIMEOUT_MS = 8 * 60 * 1000
const PREVIEW_FPS = 30
const Player = dynamic(() => import('@remotion/player').then(mod => mod.Player), { ssr: false })

type CachedAnalysis = {
  importantPointsText: string
  scriptEnglish: string
  scriptHindi: string
  scriptAudioEnglish: string
  scriptAudioHindi: string
  highlightTerms: string[]
  highlightTermsPositive: string[]
  highlightTermsNegative: string[]
}

const NewApproachPage: NextPage = () => {
  const router = useRouter()
  const [newsId, setNewsId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [model, setModel] = useState('gemma3:1b')
  const [summaryPoints, setSummaryPoints] = useState('')
  const [importantPoints, setImportantPoints] = useState('')
  const [script, setScript] = useState('')
  const [language, setLanguage] = useState<'english' | 'hindi'>('english')
  const [audioSrc, setAudioSrc] = useState('')
  const [audioFileName, setAudioFileName] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingImportant, setLoadingImportant] = useState(false)
  const [loadingScript, setLoadingScript] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [loadingHighlights, setLoadingHighlights] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewDurationFrames, setPreviewDurationFrames] = useState(PREVIEW_FPS * 10)
  const [previewMode, setPreviewMode] = useState<'approach1' | 'approach2'>('approach1')
  const [previewLayout, setPreviewLayout] = useState<'landscape' | 'short'>('landscape')
  const [highlightTerms, setHighlightTerms] = useState<string[]>([])
  const [highlightTermsImportant, setHighlightTermsImportant] = useState<string[]>([])
  const [highlightTermsPositive, setHighlightTermsPositive] = useState<string[]>([])
  const [highlightTermsNegative, setHighlightTermsNegative] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cached, setCached] = useState<CachedAnalysis | null>(null)
  const [customScript, setCustomScript] = useState('')
  const [customAudioSrc, setCustomAudioSrc] = useState('')
  const [customAudioFileName, setCustomAudioFileName] = useState('')
  const [customAudioLoading, setCustomAudioLoading] = useState(false)
  const [customPreviewReady, setCustomPreviewReady] = useState(false)
  const [customPreviewLayout, setCustomPreviewLayout] = useState<'landscape' | 'short'>('landscape')

  const apiBase = useMemo(
    () => String(process.env.NEXT_PUBLIC_API_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, ''),
    []
  )
  const toAbsoluteSrc = (url: string) => {
    let raw = String(url || '').trim()
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    if (raw.startsWith('/tts/audio/') || raw.startsWith('tts/audio/')) {
      raw = raw.replace(/^\/?tts\/audio\//, 'content/tts/audio/')
    }
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

  const isAlreadyAnalyzed = Boolean((cached?.importantPointsText || '').trim())

  useEffect(() => {
    const id = String(router.query?.newsId || '').trim()
    if (id) setNewsId(id)
  }, [router.query?.newsId])

  useEffect(() => {
    const load = async () => {
      if (!newsId) return
      try {
        const url = ENDURL.NEWS_BSE_ITEM.replace(':id', newsId)
        const res = await axiosInstance.get(url, { timeout: LONG_TIMEOUT_MS })
        const row = res?.data?.data || {}
        setCompanyName(String(row?.company || row?.companyName || row?.slongname || '').trim())
        const nextCached: CachedAnalysis = {
          importantPointsText: String(row?.importantPointsText || '').trim(),
          scriptEnglish: String(row?.scriptEnglish || '').trim(),
          scriptHindi: String(row?.scriptHindi || '').trim(),
          scriptAudioEnglish: String(row?.scriptAudioEnglish || '').trim(),
          scriptAudioHindi: String(row?.scriptAudioHindi || '').trim(),
          highlightTerms: Array.isArray(row?.highlightTerms)
            ? row.highlightTerms.map((item: any) => String(item || '').trim()).filter(Boolean)
            : [],
          highlightTermsPositive: Array.isArray(row?.highlightTermsPositive)
            ? row.highlightTermsPositive.map((item: any) => String(item || '').trim()).filter(Boolean)
            : [],
          highlightTermsNegative: Array.isArray(row?.highlightTermsNegative)
            ? row.highlightTermsNegative.map((item: any) => String(item || '').trim()).filter(Boolean)
            : []
        }
        setCached(nextCached)
        if (nextCached.importantPointsText) {
          setImportantPoints(nextCached.importantPointsText)
        }
        setHighlightTerms(nextCached.highlightTerms)
        setHighlightTermsPositive(nextCached.highlightTermsPositive)
        setHighlightTermsNegative(nextCached.highlightTermsNegative)
        const posSet = new Set(nextCached.highlightTermsPositive.map(item => item.toLowerCase()))
        const negSet = new Set(nextCached.highlightTermsNegative.map(item => item.toLowerCase()))
        setHighlightTermsImportant(nextCached.highlightTerms.filter(item => !posSet.has(item.toLowerCase()) && !negSet.has(item.toLowerCase())))
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load news analysis data')
      }
    }
    load()
  }, [newsId])

  useEffect(() => {
    if (!cached) return
    if (language === 'hindi') {
      setScript(String(cached.scriptHindi || '').trim())
      setAudioFileName(String(cached.scriptAudioHindi || '').trim())
      setAudioSrc(toAbsoluteSrc(String(cached.scriptAudioHindi || '').trim()))
      return
    }
    setScript(String(cached.scriptEnglish || '').trim())
    setAudioFileName(String(cached.scriptAudioEnglish || '').trim())
    setAudioSrc(toAbsoluteSrc(String(cached.scriptAudioEnglish || '').trim()))
  }, [language, cached])

  const handleSummarize = async () => {
    if (!newsId) return
    try {
      setError('')
      setSuccess('')
      setLoadingSummary(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_NEW_APPROACH_SUMMARIZE,
        { newsId: Number(newsId), model: model.trim() || undefined },
        { timeout: LONG_TIMEOUT_MS }
      )
      const text = String(res?.data?.data?.summaryPoints || '').trim()
      setSummaryPoints(text)
      setSuccess('Summary points generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate summary points')
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleImportant = async () => {
    if (!summaryPoints.trim() || !newsId) return
    try {
      setError('')
      setSuccess('')
      setLoadingImportant(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_NEW_APPROACH_IMPORTANT,
        { newsId: Number(newsId), summary: summaryPoints.trim(), model: model.trim() || undefined },
        { timeout: LONG_TIMEOUT_MS }
      )
      const text = String(res?.data?.data?.importantPoints || '').trim()
      setImportantPoints(text)
        setCached(prev => ({
          importantPointsText: text,
          scriptEnglish: String(prev?.scriptEnglish || ''),
          scriptHindi: String(prev?.scriptHindi || ''),
          scriptAudioEnglish: String(prev?.scriptAudioEnglish || ''),
          scriptAudioHindi: String(prev?.scriptAudioHindi || ''),
          highlightTerms: Array.isArray(prev?.highlightTerms) ? prev.highlightTerms : [],
          highlightTermsPositive: Array.isArray(prev?.highlightTermsPositive) ? prev.highlightTermsPositive : [],
          highlightTermsNegative: Array.isArray(prev?.highlightTermsNegative) ? prev.highlightTermsNegative : []
        }))
      setSuccess('Important points generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate important points')
    } finally {
      setLoadingImportant(false)
    }
  }

  const handleScript = async () => {
    if (!importantPoints.trim() || !newsId) return
    try {
      setError('')
      setSuccess('')
      setLoadingScript(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_NEW_APPROACH_SCRIPT,
        {
          newsId: Number(newsId),
          points: importantPoints.trim(),
          language,
          model: model.trim() || undefined
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const text = String(res?.data?.data?.script || '').trim()
      setScript(text)
      setAudioSrc('')
      setAudioFileName('')
      setPreviewReady(false)
      setCached(prev => {
        const base = prev || {
          importantPointsText: importantPoints,
          scriptEnglish: '',
          scriptHindi: '',
          scriptAudioEnglish: '',
          scriptAudioHindi: '',
          highlightTerms: [],
          highlightTermsPositive: [],
          highlightTermsNegative: []
        }
        return language === 'hindi'
          ? { ...base, scriptHindi: text, scriptAudioHindi: '' }
          : { ...base, scriptEnglish: text, scriptAudioEnglish: '' }
      })
      setSuccess('Script generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate script')
    } finally {
      setLoadingScript(false)
    }
  }

  const handleScriptAudio = async () => {
    if (!script.trim() || !newsId) return
    try {
      setError('')
      setSuccess('')
      setLoadingAudio(true)
      const ttsModel = language === 'hindi' ? 'paratham' : 'lessac'
      const res = await axiosInstance.post(
        ENDURL.NEWS_NEW_APPROACH_SCRIPT_AUDIO,
        {
          newsId: Number(newsId),
          script: script.trim(),
          language,
          model: ttsModel
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const audioUrl = String(res?.data?.data?.audioUrl || '').trim()
      const absolute = toAbsoluteSrc(audioUrl)
      setAudioFileName(String(res?.data?.data?.audioFileName || '').trim())
      setAudioSrc(absolute)
      setPreviewReady(false)
      setCached(prev => {
        const base = prev || {
          importantPointsText: importantPoints,
          scriptEnglish: '',
          scriptHindi: '',
          scriptAudioEnglish: '',
          scriptAudioHindi: '',
          highlightTerms: [],
          highlightTermsPositive: [],
          highlightTermsNegative: []
        }
        return language === 'hindi'
          ? { ...base, scriptAudioHindi: audioUrl }
          : { ...base, scriptAudioEnglish: audioUrl }
      })
      setSuccess('Script audio generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate script audio')
    } finally {
      setLoadingAudio(false)
    }
  }

  const handlePreparePreview = async () => {
    if (!script.trim() || !audioSrc.trim()) return
    try {
      setError('')
      setSuccess('')
      const audioDuration = await getAudioDuration(audioSrc)
      const durationFrames = Math.max(PREVIEW_FPS * 6, Math.round((Number(audioDuration || 0) || 8) * PREVIEW_FPS))
      setPreviewDurationFrames(durationFrames)
      setPreviewReady(true)
      setPreviewMode('approach1')
      setPreviewLayout('landscape')
      setSuccess('Preview is ready. This is frontend Remotion preview mode only.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to prepare preview')
    }
  }

  const handlePrepareApproach2Preview = async () => {
    if (!importantPoints.trim() || !audioSrc.trim()) return
    try {
      setError('')
      setSuccess('')
      const durationSec = await getAudioDuration(audioSrc)
      const durationFrames = Math.max(PREVIEW_FPS * 6, Math.round((Number(durationSec || 0) || 8) * PREVIEW_FPS))
      setPreviewDurationFrames(durationFrames)
      setPreviewMode('approach2')
      setPreviewReady(true)
      setPreviewLayout('landscape')
      setSuccess('Approach 2 preview is ready (using Step 3 audio).')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to prepare approach 2 preview')
    }
  }

  const handleExtractHighlights = async () => {
    if (!script.trim()) return
    try {
      setError('')
      setSuccess('')
      setLoadingHighlights(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_NEW_APPROACH_HIGHLIGHT_TERMS,
        {
          newsId: Number(newsId),
          script: script.trim(),
          language,
          model: model.trim() || undefined
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const terms = Array.isArray(res?.data?.data?.terms) ? res.data.data.terms.map((item: any) => String(item || '').trim()).filter(Boolean) : []
      const positiveTerms = Array.isArray(res?.data?.data?.positiveTerms)
        ? res.data.data.positiveTerms.map((item: any) => String(item || '').trim()).filter(Boolean)
        : []
      const negativeTerms = Array.isArray(res?.data?.data?.negativeTerms)
        ? res.data.data.negativeTerms.map((item: any) => String(item || '').trim()).filter(Boolean)
        : []
      const importantTerms = Array.isArray(res?.data?.data?.importantTerms)
        ? res.data.data.importantTerms.map((item: any) => String(item || '').trim()).filter(Boolean)
        : []
      const derivedImportant =
        importantTerms.length > 0
          ? importantTerms
          : terms.filter(
              term =>
                !positiveTerms.some(p => p.toLowerCase() === term.toLowerCase()) &&
                !negativeTerms.some(n => n.toLowerCase() === term.toLowerCase())
            )
      setHighlightTerms(terms)
      setHighlightTermsImportant(derivedImportant)
      setHighlightTermsPositive(positiveTerms)
      setHighlightTermsNegative(negativeTerms)
      setCached(prev => ({
        importantPointsText: String(prev?.importantPointsText || importantPoints || ''),
        scriptEnglish: String(prev?.scriptEnglish || ''),
        scriptHindi: String(prev?.scriptHindi || ''),
        scriptAudioEnglish: String(prev?.scriptAudioEnglish || ''),
        scriptAudioHindi: String(prev?.scriptAudioHindi || ''),
        highlightTerms: terms,
        highlightTermsPositive: positiveTerms,
        highlightTermsNegative: negativeTerms
      }))
      setSuccess(`Highlight terms generated (${terms.length}).`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to extract highlight terms')
    } finally {
      setLoadingHighlights(false)
    }
  }

  const previewHeading = useMemo(() => {
    const company = String(companyName || '').trim()
    if (company) return company
    return `News ${newsId || ''}`.trim() || 'Major News Update'
  }, [companyName, newsId])

  const mergedHighlightTerms = useMemo(
    () =>
      Array.from(
        new Set(
          [...highlightTermsImportant, ...highlightTermsPositive, ...highlightTermsNegative]
            .map(item => String(item || '').trim())
            .filter(Boolean)
        )
      ),
    [highlightTermsImportant, highlightTermsPositive, highlightTermsNegative]
  )

  const handlePreparePreviewShort = async () => {
    if (!script.trim() || !audioSrc.trim()) return
    try {
      setError('')
      setSuccess('')
      const audioDuration = await getAudioDuration(audioSrc)
      const durationFrames = Math.max(PREVIEW_FPS * 6, Math.round((Number(audioDuration || 0) || 8) * PREVIEW_FPS))
      setPreviewDurationFrames(durationFrames)
      setPreviewReady(true)
      setPreviewMode('approach1')
      setPreviewLayout('short')
      setSuccess('Short paragraph preview is ready.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to prepare short paragraph preview')
    }
  }

  const handlePrepareApproach2PreviewShort = async () => {
    if (!importantPoints.trim() || !audioSrc.trim()) return
    try {
      setError('')
      setSuccess('')
      const durationSec = await getAudioDuration(audioSrc)
      const durationFrames = Math.max(PREVIEW_FPS * 6, Math.round((Number(durationSec || 0) || 8) * PREVIEW_FPS))
      setPreviewDurationFrames(durationFrames)
      setPreviewMode('approach2')
      setPreviewReady(true)
      setPreviewLayout('short')
      setSuccess('Short bullet preview is ready.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to prepare short bullet preview')
    }
  }

  const handleGenerateCustomAudio = async () => {
    if (!customScript.trim() || !newsId) return
    try {
      setError('')
      setSuccess('')
      setCustomAudioLoading(true)
      const ttsModel = language === 'hindi' ? 'paratham' : 'lessac'
      const res = await axiosInstance.post(
        ENDURL.NEWS_NEW_APPROACH_SCRIPT_AUDIO,
        {
          newsId: Number(newsId),
          script: customScript.trim(),
          language,
          model: ttsModel
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const audioUrl = String(res?.data?.data?.audioUrl || '').trim()
      const absolute = toAbsoluteSrc(audioUrl)
      setCustomAudioFileName(String(res?.data?.data?.audioFileName || '').trim())
      setCustomAudioSrc(absolute)
      setCustomPreviewReady(false)
      setSuccess('Custom script audio generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate custom script audio')
    } finally {
      setCustomAudioLoading(false)
    }
  }

  const handlePrepareCustomPreview = async (layout: 'landscape' | 'short') => {
    if (!customScript.trim() || !customAudioSrc.trim()) return
    try {
      setError('')
      setSuccess('')
      const durationSec = await getAudioDuration(customAudioSrc)
      const durationFrames = Math.max(PREVIEW_FPS * 6, Math.round((Number(durationSec || 0) || 8) * PREVIEW_FPS))
      setPreviewDurationFrames(durationFrames)
      setCustomPreviewReady(true)
      setCustomPreviewLayout(layout)
      setSuccess(layout === 'short' ? 'Short preview is ready.' : 'Landscape preview is ready.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to prepare custom preview')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Stack direction='row' spacing={2} alignItems='center'>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            New Approach
          </Typography>
          <Button variant='outlined' onClick={() => router.push('/news-creator')}>
            Back To News List
          </Button>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label='News ID' value={newsId} onChange={e => setNewsId(e.target.value)} sx={{ maxWidth: 220 }} />
              <TextField label='Model' value={model} onChange={e => setModel(e.target.value)} sx={{ maxWidth: 260 }} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>Step 4: Paste Script + Generate Audio + Preview</Typography>
              <TextField
                label='Paste Script Here'
                value={customScript}
                onChange={e => setCustomScript(e.target.value)}
                multiline
                minRows={10}
                fullWidth
              />
              <Stack direction='row' spacing={2}>
                <Button variant='contained' onClick={handleGenerateCustomAudio} disabled={customAudioLoading || !customScript.trim() || !newsId}>
                  {customAudioLoading ? 'Generating Audio...' : 'Generate Audio'}
                </Button>
                <Button variant='outlined' onClick={() => handlePrepareCustomPreview('landscape')} disabled={!customScript.trim() || !customAudioSrc.trim()}>
                  Preview Landscape
                </Button>
                <Button variant='outlined' onClick={() => handlePrepareCustomPreview('short')} disabled={!customScript.trim() || !customAudioSrc.trim()}>
                  Preview Short
                </Button>
              </Stack>
              {customAudioSrc ? (
                <Stack spacing={1}>
                  <Typography variant='body2' color='text.secondary'>
                    Audio: {customAudioFileName || 'generated'}
                  </Typography>
                  <audio controls src={customAudioSrc} />
                </Stack>
              ) : null}
              {customPreviewReady ? (
                <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', p: 1 }}>
                  <Player
                    component={ShortScriptAudioPreviewComposition}
                    durationInFrames={previewDurationFrames}
                    fps={PREVIEW_FPS}
                    compositionWidth={customPreviewLayout === 'short' ? 1080 : 1920}
                    compositionHeight={customPreviewLayout === 'short' ? 1920 : 1080}
                    style={{
                      width: '100%',
                      maxWidth: customPreviewLayout === 'short' ? 520 : 920,
                      aspectRatio: customPreviewLayout === 'short' ? '9 / 16' : '16 / 9',
                      margin: '0 auto'
                    }}
                    inputProps={{
                      title: previewHeading,
                      script: customScript.trim(),
                      audioUrl: customAudioSrc,
                      stylePreset: 'data'
                    }}
                    controls
                    acknowledgeRemotionLicense
                  />
                </Box>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {!isAlreadyAnalyzed ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant='h6'>Step 1: Analyze PDF And Get Short Summary Points</Typography>
                <Button variant='contained' onClick={handleSummarize} disabled={loadingSummary || !newsId}>
                  {loadingSummary ? 'Generating...' : 'Analyze PDF And Get Summary Points'}
                </Button>
                <TextField
                  label='Summary Points'
                  value={summaryPoints}
                  onChange={e => setSummaryPoints(e.target.value)}
                  multiline
                  minRows={8}
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : (
        <Grid item xs={12}>
          <Alert severity='info'>This news is already analyzed. Step 1 is skipped and saved results are loaded.</Alert>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>Step 2: Get Only Important Points For News</Typography>
              {!isAlreadyAnalyzed ? (
                <Button variant='outlined' onClick={handleImportant} disabled={loadingImportant || !summaryPoints.trim() || !newsId}>
                  {loadingImportant ? 'Generating...' : 'Get Important Points'}
                </Button>
              ) : null}
              <Divider />
              <TextField
                label='Important Points'
                value={importantPoints}
                onChange={e => setImportantPoints(e.target.value)}
                multiline
                minRows={8}
                fullWidth
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>Step 3: Generate Script + Audio ({language === 'hindi' ? 'Hindi' : 'English'})</Typography>
              <TextField
                select
                label='Script Language'
                value={language}
                onChange={e => setLanguage(e.target.value as 'english' | 'hindi')}
                sx={{ maxWidth: 220 }}
              >
                <MenuItem value='english'>English</MenuItem>
                <MenuItem value='hindi'>Hindi</MenuItem>
              </TextField>
              <Stack direction='row' spacing={2}>
                <Button variant='contained' onClick={handleScript} disabled={loadingScript || !importantPoints.trim() || !newsId}>
                  {loadingScript ? 'Generating...' : 'Generate Script'}
                </Button>
                <Button variant='outlined' onClick={handleScriptAudio} disabled={loadingAudio || !script.trim() || !newsId}>
                  {loadingAudio ? 'Generating Audio...' : 'Generate Audio'}
                </Button>
                <Button variant='outlined' onClick={handleExtractHighlights} disabled={loadingHighlights || !script.trim()}>
                  {loadingHighlights ? 'Finding Highlights...' : 'AI Highlight Words'}
                </Button>
                <Button variant='outlined' onClick={handlePreparePreview} disabled={!script.trim() || !audioSrc.trim()}>
                  Preview Paragraph Video
                </Button>
                <Button variant='outlined' onClick={handlePreparePreviewShort} disabled={!script.trim() || !audioSrc.trim()}>
                  Preview Paragraph Short
                </Button>
                <Button
                  variant='outlined'
                  onClick={handlePrepareApproach2Preview}
                  disabled={!importantPoints.trim() || !audioSrc.trim()}
                >
                  Preview Bullet Points Video
                </Button>
                <Button
                  variant='outlined'
                  onClick={handlePrepareApproach2PreviewShort}
                  disabled={!importantPoints.trim() || !audioSrc.trim()}
                >
                  Preview Bullet Short
                </Button>
              </Stack>
              <Divider />
              <TextField
                label='Generated Script'
                value={script}
                onChange={e => setScript(e.target.value)}
                multiline
                minRows={10}
                fullWidth
              />
              {highlightTerms.length || highlightTermsImportant.length || highlightTermsPositive.length || highlightTermsNegative.length ? (
                <Stack spacing={1.5}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Highlight Terms (classified)
                  </Typography>
                  <TextField
                    label='Important'
                    value={highlightTermsImportant.join(', ')}
                    onChange={e =>
                      setHighlightTermsImportant(
                        String(e.target.value || '')
                          .split(',')
                          .map(item => item.trim())
                          .filter(Boolean)
                      )
                    }
                    fullWidth
                  />
                  {highlightTermsImportant.length ? (
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      {highlightTermsImportant.map((term, idx) => (
                        <Chip key={`i-${idx}-${term}`} label={term} size='small' sx={{ bgcolor: 'rgba(59,130,246,0.14)', color: '#1d4ed8' }} />
                      ))}
                    </Stack>
                  ) : null}

                  <TextField
                    label='Positive'
                    value={highlightTermsPositive.join(', ')}
                    onChange={e =>
                      setHighlightTermsPositive(
                        String(e.target.value || '')
                          .split(',')
                          .map(item => item.trim())
                          .filter(Boolean)
                      )
                    }
                    fullWidth
                  />
                  {highlightTermsPositive.length ? (
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      {highlightTermsPositive.map((term, idx) => (
                        <Chip key={`p-${idx}-${term}`} label={term} size='small' sx={{ bgcolor: 'rgba(34,197,94,0.14)', color: '#166534' }} />
                      ))}
                    </Stack>
                  ) : null}

                  <TextField
                    label='Negative'
                    value={highlightTermsNegative.join(', ')}
                    onChange={e =>
                      setHighlightTermsNegative(
                        String(e.target.value || '')
                          .split(',')
                          .map(item => item.trim())
                          .filter(Boolean)
                      )
                    }
                    fullWidth
                  />
                  {highlightTermsNegative.length ? (
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      {highlightTermsNegative.map((term, idx) => (
                        <Chip key={`n-${idx}-${term}`} label={term} size='small' sx={{ bgcolor: 'rgba(239,68,68,0.14)', color: '#991b1b' }} />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              ) : null}
              {audioSrc ? (
                <Stack spacing={1}>
                  <Typography variant='body2' color='text.secondary'>
                    Audio: {audioFileName || 'generated'}
                  </Typography>
                  <audio controls src={audioSrc} />
                </Stack>
              ) : null}
              {previewReady ? (
                <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', p: 1 }}>
                  {previewMode === 'approach2' ? (
                    <Player
                      component={ShortScriptAudioPreviewComposition}
                      durationInFrames={previewDurationFrames}
                      fps={PREVIEW_FPS}
                      compositionWidth={previewLayout === 'short' ? 1080 : 1920}
                      compositionHeight={previewLayout === 'short' ? 1920 : 1080}
                      style={{
                        width: '100%',
                        maxWidth: previewLayout === 'short' ? 520 : 920,
                        aspectRatio: previewLayout === 'short' ? '9 / 16' : '16 / 9',
                        margin: '0 auto'
                      }}
                      inputProps={{
                        title: previewHeading,
                        script: importantPoints.trim(),
                        audioUrl: audioSrc,
                        stylePreset: 'data',
                        highlightKeywords: mergedHighlightTerms,
                        positiveHighlightKeywords: highlightTermsPositive,
                        negativeHighlightKeywords: highlightTermsNegative
                      }}
                      controls
                      acknowledgeRemotionLicense
                    />
                  ) : (
                    <Player
                      component={NewsApproachOneComposition}
                      durationInFrames={previewDurationFrames}
                      fps={PREVIEW_FPS}
                      compositionWidth={previewLayout === 'short' ? 1080 : 1920}
                      compositionHeight={previewLayout === 'short' ? 1920 : 1080}
                      style={{
                        width: '100%',
                        maxWidth: previewLayout === 'short' ? 520 : 920,
                        aspectRatio: previewLayout === 'short' ? '9 / 16' : '16 / 9',
                        margin: '0 auto'
                      }}
                      inputProps={{
                        title: 'Stock News Bulletin',
                        scenes: [
                          {
                            id: 1,
                            heading: previewHeading,
                            onScreenText: script.trim(),
                            audioUrl: audioSrc,
                            highlightKeywords: mergedHighlightTerms,
                            positiveHighlightKeywords: highlightTermsPositive,
                            negativeHighlightKeywords: highlightTermsNegative
                          }
                        ]
                      }}
                      controls
                      acknowledgeRemotionLicense
                    />
                  )}
                </Box>
              ) : null}
            </Stack>
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

export default NewApproachPage
