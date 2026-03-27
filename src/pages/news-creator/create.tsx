import { useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { NewsScriptHighlightsComposition } from 'src/remotion/NewsScriptHighlightsComposition'
import { ShortScriptAudioPreviewComposition } from 'src/remotion/ShortScriptAudioPreviewComposition'

const LONG_TIMEOUT_MS = 8 * 60 * 1000
const PREVIEW_FPS = 30
type ExtraInfoType = 'GENERAL_CONTEXT' | 'SUBTOPIC_LIST' | 'CONTEXT_PLUS_SUBTOPICS'

type SceneItem = {
  id: number
  heading: string
  narration: string
  onScreenText?: string
  voiceStyle?: string
  durationSec: number
  fileName?: string
  audioUrl?: string
  audioSrc?: string
  imageName?: string
  imagePreviewUrl?: string
  imageUrl?: string
}

type ScriptPackage = {
  title: string
  hook: string
  videoScript: string
  cta: string
  estimatedWords: number
  model?: string
}

const defaultTopic = 'Nifty market outlook for next week'
const defaultInfo = 'Focus on retail investors, simple language, and include risk reminder.'

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Unable to read image file'))
    reader.readAsDataURL(file)
  })

const compressImageToDataUrl = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Selected file is not an image')
  const originalDataUrl = await toDataUrl(file)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Unable to load selected image'))
    img.src = originalDataUrl
  })
  const maxDim = 1600
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height))
  const targetW = Math.max(1, Math.round(img.width * ratio))
  const targetH = Math.max(1, Math.round(img.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) return originalDataUrl
  ctx.drawImage(img, 0, 0, targetW, targetH)
  return canvas.toDataURL('image/jpeg', 0.82)
}

const RemotionPlayer = dynamic(() => import('@remotion/player').then(mod => mod.Player), {
  ssr: false
})

const NewsCreatorBuildPage: NextPage = () => {
  const router = useRouter()
  const [topic, setTopic] = useState(defaultTopic)
  const [extraInfoType, setExtraInfoType] = useState<ExtraInfoType>('GENERAL_CONTEXT')
  const [extraInfo, setExtraInfo] = useState(defaultInfo)
  const [subtopicsText, setSubtopicsText] = useState('')
  const [platform, setPlatform] = useState('YouTube')
  const [tone, setTone] = useState('confident and educational')
  const [language, setLanguage] = useState<'en' | 'hi'>('en')
  const [targetDurationSec, setTargetDurationSec] = useState(90)
  const [scriptLength, setScriptLength] = useState<'short' | 'long'>('short')
  const [model, setModel] = useState('gemma3:1b')
  const [sceneCount, setSceneCount] = useState(8)
  const [renderFormat, setRenderFormat] = useState<'vertical' | 'landscape' | 'square'>('vertical')
  const [qualityMode, setQualityMode] = useState<'draft' | 'standard' | 'high'>('standard')
  const [videoStylePreset, setVideoStylePreset] = useState<'flash' | 'data' | 'story'>('flash')
  const [scriptPack, setScriptPack] = useState<ScriptPackage | null>(null)
  const [longScript, setLongScript] = useState('')
  const [shortScript, setShortScript] = useState('')
  const [scenes, setScenes] = useState<SceneItem[]>([])
  const [normalizeText, setNormalizeText] = useState(true)
  const [splitSentences, setSplitSentences] = useState(false)
  const [loadingScript, setLoadingScript] = useState(false)
  const [loadingSplit, setLoadingSplit] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [uploadingSceneId, setUploadingSceneId] = useState<number | null>(null)
  const [rendering, setRendering] = useState(false)
  const [renderJobId, setRenderJobId] = useState('')
  const [renderStatus, setRenderStatus] = useState('')
  const [renderProgress, setRenderProgress] = useState(0)
  const [estimatedRenderSeconds, setEstimatedRenderSeconds] = useState(0)
  const [renderVideoUrl, setRenderVideoUrl] = useState('')
  const [scriptAudioLoading, setScriptAudioLoading] = useState(false)
  const [scriptAudioSrc, setScriptAudioSrc] = useState('')
  const [scriptAudioFileName, setScriptAudioFileName] = useState('')
  const [shortPreviewAudioLoading, setShortPreviewAudioLoading] = useState(false)
  const [shortPreviewAudioSrc, setShortPreviewAudioSrc] = useState('')
  const [shortPreviewAudioFileName, setShortPreviewAudioFileName] = useState('')
  const [shorteningScript, setShorteningScript] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const totalDuration = useMemo(() => scenes.reduce((sum, scene) => sum + Number(scene.durationSec || 0), 0), [scenes])
  const workingScript = useMemo(() => {
    const short = String(shortScript || '').trim()
    if (short) return short
    return String(longScript || '').trim()
  }, [longScript, shortScript])
  const apiBase = useMemo(
    () => String(process.env.NEXT_PUBLIC_API_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, ''),
    []
  )
  const getAbsoluteSrc = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const normalized = url.startsWith('/') ? url : `/${url}`
    return `${apiBase}${normalized}`
  }
  const previewDurationInFrames = useMemo(() => Math.max(PREVIEW_FPS, Math.round(totalDuration * PREVIEW_FPS)), [totalDuration])
  const previewScenes = useMemo(
    () =>
      scenes.map(scene => ({
        id: scene.id,
        heading: scene.heading,
        onScreenText: scene.onScreenText || scene.narration,
        durationSec: scene.durationSec,
        audioUrl: getAbsoluteSrc(scene.audioUrl || scene.audioSrc || '')
      })),
    [scenes]
  )
  const modelLanguage = language === 'hi' ? 'Hindi' : 'English'
  const finalSubtopics = useMemo(() => {
    return String(subtopicsText || '')
      .split(/\r?\n/)
      .map(line => line.replace(/^\s*[-*\d.)]+\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 30)
  }, [subtopicsText])

  useEffect(() => {
    const newsId = String(router.query?.newsId || '').trim()
    if (!newsId) return
    const load = async () => {
      try {
        const url = ENDURL.NEWS_BSE_ITEM.replace(':id', newsId)
        const res = await axiosInstance.get(url, { timeout: LONG_TIMEOUT_MS })
        const row = res?.data?.data || {}
        const nextTopic = String(row?.headline || row?.company || '').trim()
        const themes = Array.isArray(row?.matchedThemes) ? row.matchedThemes : []
        const topTerms = row?.matchedTerms && typeof row.matchedTerms === 'object'
          ? Object.entries(row.matchedTerms as Record<string, any>)
              .slice(0, 5)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.slice(0, 3).join(', ') : String(value)}`)
              .join(' | ')
          : '-'
        const pdfSnippet = String(row?.pdfText || '').replace(/\s+/g, ' ').slice(0, 1200)
        const info = [
          `Company: ${String(row?.company || '-')}`,
          `Category: ${String(row?.category || '-')}`,
          `Announcement Type: ${String(row?.announcementType || '-')}`,
          `News Date: ${String(row?.newsDate || '-')}`,
          `Matched Themes: ${themes.join(', ') || '-'}`,
          `Matched Terms: ${topTerms}`,
          `PDF Text Snippet: ${pdfSnippet}`
        ].join('\n')
        if (nextTopic) setTopic(nextTopic)
        setExtraInfo(info)
        setExtraInfoType('CONTEXT_PLUS_SUBTOPICS')
        setSubtopicsText(themes.join('\n'))
        setTargetDurationSec(45)
        setScriptLength('short')
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load selected news')
      }
    }
    load()
  }, [router.query?.newsId])

  const handleGenerateScript = async () => {
    try {
      setError('')
      setSuccess('')
      setLoadingScript(true)
      setScenes([])
      setRenderVideoUrl('')
      setScriptAudioSrc('')
      setScriptAudioFileName('')
      const res = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCRIPT,
        {
          topic: topic.trim(),
          extraInfo: extraInfo.trim().slice(0, scriptLength === 'short' ? 1800 : 5000),
          extraInfoType,
          platform,
          tone,
          language: modelLanguage,
          targetDurationSec,
          scriptLength,
          subtopics: finalSubtopics,
          model: model.trim() || undefined
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const data = res?.data?.data || {}
      const nextPack: ScriptPackage = {
        title: String(data.title || topic).trim(),
        hook: String(data.hook || '').trim(),
        videoScript: String(data.videoScript || '').trim(),
        cta: String(data.cta || '').trim(),
        estimatedWords: Number(data.estimatedWords || 0),
        model: String(data.model || model).trim()
      }
      setScriptPack(nextPack)
      setLongScript(nextPack.videoScript)
      setShortScript('')
      setSuccess('Script generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate script')
    } finally {
      setLoadingScript(false)
    }
  }

  const handleSplitScript = async () => {
    if (!workingScript.trim()) return
    try {
      setError('')
      setSuccess('')
      setLoadingSplit(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_SPLIT_SCRIPT,
        {
          script: workingScript.trim(),
          platform,
          tone,
          language: modelLanguage,
          targetDurationSec,
          sceneCount,
          extraInfoType,
          subtopics: finalSubtopics,
          extraInfo: extraInfo.trim(),
          model: model.trim() || undefined
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const data = res?.data?.data || {}
      const nextScenes: SceneItem[] = Array.isArray(data.scenes)
        ? data.scenes.map((item: any, idx: number) => ({
            id: Number(item?.id || idx + 1),
            heading: String(item?.heading || `Scene ${idx + 1}`).trim(),
            narration: String(item?.narration || '').trim(),
            onScreenText: String(item?.onScreenText || '').trim(),
            voiceStyle: String(item?.voiceStyle || '').trim(),
            durationSec: Number(item?.durationSec || 8)
          }))
        : []
      setScenes(nextScenes)
      setSuccess('Script split into scenes.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to split script')
    } finally {
      setLoadingSplit(false)
    }
  }

  const handleShortenScript = async () => {
    if (!longScript.trim()) return
    try {
      setShorteningScript(true)
      setError('')
      setSuccess('')
      const res = await axiosInstance.post(
        ENDURL.NEWS_SHORTEN_SCRIPT,
        {
          script: longScript.trim(),
          language: modelLanguage,
          targetDurationSec: Math.max(15, Math.min(300, Math.round(targetDurationSec * 0.45))),
          model: model.trim() || undefined
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const shortScript = String(res?.data?.data?.shortScript || '').trim()
      if (!shortScript) throw new Error('Short script not received')
      setShortScript(shortScript)
      setSuccess('Script shortened successfully.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to shorten script')
    } finally {
      setShorteningScript(false)
    }
  }

  const handleGenerateVideoScriptAudio = async () => {
    if (!workingScript?.trim()) return
    try {
      setScriptAudioLoading(true)
      setError('')
      setSuccess('')
      const ttsModel = language === 'hi' ? 'paratham' : 'lessac'
      const res = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCENE_AUDIOS,
        {
          language,
          model: ttsModel,
          scenes: [
            {
              id: 1,
              heading: 'Video Script',
              narration: workingScript
            }
          ],
          options: { normalizeText, splitSentences }
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const scene = Array.isArray(res?.data?.data?.scenes) ? res.data.data.scenes[0] : null
      if (!scene?.audioUrl) throw new Error('Video script audio URL missing')
      setScriptAudioFileName(String(scene?.fileName || ''))
      setScriptAudioSrc(getAbsoluteSrc(String(scene.audioUrl)))
      setSuccess('Video script audio generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate video script audio')
    } finally {
      setScriptAudioLoading(false)
    }
  }

  const handleGenerateAudio = async () => {
    if (!scenes.length) return
    try {
      setError('')
      setSuccess('')
      setLoadingAudio(true)
      const ttsModel = language === 'hi' ? 'paratham' : 'lessac'
      const res = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCENE_AUDIOS,
        {
          language,
          model: ttsModel,
          scenes: scenes.map(scene => ({
            id: scene.id,
            heading: scene.heading,
            narration: scene.narration,
            durationSec: scene.durationSec
          })),
          options: { normalizeText, splitSentences }
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const returnedScenes: any[] = Array.isArray(res?.data?.data?.scenes) ? res.data.data.scenes : []
      const byId = new Map(returnedScenes.map(item => [Number(item.id), item]))
      setScenes(prev =>
        prev.map(scene => {
          const generated = byId.get(Number(scene.id))
          if (!generated) return scene
          const audioUrl = String(generated.audioUrl || '')
          return {
            ...scene,
            fileName: String(generated.fileName || ''),
            audioUrl,
            audioSrc: getAbsoluteSrc(audioUrl),
            durationSec: Number(generated.durationSec || scene.durationSec || 0)
          }
        })
      )
      setSuccess('Audio generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate scene audio')
    } finally {
      setLoadingAudio(false)
    }
  }

  const handleGenerateShortScriptPreviewAudio = async () => {
    if (!shortScript?.trim()) return
    try {
      setShortPreviewAudioLoading(true)
      setError('')
      setSuccess('')
      const ttsModel = language === 'hi' ? 'paratham' : 'lessac'
      const res = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCENE_AUDIOS,
        {
          language,
          model: ttsModel,
          scenes: [
            {
              id: 1,
              heading: 'Short Script Preview',
              narration: shortScript.trim()
            }
          ],
          options: { normalizeText, splitSentences }
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const scene = Array.isArray(res?.data?.data?.scenes) ? res.data.data.scenes[0] : null
      if (!scene?.audioUrl) throw new Error('Short script audio URL missing')
      setShortPreviewAudioFileName(String(scene?.fileName || ''))
      setShortPreviewAudioSrc(getAbsoluteSrc(String(scene.audioUrl)))
      setSuccess('Short script preview audio generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate short script preview audio')
    } finally {
      setShortPreviewAudioLoading(false)
    }
  }

  const handleSceneImageUpload = async (sceneId: number, file: File | null) => {
    if (!file) return
    try {
      setUploadingSceneId(sceneId)
      const dataUrl = await compressImageToDataUrl(file)
      const res = await axiosInstance.post(ENDURL.NEWS_UPLOAD_SCENE_IMAGE, { fileName: file.name, dataUrl }, { timeout: LONG_TIMEOUT_MS })
      const imageUrl = String(res?.data?.data?.imageUrl || '').trim()
      setScenes(prev =>
        prev.map(scene =>
          scene.id === sceneId ? { ...scene, imageName: file.name, imageUrl, imagePreviewUrl: getAbsoluteSrc(imageUrl) } : scene
        )
      )
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to upload scene image')
    } finally {
      setUploadingSceneId(null)
    }
  }

  const pollRenderStatus = async (jobId: string) => {
    const maxTries = 240
    for (let i = 0; i < maxTries; i += 1) {
      const url = ENDURL.NEWS_RENDER_STATUS.replace(':jobId', jobId)
      const res = await axiosInstance.get(url, { timeout: 60 * 1000 })
      const status = String(res?.data?.data?.status || '')
      const videoUrl = String(res?.data?.data?.videoUrl || '')
      const progress = Number(res?.data?.data?.progress || 0)
      setRenderStatus(status)
      setRenderProgress(progress)
      if (status === 'completed') {
        setRenderVideoUrl(getAbsoluteSrc(videoUrl))
        return
      }
      if (status === 'failed') throw new Error(String(res?.data?.data?.error || 'Video render failed'))
      await new Promise(resolve => window.setTimeout(resolve, 3000))
    }
    throw new Error('Render is taking too long.')
  }

  const handleGenerateVideo = async (renderMode: 'scene' | 'text_news' = 'scene') => {
    if (!scenes.length) return
    try {
      setRendering(true)
      setRenderProgress(0)
      const res = await axiosInstance.post(
        ENDURL.NEWS_RENDER_VIDEO,
        {
          title: scriptPack?.title || topic,
          format: renderFormat,
          qualityMode,
          renderMode,
          stylePreset: videoStylePreset,
          scenes: scenes.map(scene => ({
            id: scene.id,
            heading: scene.heading,
            narration: scene.narration,
            onScreenText: scene.onScreenText || scene.narration,
            durationSec: scene.durationSec,
            imageUrl: getAbsoluteSrc(scene.imageUrl || ''),
            audioUrl: getAbsoluteSrc(scene.audioUrl || scene.audioSrc || '')
          }))
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const jobId = String(res?.data?.data?.jobId || '')
      if (!jobId) throw new Error('Render job id missing')
      setRenderJobId(jobId)
      setEstimatedRenderSeconds(Number(res?.data?.data?.estimatedRenderSeconds || 0))
      await pollRenderStatus(jobId)
      setSuccess('Video generated successfully.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to render video')
    } finally {
      setRendering(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Stack direction='row' spacing={2} alignItems='center'>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            AI News Creator
          </Typography>
          <Button variant='outlined' onClick={() => router.push('/news-creator')}>
            Back To News List
          </Button>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Typography variant='h6'>1) Content Input</Typography>
              <TextField label='Topic' value={topic} onChange={event => setTopic(event.target.value)} fullWidth />
              <TextField select label='Extra Info Type' value={extraInfoType} onChange={event => setExtraInfoType(event.target.value as ExtraInfoType)} fullWidth>
                <MenuItem value='GENERAL_CONTEXT'>General Context</MenuItem>
                <MenuItem value='SUBTOPIC_LIST'>Subtopic List</MenuItem>
                <MenuItem value='CONTEXT_PLUS_SUBTOPICS'>Context + Subtopics</MenuItem>
              </TextField>
              <TextField label='Extra Information / Instructions' value={extraInfo} onChange={event => setExtraInfo(event.target.value)} multiline minRows={5} fullWidth />
              {extraInfoType !== 'GENERAL_CONTEXT' ? (
                <TextField label='Subtopics (one per line)' value={subtopicsText} onChange={event => setSubtopicsText(event.target.value)} multiline minRows={4} fullWidth />
              ) : null}
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField select label='Platform' value={platform} onChange={event => setPlatform(event.target.value)} fullWidth>
                    <MenuItem value='YouTube'>YouTube</MenuItem>
                    <MenuItem value='Instagram Reels'>Instagram Reels</MenuItem>
                    <MenuItem value='Shorts'>Shorts</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select label='Language' value={language} onChange={event => setLanguage(event.target.value as 'en' | 'hi')} fullWidth>
                    <MenuItem value='en'>English</MenuItem>
                    <MenuItem value='hi'>Hindi</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField select label='Script Length' value={scriptLength} onChange={event => setScriptLength(event.target.value as 'short' | 'long')} fullWidth>
                    <MenuItem value='short'>Short News</MenuItem>
                    <MenuItem value='long'>Long Detailed</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label='Tone' value={tone} onChange={event => setTone(event.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label='Model' value={model} onChange={event => setModel(event.target.value)} fullWidth />
                </Grid>
              </Grid>
              <Stack direction='row' spacing={2}>
                <Button variant='contained' onClick={handleGenerateScript} disabled={loadingScript || !topic.trim()}>
                  Generate Script
                </Button>
              </Stack>
              {loadingScript ? <LinearProgress /> : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {scriptPack ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Typography variant='h6'>2) Generated Script Package</Typography>
                  <Chip label={`Model: ${scriptPack.model || model}`} color='primary' />
                </Stack>
                <Divider />
                <Typography variant='subtitle2'>Title</Typography>
                <Typography variant='body2'>{scriptPack.title}</Typography>
                <TextField
                  label='Long Script'
                  value={longScript}
                  onChange={event => setLongScript(event.target.value)}
                  multiline
                  minRows={8}
                  fullWidth
                />
                <TextField
                  label='Short Script (Optional)'
                  value={shortScript}
                  onChange={event => setShortScript(event.target.value)}
                  multiline
                  minRows={6}
                  fullWidth
                  placeholder='Click "Shorten Script" to generate. You can edit manually.'
                />
                <Stack direction='row' spacing={2}>
                  <Button variant='contained' onClick={handleSplitScript} disabled={loadingSplit || !workingScript.trim()}>
                    Split Script with AI
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={handleShortenScript}
                    disabled={shorteningScript || !longScript.trim()}
                  >
                    {shorteningScript ? 'Shortening...' : 'Shorten Script'}
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={handleGenerateVideoScriptAudio}
                    disabled={scriptAudioLoading || !workingScript.trim()}
                  >
                    {scriptAudioLoading ? 'Generating Script Audio...' : 'Generate Audio For Video Script'}
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={handleGenerateShortScriptPreviewAudio}
                    disabled={shortPreviewAudioLoading || !shortScript.trim()}
                  >
                    {shortPreviewAudioLoading ? 'Generating Short Preview Audio...' : 'Generate Audio For Short Script Preview'}
                  </Button>
                </Stack>
                <Typography variant='caption' color='text.secondary'>
                  Split/audio uses: {shortScript.trim() ? 'Short Script' : 'Long Script'}
                </Typography>
                {loadingSplit ? <LinearProgress /> : null}
                {scriptAudioSrc ? (
                  <Stack spacing={1}>
                    <Typography variant='caption' color='text.secondary'>
                      {scriptAudioFileName || 'script-audio'}
                    </Typography>
                    <audio controls src={scriptAudioSrc} style={{ width: '100%' }} />
                  </Stack>
                ) : null}
                {shortPreviewAudioSrc ? (
                  <Stack spacing={1}>
                    <Typography variant='caption' color='text.secondary'>
                      {shortPreviewAudioFileName || 'short-script-preview-audio'}
                    </Typography>
                    <audio controls src={shortPreviewAudioSrc} style={{ width: '100%' }} />
                  </Stack>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {shortScript.trim() && shortPreviewAudioSrc ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant='h6'>3) Short Script Remotion Preview</Typography>
                <Typography variant='caption' color='text.secondary'>
                  Uses short script + short script audio for quick preview before full scene workflow.
                </Typography>
                <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', p: 1 }}>
                  <RemotionPlayer
                    component={ShortScriptAudioPreviewComposition}
                    durationInFrames={Math.max(PREVIEW_FPS * 8, Math.min(PREVIEW_FPS * 240, Math.round(targetDurationSec * 0.45 * PREVIEW_FPS)))}
                    fps={PREVIEW_FPS}
                    compositionWidth={1080}
                    compositionHeight={1920}
                    style={{ width: '100%', maxWidth: 420, aspectRatio: '9 / 16', margin: '0 auto' }}
                    inputProps={{
                      title: `${scriptPack?.title || topic} - Short`,
                      script: shortScript,
                      audioUrl: shortPreviewAudioSrc,
                      stylePreset: videoStylePreset
                    }}
                    controls
                    acknowledgeRemotionLicense
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {scenes.length > 0 ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Typography variant='h6'>3) Scene Production</Typography>
                  <Chip label={`${scenes.length} scenes | ~${totalDuration}s`} color='primary' />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <FormControlLabel control={<Checkbox checked={normalizeText} onChange={event => setNormalizeText(event.target.checked)} />} label='Normalize text for TTS' />
                  <FormControlLabel control={<Checkbox checked={splitSentences} onChange={event => setSplitSentences(event.target.checked)} />} label='Split sentences for smoother TTS' />
                </Stack>
                <Stack direction='row' spacing={2}>
                  <Button variant='contained' onClick={handleGenerateAudio} disabled={loadingAudio}>
                    Generate Audio For All Scenes
                  </Button>
                </Stack>
                {loadingAudio ? <LinearProgress /> : null}
                <Divider />
                <Grid container spacing={3}>
                  {scenes.map((scene, idx) => (
                    <Grid item xs={12} key={scene.id}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Stack spacing={1.5}>
                            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>{scene.heading || `Scene ${idx + 1}`}</Typography>
                            <TextField
                              label='Narration'
                              multiline
                              minRows={3}
                              value={scene.narration}
                              onChange={event => setScenes(prev => prev.map(s => (s.id === scene.id ? { ...s, narration: event.target.value } : s)))}
                              fullWidth
                            />
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  label='On-screen Text'
                                  value={scene.onScreenText || ''}
                                  onChange={event => setScenes(prev => prev.map(s => (s.id === scene.id ? { ...s, onScreenText: event.target.value } : s)))}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  type='number'
                                  label='Duration (sec)'
                                  value={scene.durationSec}
                                  onChange={event => setScenes(prev => prev.map(s => (s.id === scene.id ? { ...s, durationSec: Number(event.target.value) } : s)))}
                                  inputProps={{ min: 1, max: 1200 }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Stack spacing={1}>
                                  <Button variant='outlined' component='label' disabled={uploadingSceneId === scene.id || loadingAudio || rendering}>
                                    {uploadingSceneId === scene.id ? 'Uploading...' : 'Upload Scene Image'}
                                    <input hidden type='file' accept='image/*' onChange={event => handleSceneImageUpload(scene.id, event.target.files?.[0] || null)} />
                                  </Button>
                                  <Typography variant='caption' color='text.secondary'>{scene.imageName || 'No image uploaded'}</Typography>
                                </Stack>
                              </Grid>
                            </Grid>
                            {scene.imagePreviewUrl ? <Box component='img' src={scene.imagePreviewUrl} alt={scene.imageName || `scene-${scene.id}`} sx={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }} /> : null}
                            {scene.audioSrc ? <audio controls src={scene.audioSrc} style={{ width: '100%' }} /> : null}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {scenes.length > 0 ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant='h6'>4) Frontend Instant Preview (No Backend)</Typography>
                <Typography variant='caption' color='text.secondary'>
                  This preview runs fully in browser using Remotion Player for fast template testing.
                </Typography>
                <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', p: 1 }}>
                  <RemotionPlayer
                    component={NewsScriptHighlightsComposition}
                    durationInFrames={previewDurationInFrames}
                    fps={PREVIEW_FPS}
                    compositionWidth={1080}
                    compositionHeight={1920}
                    style={{ width: '100%', maxWidth: 420, aspectRatio: '9 / 16', margin: '0 auto' }}
                    inputProps={{
                      title: scriptPack?.title || topic,
                      scenes: previewScenes,
                      stylePreset: videoStylePreset
                    }}
                    controls
                    loop
                    acknowledgeRemotionLicense
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {scenes.length > 0 ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant='h6'>5) Final Video Render (Backend Remotion)</Typography>
                <TextField select label='Output Format' value={renderFormat} onChange={event => setRenderFormat(event.target.value as 'vertical' | 'landscape' | 'square')} sx={{ maxWidth: 240 }}>
                  <MenuItem value='vertical'>Vertical (9:16)</MenuItem>
                  <MenuItem value='landscape'>Landscape (16:9)</MenuItem>
                  <MenuItem value='square'>Square (1:1)</MenuItem>
                </TextField>
                <TextField select label='Quality' value={qualityMode} onChange={event => setQualityMode(event.target.value as 'draft' | 'standard' | 'high')} sx={{ maxWidth: 240 }}>
                  <MenuItem value='draft'>Draft (Fast)</MenuItem>
                  <MenuItem value='standard'>Standard</MenuItem>
                  <MenuItem value='high'>High (Slow)</MenuItem>
                </TextField>
                <TextField
                  select
                  label='Template Style'
                  value={videoStylePreset}
                  onChange={event => setVideoStylePreset(event.target.value as 'flash' | 'data' | 'story')}
                  sx={{ maxWidth: 240 }}
                >
                  <MenuItem value='flash'>Breaking Flash</MenuItem>
                  <MenuItem value='data'>Data Brief</MenuItem>
                  <MenuItem value='story'>Narrative Story</MenuItem>
                </TextField>
                <Stack direction='row' spacing={2}>
                  <Button variant='contained' onClick={() => handleGenerateVideo('scene')} disabled={rendering || loadingAudio}>
                    {rendering ? 'Rendering Video...' : 'Generate Final Video'}
                  </Button>
                  <Button variant='outlined' onClick={() => handleGenerateVideo('text_news')} disabled={rendering || loadingAudio}>
                    {rendering ? 'Rendering Video...' : 'Generate Text News Video'}
                  </Button>
                </Stack>
                <Typography variant='caption' color='text.secondary'>
                  Text News Video uses highlighted text theme and does not require uploaded images.
                </Typography>
                {rendering ? <LinearProgress /> : null}
                {renderJobId ? <Chip label={`Job ID: ${renderJobId}`} variant='outlined' /> : null}
                {renderStatus ? <Chip label={`Status: ${renderStatus}`} color='secondary' /> : null}
                {(rendering || renderProgress > 0) && renderStatus !== 'completed' ? (
                  <Chip label={`Progress: ${Math.max(0, Math.min(100, Math.round(renderProgress)))}%`} color='primary' variant='outlined' />
                ) : null}
                {estimatedRenderSeconds > 0 ? (
                  <Typography variant='caption' color='text.secondary'>
                    Estimated render time: ~{Math.round(estimatedRenderSeconds / 60)} min ({estimatedRenderSeconds}s)
                  </Typography>
                ) : null}
                {renderVideoUrl ? (
                  <Box>
                    <video controls src={renderVideoUrl} style={{ width: '100%', borderRadius: 8 }} />
                    <Button href={renderVideoUrl} target='_blank' rel='noreferrer' sx={{ mt: 1 }} variant='outlined'>
                      Open Video
                    </Button>
                  </Box>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

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

export default NewsCreatorBuildPage
