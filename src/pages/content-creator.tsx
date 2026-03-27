import { useMemo, useState } from 'react'
import type { NextPage } from 'next'
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

const LONG_TIMEOUT_MS = 8 * 60 * 1000
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
  summaryLong: string
  videoScript: string
  cta: string
  estimatedWords: number
  model?: string
}

const defaultTopic = 'Nifty market outlook for next week'
const defaultInfo =
  'Focus on retail investors, simple language, add clear risk reminder, and include 1 call to action at the end.'
const defaultSubtopics = `Introduction – Life before smartphones
Gilli Danda
Lagori
Kho Kho
Kabaddi
Kanche
Conclusion – Outdoor childhood memories`

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Unable to read image file'))
    reader.readAsDataURL(file)
  })

const compressImageToDataUrl = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image')
  }

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
  const compressed = canvas.toDataURL('image/jpeg', 0.82)
  if (!compressed || compressed.length < 32) return originalDataUrl

  return compressed
}

const extractSubtopicsFromText = (text: string): string[] => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
    .filter(Boolean)

  const likely = lines.filter(line => {
    if (line.length < 2 || line.length > 160) return false
    const words = line.split(/\s+/).length

    return words >= 1 && words <= 16
  })

  return likely.slice(0, 30)
}

const ContentCreatorPage: NextPage = () => {
  const [topic, setTopic] = useState(defaultTopic)
  const [extraInfoType, setExtraInfoType] = useState<ExtraInfoType>('GENERAL_CONTEXT')
  const [extraInfo, setExtraInfo] = useState(defaultInfo)
  const [subtopicsText, setSubtopicsText] = useState(defaultSubtopics)
  const [platform, setPlatform] = useState('YouTube')
  const [tone, setTone] = useState('confident and educational')
  const [language, setLanguage] = useState<'en' | 'hi'>('en')
  const [targetDurationSec, setTargetDurationSec] = useState(90)
  const [model, setModel] = useState('gemma3:1b')
  const [sceneCount, setSceneCount] = useState(8)
  const [renderFormat, setRenderFormat] = useState<'vertical' | 'landscape' | 'square'>('vertical')
  const [qualityMode, setQualityMode] = useState<'draft' | 'standard' | 'high'>('standard')
  const [scriptPack, setScriptPack] = useState<ScriptPackage | null>(null)
  const [script, setScript] = useState('')
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const totalDuration = useMemo(() => scenes.reduce((sum, scene) => sum + Number(scene.durationSec || 0), 0), [scenes])
  const localEstimatedRenderSeconds = useMemo(() => {
    const factor = qualityMode === 'draft' ? 1.2 : qualityMode === 'high' ? 3.4 : 2.2
    return Math.max(30, Math.round(totalDuration * factor))
  }, [totalDuration, qualityMode])

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

  const modelLanguage = language === 'hi' ? 'Hindi' : 'English'
  const finalSubtopics = useMemo(() => {
    if (extraInfoType === 'GENERAL_CONTEXT') return []
    if (extraInfoType === 'SUBTOPIC_LIST') return extractSubtopicsFromText(subtopicsText || extraInfo)
    return extractSubtopicsFromText(subtopicsText)
  }, [extraInfoType, subtopicsText, extraInfo])

  const handleGenerateScript = async () => {
    try {
      setError('')
      setSuccess('')
      setLoadingScript(true)
      setScriptPack(null)
      setScenes([])
      setRenderVideoUrl('')
      setRenderStatus('')
      setRenderJobId('')

      const res = await axiosInstance.post(
        ENDURL.CONTENT_GENERATE_SCRIPT,
        {
          topic: topic.trim(),
          extraInfo: extraInfo.trim(),
          extraInfoType,
          platform,
          tone,
          language: modelLanguage,
          targetDurationSec,
          subtopics: finalSubtopics,
          model: model.trim() || undefined
        },
        { timeout: LONG_TIMEOUT_MS }
      )

      const data = res?.data?.data || {}
      const nextPack: ScriptPackage = {
        title: String(data.title || topic).trim(),
        hook: String(data.hook || '').trim(),
        summaryLong: String(data.summaryLong || '').trim(),
        videoScript: String(data.videoScript || '').trim(),
        cta: String(data.cta || '').trim(),
        estimatedWords: Number(data.estimatedWords || 0),
        model: String(data.model || model).trim()
      }
      setScriptPack(nextPack)
      setScript(nextPack.videoScript)
      if (nextPack.model) setModel(nextPack.model)
      setSuccess('Long summary and script generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate script')
    } finally {
      setLoadingScript(false)
    }
  }

  const handleSplitScript = async () => {
    if (!script.trim()) return
    try {
      setError('')
      setSuccess('')
      setLoadingSplit(true)

      const res = await axiosInstance.post(
        ENDURL.CONTENT_SPLIT_SCRIPT,
        {
          script: script.trim(),
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
      const modelFromApi = String(data.model || '').trim()
      if (modelFromApi) setModel(modelFromApi)
      setSuccess('Script split and refined into scenes.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to split script')
    } finally {
      setLoadingSplit(false)
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
        ENDURL.CONTENT_GENERATE_SCENE_AUDIOS,
        {
          language,
          model: ttsModel,
          scenes: scenes.map(scene => ({
            id: scene.id,
            heading: scene.heading,
            narration: scene.narration,
            durationSec: scene.durationSec
          })),
          options: {
            normalizeText,
            splitSentences
          }
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

      setSuccess('Scene audio generated using Piper TTS.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate scene audio')
    } finally {
      setLoadingAudio(false)
    }
  }

  const handleSceneImageUpload = async (sceneId: number, file: File | null) => {
    if (!file) return
    try {
      setError('')
      setSuccess('')
      setUploadingSceneId(sceneId)
      const dataUrl = await compressImageToDataUrl(file)
      const res = await axiosInstance.post(
        ENDURL.CONTENT_UPLOAD_SCENE_IMAGE,
        {
          fileName: file.name,
          dataUrl
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const imageUrl = String(res?.data?.data?.imageUrl || '').trim()
      setScenes(prev =>
        prev.map(scene =>
          scene.id === sceneId
            ? {
                ...scene,
                imageName: file.name,
                imageUrl,
                imagePreviewUrl: getAbsoluteSrc(imageUrl)
              }
            : scene
        )
      )
      setSuccess(`Image uploaded for scene ${sceneId}.`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to upload scene image')
    } finally {
      setUploadingSceneId(null)
    }
  }

  const pollRenderStatus = async (jobId: string) => {
    const maxTries = 240
    for (let i = 0; i < maxTries; i += 1) {
      const url = ENDURL.CONTENT_RENDER_STATUS.replace(':jobId', jobId)
      const res = await axiosInstance.get(url, { timeout: 60 * 1000 })
      const status = String(res?.data?.data?.status || '')
      const videoUrl = String(res?.data?.data?.videoUrl || '')
      const errorMsg = String(res?.data?.data?.error || '')
      const progress = Number(res?.data?.data?.progress || 0)
      const eta = Number(res?.data?.data?.estimatedRenderSeconds || 0)

      setRenderStatus(status)
      setRenderProgress(progress)
      if (eta > 0) setEstimatedRenderSeconds(eta)
      if (status === 'completed') {
        setRenderVideoUrl(getAbsoluteSrc(videoUrl))
        return
      }
      if (status === 'failed') {
        throw new Error(errorMsg || 'Video render failed')
      }
      await new Promise(resolve => window.setTimeout(resolve, 3000))
    }

    throw new Error('Render is taking too long. Check status again.')
  }

  const handleGenerateVideo = async () => {
    if (!scenes.length) return
    const missingImage = scenes.some(scene => !scene.imageUrl)
    const missingAudio = scenes.some(scene => !scene.audioUrl && !scene.audioSrc)
    if (missingImage) {
      setError('Please upload image for each scene before rendering video.')
      return
    }
    if (missingAudio) {
      setError('Please generate audio for all scenes before rendering video.')
      return
    }

    try {
      setError('')
      setSuccess('')
      setRendering(true)
      setRenderStatus('queued')
      setRenderProgress(0)
      setRenderVideoUrl('')
      const res = await axiosInstance.post(
        ENDURL.CONTENT_RENDER_VIDEO,
        {
          title: scriptPack?.title || topic,
          format: renderFormat,
          qualityMode,
          scenes: scenes.map(scene => ({
            id: scene.id,
            heading: scene.heading,
            narration: scene.narration,
            onScreenText: scene.onScreenText,
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
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          AI Content Creator
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Topic -> script -> refined scenes -> scene images + TTS -> Remotion final video.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Typography variant='h6'>1) Content Input</Typography>
              <TextField label='Topic' value={topic} onChange={event => setTopic(event.target.value)} fullWidth />
              <TextField
                select
                label='Extra Info Type'
                value={extraInfoType}
                onChange={event => setExtraInfoType(event.target.value as ExtraInfoType)}
                fullWidth
              >
                <MenuItem value='GENERAL_CONTEXT'>General Context</MenuItem>
                <MenuItem value='SUBTOPIC_LIST'>Subtopic List</MenuItem>
                <MenuItem value='CONTEXT_PLUS_SUBTOPICS'>Context + Subtopics</MenuItem>
              </TextField>
              <TextField
                label='Extra Information / Instructions'
                value={extraInfo}
                onChange={event => setExtraInfo(event.target.value)}
                multiline
                minRows={4}
                fullWidth
              />
              {extraInfoType !== 'GENERAL_CONTEXT' ? (
                <TextField
                  label='Subtopics (one per line)'
                  value={subtopicsText}
                  onChange={event => setSubtopicsText(event.target.value)}
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder={'Introduction\nSubtopic 1\nSubtopic 2\nConclusion'}
                />
              ) : null}
              {finalSubtopics.length > 0 ? (
                <Stack direction='row' spacing={1} flexWrap='wrap'>
                  {finalSubtopics.map(item => (
                    <Chip key={item} size='small' label={item} sx={{ mb: 1 }} />
                  ))}
                </Stack>
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
                  <TextField
                    select
                    label='Language'
                    value={language}
                    onChange={event => setLanguage(event.target.value as 'en' | 'hi')}
                    fullWidth
                  >
                    <MenuItem value='en'>English</MenuItem>
                    <MenuItem value='hi'>Hindi</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label='Tone' value={tone} onChange={event => setTone(event.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label='Model' value={model} onChange={event => setModel(event.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    type='number'
                    label='Target Duration (sec)'
                    inputProps={{ min: 20, max: 900 }}
                    value={targetDurationSec}
                    onChange={event => setTargetDurationSec(Number(event.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    type='number'
                    label='Scene Count'
                    inputProps={{ min: 2, max: 20 }}
                    value={sceneCount}
                    onChange={event => setSceneCount(Number(event.target.value))}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Stack direction='row' spacing={2}>
                <Button variant='contained' onClick={handleGenerateScript} disabled={loadingScript || !topic.trim()}>
                  Generate Long Summary / Script
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
                <Typography variant='subtitle2'>Long Summary</Typography>
                <Typography variant='body2'>{scriptPack.summaryLong}</Typography>
                <TextField
                  label='Editable Video Script'
                  value={script}
                  onChange={event => setScript(event.target.value)}
                  multiline
                  minRows={8}
                  fullWidth
                />
                <Stack direction='row' spacing={2}>
                  <Button variant='contained' onClick={handleSplitScript} disabled={loadingSplit || !script.trim()}>
                    Split Script with AI
                  </Button>
                </Stack>
                {loadingSplit ? <LinearProgress /> : null}
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
                  <FormControlLabel
                    control={<Checkbox checked={normalizeText} onChange={event => setNormalizeText(event.target.checked)} />}
                    label='Normalize text for TTS'
                  />
                  <FormControlLabel
                    control={<Checkbox checked={splitSentences} onChange={event => setSplitSentences(event.target.checked)} />}
                    label='Split sentences for smoother TTS'
                  />
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
                            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                              {scene.heading || `Scene ${idx + 1}`}
                            </Typography>
                            <TextField
                              label='Narration'
                              multiline
                              minRows={3}
                              value={scene.narration}
                              onChange={event => {
                                const value = event.target.value
                                setScenes(prev => prev.map(s => (s.id === scene.id ? { ...s, narration: value } : s)))
                              }}
                              fullWidth
                            />
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  label='On-screen Text'
                                  value={scene.onScreenText || ''}
                                  onChange={event => {
                                    const value = event.target.value
                                    setScenes(prev => prev.map(s => (s.id === scene.id ? { ...s, onScreenText: value } : s)))
                                  }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  type='number'
                                  label='Duration (sec)'
                                  value={scene.durationSec}
                                  onChange={event => {
                                    const value = Number(event.target.value)
                                    setScenes(prev => prev.map(s => (s.id === scene.id ? { ...s, durationSec: value } : s)))
                                  }}
                                  inputProps={{ min: 1, max: 1200 }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Stack spacing={1}>
                                  <Button
                                    variant='outlined'
                                    component='label'
                                    disabled={uploadingSceneId === scene.id || loadingAudio || rendering}
                                  >
                                    {uploadingSceneId === scene.id ? 'Uploading...' : 'Upload Scene Image'}
                                    <input
                                      hidden
                                      type='file'
                                      accept='image/*'
                                      onChange={event => handleSceneImageUpload(scene.id, event.target.files?.[0] || null)}
                                    />
                                  </Button>
                                  <Typography variant='caption' color='text.secondary'>
                                    {scene.imageName || 'No image uploaded'}
                                  </Typography>
                                </Stack>
                              </Grid>
                            </Grid>

                            {scene.imagePreviewUrl ? (
                              <Box
                                component='img'
                                src={scene.imagePreviewUrl}
                                alt={scene.imageName || `scene-${scene.id}`}
                                sx={{
                                  width: '100%',
                                  maxHeight: 260,
                                  objectFit: 'cover',
                                  borderRadius: 1.5,
                                  border: '1px solid',
                                  borderColor: 'divider'
                                }}
                              />
                            ) : null}

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
                <Typography variant='h6'>4) Final Video Render (Remotion)</Typography>
                <TextField
                  select
                  label='Output Format'
                  value={renderFormat}
                  onChange={event => setRenderFormat(event.target.value as 'vertical' | 'landscape' | 'square')}
                  sx={{ maxWidth: 240 }}
                >
                  <MenuItem value='vertical'>Vertical (9:16)</MenuItem>
                  <MenuItem value='landscape'>Landscape (16:9)</MenuItem>
                  <MenuItem value='square'>Square (1:1)</MenuItem>
                </TextField>
                <TextField
                  select
                  label='Quality'
                  value={qualityMode}
                  onChange={event => setQualityMode(event.target.value as 'draft' | 'standard' | 'high')}
                  sx={{ maxWidth: 240 }}
                >
                  <MenuItem value='draft'>Draft (Fast)</MenuItem>
                  <MenuItem value='standard'>Standard</MenuItem>
                  <MenuItem value='high'>High (Slow)</MenuItem>
                </TextField>
                <Button variant='contained' onClick={handleGenerateVideo} disabled={rendering || loadingAudio}>
                  {rendering ? 'Rendering Video...' : 'Generate Final Video'}
                </Button>
                <Typography variant='caption' color='text.secondary'>
                  Pre-estimate: ~{Math.round(localEstimatedRenderSeconds / 60)} min ({localEstimatedRenderSeconds}s)
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

export default ContentCreatorPage
