import { useEffect, useMemo, useRef, useState } from 'react'
import type { SyntheticEvent } from 'react'
import dynamic from 'next/dynamic'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import ListItemText from '@mui/material/ListItemText'
import Collapse from '@mui/material/Collapse'
import Checkbox from '@mui/material/Checkbox'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { ShortScriptAudioPreviewComposition } from 'src/remotion/ShortScriptAudioPreviewComposition'

const LONG_TIMEOUT_MS = 8 * 60 * 1000
const PREVIEW_FPS = 30
const Player = dynamic(() => import('@remotion/player').then(mod => mod.Player), { ssr: false })

const NewsContentPage: NextPage = () => {
  const router = useRouter()
  const videoId = String(router.query?.id || '').trim()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState<'english' | 'hindi'>('english')
  const [model, setModel] = useState('gemma3:1b')
  const [targetDurationSec, setTargetDurationSec] = useState(60)
  const [scriptWordsMin, setScriptWordsMin] = useState(120)
  const [scriptWordsMax, setScriptWordsMax] = useState(220)
  const [script, setScript] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioFileName, setAudioFileName] = useState('')
  const [loadingScript, setLoadingScript] = useState(false)
  const [loadingHindiScript, setLoadingHindiScript] = useState(false)
  const [loadingHindiScriptGemini, setLoadingHindiScriptGemini] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customScript, setCustomScript] = useState('')
  const [customAudioSrc, setCustomAudioSrc] = useState('')
  const [customAudioFileName, setCustomAudioFileName] = useState('')
  const [customAudioLoading, setCustomAudioLoading] = useState(false)
  const [customPreviewReady, setCustomPreviewReady] = useState(false)
  const [customPreviewLayout, setCustomPreviewLayout] = useState<'landscape' | 'short'>('landscape')
  const [customPreviewDurationFrames, setCustomPreviewDurationFrames] = useState(PREVIEW_FPS * 10)
  const [customPerSentenceSec, setCustomPerSentenceSec] = useState(5)
  const [filteredNewsImages, setFilteredNewsImages] = useState<string[]>([])
  const [templateMusicSelection, setTemplateMusicSelection] = useState<any>(null)
  const [generatorFormatTab, setGeneratorFormatTab] = useState<'landscape' | 'short'>('landscape')
  const [generatorSectionTab, setGeneratorSectionTab] = useState<{ landscape: number; short: number }>({
    landscape: 0,
    short: 0
  })
  const [scriptPanelCollapsed, setScriptPanelCollapsed] = useState(false)
  const [showBackgroundVideo, setShowBackgroundVideo] = useState(true)
  type TransitionKey =
    | 'fade'
    | 'slide-left'
    | 'slide-right'
    | 'zoom-in'
    | 'zoom-out'
    | 'zoom'
    | 'pan-left-right'
    | 'pan-right-left'
    | 'pan-top-bottom'
    | 'pan-bottom-top'
  type TransitionMode = 'single' | 'cycle_images' | 'cycle_time' | 'hybrid'
  type OverlayType = 'image' | 'video'
  type OverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  type OverlaySize = 'sm' | 'md' | 'lg'
  type OverlayAnimation = 'none' | 'fade'
  type OverlayScheduleMode = 'single' | 'interval' | 'timeline_list' | 'random'
  const [inheritClipTransitions, setInheritClipTransitions] = useState(true)
  const [transitionMode, setTransitionMode] = useState<TransitionMode>('single')
  const [transitionSet, setTransitionSet] = useState<TransitionKey[]>(['fade', 'zoom', 'pan-left-right'])
  const [imagesPerTransition, setImagesPerTransition] = useState(5)
  const [secondsPerTransition, setSecondsPerTransition] = useState(30)
  const [minTransitionDurationSec, setMinTransitionDurationSec] = useState(1)
  const [skipShortTransitions, setSkipShortTransitions] = useState(true)
  const [shortTransitionFallback, setShortTransitionFallback] = useState<TransitionKey | 'none'>('fade')
  const [mediaOverlays, setMediaOverlays] = useState<
    Array<{
      id: string
      type: OverlayType
      url: string
      position: OverlayPosition
      size: OverlaySize
      startSec: number
      endSec: number
      animation: OverlayAnimation
      scheduleMode: OverlayScheduleMode
      repeat: boolean
      repeatEverySec: number
      timelineStarts: string
      randomCount: number
      randomDurationSec: number
      label?: string
    }>
  >([])
  const [rendering, setRendering] = useState(false)
  const [renderStatus, setRenderStatus] = useState('')
  const [renderJobId, setRenderJobId] = useState('')
  const [videoStatus, setVideoStatus] = useState<'draft' | 'finished' | 'published' | 'ready_for_download' | 'rendering'>('draft')
  const [saving, setSaving] = useState(false)
  const [testRenderSeconds, setTestRenderSeconds] = useState(20)
  const [quickRecording, setQuickRecording] = useState(false)
  const previewPlayerRef = useRef<any>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const quickRecorderRef = useRef<MediaRecorder | null>(null)
  const quickRecorderTimeoutRef = useRef<number | null>(null)
  const quickRecorderChunksRef = useRef<Blob[]>([])
  const [clips, setClips] = useState<
    Array<{
      id: number
      sentenceIdx: number[]
      text: string
      images: Array<{ name: string; url: string }>
      imageWithText: boolean
      useRandomImages: boolean
      transition?: TransitionKey
      approach?: 'multi_sentence' | 'single_sentence'
      keyword?: string
    }>
  >([])
  const [clipModalOpen, setClipModalOpen] = useState(false)
  const [clipSelectedIdx, setClipSelectedIdx] = useState<number[]>([])
  const [clipImages, setClipImages] = useState<Array<{ name: string; url: string }>>([])
  const [imageGallery, setImageGallery] = useState<Array<{ name: string; url: string }>>([])
  const [clipSelectionCollapsed, setClipSelectionCollapsed] = useState(false)
  const [clipImageWithText, setClipImageWithText] = useState(false)
  const [clipUseRandomImages, setClipUseRandomImages] = useState(false)
  const [clipTransition, setClipTransition] = useState<TransitionKey>('fade')
  const [clipSaving, setClipSaving] = useState(false)
  const [clipApproach, setClipApproach] = useState<'multi_sentence' | 'single_sentence'>('multi_sentence')
  const didLoadDraftRef = useRef(false)
  const clipSentenceListRef = useRef<HTMLDivElement | null>(null)
  const clipSentenceItemRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const clipCardsContainerRef = useRef<HTMLDivElement | null>(null)
  const clipCardRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [editingClipId, setEditingClipId] = useState<number | null>(null)
  const [imageQuery, setImageQuery] = useState('')
  const [imageProvider, setImageProvider] = useState<'all' | 'unsplash' | 'pexels' | 'pixabay'>('all')
  const [imageResults, setImageResults] = useState<Array<{ id: string; provider: string; thumbUrl: string; fullUrl: string }>>([])
  const [imageLoading, setImageLoading] = useState(false)
  const [refineLoading, setRefineLoading] = useState(false)
  const [sentenceKeywords, setSentenceKeywords] = useState<Record<number, string>>({})
  const [keywordLoading, setKeywordLoading] = useState<Record<number, boolean>>({})
  const [clipKeywordBatchLoading, setClipKeywordBatchLoading] = useState(false)
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0)
  const [ttsNoiseScale, setTtsNoiseScale] = useState<number>(0.62)
  const [ttsNoiseW, setTtsNoiseW] = useState<number>(0.8)
  const [ttsSentencePause, setTtsSentencePause] = useState<number>(0.28)
  const [ttsNormalizeText, setTtsNormalizeText] = useState<boolean>(true)
  const [ttsSplitSentences, setTtsSplitSentences] = useState<boolean>(false)

  type GeneratorState = {
    customScript: string
    customAudioSrc: string
    customAudioFileName: string
    customPreviewReady: boolean
    customPreviewLayout: 'landscape' | 'short'
    customPreviewDurationFrames: number
    customPerSentenceSec: number
    inheritClipTransitions: boolean
    transitionMode: TransitionMode
    transitionSet: TransitionKey[]
    imagesPerTransition: number
    secondsPerTransition: number
    minTransitionDurationSec: number
    skipShortTransitions: boolean
    shortTransitionFallback: TransitionKey | 'none'
    mediaOverlays: Array<{
      id: string
      type: OverlayType
      url: string
      position: OverlayPosition
      size: OverlaySize
      startSec: number
      endSec: number
      animation: OverlayAnimation
      scheduleMode: OverlayScheduleMode
      repeat: boolean
      repeatEverySec: number
      timelineStarts: string
      randomCount: number
      randomDurationSec: number
      label?: string
    }>
    clips: Array<{
      id: number
      sentenceIdx: number[]
      text: string
      images: Array<{ name: string; url: string }>
      imageWithText: boolean
      useRandomImages: boolean
      transition?: TransitionKey
      approach?: 'multi_sentence' | 'single_sentence'
      keyword?: string
    }>
    clipApproach: 'multi_sentence' | 'single_sentence'
    sentenceKeywords: Record<number, string>
    ttsSpeed: number
    ttsNoiseScale: number
    ttsNoiseW: number
    ttsSentencePause: number
    ttsNormalizeText: boolean
    ttsSplitSentences: boolean
    language: 'english' | 'hindi'
    showBackgroundVideo: boolean
  }

  const buildDefaultGenState = (format: 'landscape' | 'short'): GeneratorState => ({
    customScript: '',
    customAudioSrc: '',
    customAudioFileName: '',
    customPreviewReady: false,
    customPreviewLayout: format,
    customPreviewDurationFrames: PREVIEW_FPS * 10,
    customPerSentenceSec: 5,
    inheritClipTransitions: true,
    transitionMode: 'single',
    transitionSet: ['fade', 'zoom', 'pan-left-right'],
    imagesPerTransition: 5,
    secondsPerTransition: 30,
    minTransitionDurationSec: 1,
    skipShortTransitions: true,
    shortTransitionFallback: 'fade',
    mediaOverlays: [],
    clips: [],
    clipApproach: 'multi_sentence',
    sentenceKeywords: {},
    ttsSpeed: 1.0,
    ttsNoiseScale: 0.62,
    ttsNoiseW: 0.8,
    ttsSentencePause: 0.28,
    ttsNormalizeText: true,
    ttsSplitSentences: false,
    language: 'english',
    showBackgroundVideo: true
  })

  const generatorStateRef = useRef<{
    landscape: GeneratorState
    short: GeneratorState
  }>({
    landscape: buildDefaultGenState('landscape'),
    short: buildDefaultGenState('short')
  })
  const previousFormatRef = useRef<'landscape' | 'short'>(generatorFormatTab)
  const previousTransitionModeRef = useRef<TransitionMode>(transitionMode)

  const modelLanguage = useMemo(() => (language === 'hindi' ? 'Hindi' : 'English'), [language])
  const ttsLanguage = useMemo(() => (language === 'hindi' ? 'hi' : 'en'), [language])
  const ttsModel = useMemo(() => (language === 'hindi' ? 'paratham' : 'lessac'), [language])
  const apiBase = useMemo(
    () => String(process.env.NEXT_PUBLIC_API_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, ''),
    []
  )

  useEffect(() => {
    return () => {
      if (quickRecorderTimeoutRef.current) {
        window.clearTimeout(quickRecorderTimeoutRef.current)
      }
      const recorder = quickRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
    }
  }, [])

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

  useEffect(() => {
    const load = async () => {
      if (!videoId) return
      try {
        setError('')
        const url = ENDURL.NEWS_CONTENT_VIDEOS_ITEM.replace(':id', videoId)
        const res = await axiosInstance.get(url, { timeout: LONG_TIMEOUT_MS })
        const data = res?.data?.data || {}
        if (data?.language) setLanguage(data.language)
        if (data?.clip_approach) setClipApproach(data.clip_approach)
        if (data?.script) {
          const savedScript = String(data.script || '')
          if (!script) setScript(savedScript)
        }
        if (data?.audio_url) {
          const abs = toAbsoluteSrc(String(data.audio_url || ''))
          setCustomAudioSrc(abs)
          setAudioUrl(abs)
        }
        if (data?.sentence_keywords && typeof data.sentence_keywords === 'object') {
          setSentenceKeywords(data.sentence_keywords)
        }
        if (Array.isArray(data?.clips)) {
          setClips(
            data.clips.map((clip: any, idx: number) => ({
              id: Number(clip?.id || idx + 1),
              sentenceIdx: Array.isArray(clip?.sentenceIdx) ? clip.sentenceIdx : [],
              text: String(clip?.text || ''),
              images: Array.isArray(clip?.images)
                ? clip.images.map((img: any) => ({
                    name: String(img?.name || ''),
                    url: toAbsoluteSrc(String(img?.url || ''))
                  }))
                : [],
              imageWithText: Boolean(clip?.imageWithText),
              useRandomImages: Boolean(clip?.useRandomImages),
              transition: clip?.transition || 'fade',
              approach: clip?.approach || 'multi_sentence',
              keyword: String(clip?.keyword || '').trim()
            }))
          )
        }
        if (data?.status) setVideoStatus(data.status)
        if (data?.render_job_id) setRenderJobId(String(data.render_job_id))
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load video')
      }
    }
    load()
  }, [videoId])

  useEffect(() => {
    if (!videoId) return
    try {
      const raw = window.localStorage.getItem('newsContentPrefill')
      if (!raw) return
      const payload = JSON.parse(raw || '{}')
      if (payload?.targetId && String(payload.targetId) !== videoId) return
      if (payload?.title) setTitle(String(payload.title))
      if (payload?.rawText) setContent(String(payload.rawText))
      if (payload?.script) {
        const incomingScript = String(payload.script)
        setScript(incomingScript)
      }
      if (payload?.title || payload?.rawText || payload?.script) {
        try {
          window.localStorage.setItem(
            `newsContentDraft-${videoId}`,
            JSON.stringify({
              title: payload?.title || '',
              content: payload?.rawText || '',
              script: payload?.script || '',
              customScript: customScript || '',
              templateMusicSelection: payload?.templateMusicSelection || null
            })
          )
        } catch (_) {
          // ignore
        }
      }
      if (Array.isArray(payload?.images)) {
        setFilteredNewsImages(payload.images.map((img: string) => String(img)))
      }
      if (payload?.templateMusicSelection) {
        setTemplateMusicSelection(payload.templateMusicSelection)
      }
      if (Array.isArray(payload?.images)) {
        setClips(prev => {
          if (!prev.length) return prev
          
return prev.map(clip => ({
            ...clip,
            images: (clip.images || []).length
              ? clip.images
              : payload.images.map((url: string, idx: number) => ({
                  name: `prefill-${idx + 1}`,
                  url
                }))
          }))
        })
      }
      window.localStorage.removeItem('newsContentPrefill')
    } catch (_) {
      // ignore
    }
  }, [videoId])

  useEffect(() => {
    if (!videoId || didLoadDraftRef.current) return
    try {
      const raw = window.localStorage.getItem(`newsContentDraft-${videoId}`)
      if (!raw) return
      const draft = JSON.parse(raw || '{}')
      if (draft?.generator?.landscape && draft?.generator?.short) {
        generatorStateRef.current = {
          landscape: { ...buildDefaultGenState('landscape'), ...draft.generator.landscape },
          short: { ...buildDefaultGenState('short'), ...draft.generator.short }
        }
        applyGeneratorState(generatorStateRef.current[generatorFormatTab])
      }
      if (draft?.title && !title) setTitle(String(draft.title))
      if (draft?.content && !content) setContent(String(draft.content))
      if (draft?.script && !script) setScript(String(draft.script))
      if (draft?.customScript && !customScript) setCustomScript(String(draft.customScript))
      if (draft?.clipApproach) setClipApproach(draft.clipApproach)
      if (typeof draft?.inheritClipTransitions === 'boolean') {
        setInheritClipTransitions(Boolean(draft.inheritClipTransitions))
      }
      if (!draft?.generator?.landscape) {
        if (draft?.transitionMode) setTransitionMode(draft.transitionMode)
        if (Array.isArray(draft?.transitionSet)) {
          const next = draft.transitionSet.map((val: string) => String(val)) as TransitionKey[]
          if (next.length) setTransitionSet(next)
        }
        if (Number.isFinite(Number(draft?.imagesPerTransition))) setImagesPerTransition(Number(draft.imagesPerTransition))
        if (Number.isFinite(Number(draft?.secondsPerTransition))) setSecondsPerTransition(Number(draft.secondsPerTransition))
        if (Number.isFinite(Number(draft?.minTransitionDurationSec))) setMinTransitionDurationSec(Number(draft.minTransitionDurationSec))
        if (typeof draft?.skipShortTransitions === 'boolean') setSkipShortTransitions(Boolean(draft.skipShortTransitions))
        if (draft?.shortTransitionFallback) setShortTransitionFallback(draft.shortTransitionFallback)
        if (Array.isArray(draft?.mediaOverlays) && !mediaOverlays.length) {
          setMediaOverlays(
            draft.mediaOverlays.map((item: any, idx: number) => ({
              id: String(item?.id || `overlay-${idx + 1}`),
              type: item?.type === 'video' ? 'video' : 'image',
              url: String(item?.url || ''),
              position: item?.position || 'bottom-right',
              size: item?.size || 'md',
              startSec: Number(item?.startSec || 0),
              endSec: Number(item?.endSec || 10),
              animation: item?.animation === 'fade' ? 'fade' : 'none',
              scheduleMode:
                item?.scheduleMode === 'timeline_list'
                  ? 'timeline_list'
                  : item?.scheduleMode === 'random'
                  ? 'random'
                  : item?.scheduleMode === 'interval' || item?.repeat
                  ? 'interval'
                  : 'single',
              repeat: Boolean(item?.repeat),
              repeatEverySec: Math.max(1, Number(item?.repeatEverySec || 30)),
              timelineStarts: String(item?.timelineStarts || ''),
              randomCount: Math.max(1, Number(item?.randomCount || 3)),
              randomDurationSec: Math.max(0.5, Number(item?.randomDurationSec || 3)),
              label: item?.label ? String(item.label) : ''
            }))
          )
        }
      }
      if (!draft?.generator?.landscape && draft?.sentenceKeywords && Object.keys(sentenceKeywords).length === 0) {
        setSentenceKeywords(draft.sentenceKeywords)
      }
      if (Array.isArray(draft?.images) && !filteredNewsImages.length) {
        setFilteredNewsImages(draft.images.map((img: string) => String(img)))
      }
      if (Array.isArray(draft?.imageGallery) && !imageGallery.length) {
        setImageGallery(
          draft.imageGallery.map((img: any, idx: number) => ({
            name: String(img?.name || `gallery-${idx + 1}`),
            url: String(img?.url || '')
          }))
        )
      }
      didLoadDraftRef.current = true
    } catch (_) {
      // ignore
    }
  }, [videoId, title, content, script, customScript, filteredNewsImages.length, sentenceKeywords, imageGallery.length, templateMusicSelection])

  useEffect(() => {
    if (!videoId) return
    try {
      generatorStateRef.current[generatorFormatTab] = snapshotGeneratorState()
      window.localStorage.setItem(
        `newsContentDraft-${videoId}`,
        JSON.stringify({
          title: title || '',
          content: content || '',
          script: script || '',
          customScript: customScript || '',
          images: filteredNewsImages || [],
          templateMusicSelection: templateMusicSelection || null,
          sentenceKeywords: sentenceKeywords || {},
          imageGallery: imageGallery || [],
          clipApproach: clipApproach || 'multi_sentence',
          generator: generatorStateRef.current
        })
      )
    } catch (_) {
      // ignore
    }
  }, [
    videoId,
    title,
    content,
    script,
    customScript,
    customAudioSrc,
    customAudioFileName,
    customPreviewReady,
    customPreviewLayout,
    customPreviewDurationFrames,
    customPerSentenceSec,
    inheritClipTransitions,
    transitionMode,
    transitionSet,
    imagesPerTransition,
    secondsPerTransition,
    minTransitionDurationSec,
    skipShortTransitions,
    shortTransitionFallback,
    mediaOverlays,
    clips,
    clipApproach,
    sentenceKeywords,
    ttsSpeed,
    ttsNoiseScale,
    ttsNoiseW,
    ttsSentencePause,
    ttsNormalizeText,
    ttsSplitSentences,
    language,
    showBackgroundVideo,
    filteredNewsImages,
    imageGallery,
    generatorFormatTab
  ])

  useEffect(() => {
    const previousMode = previousTransitionModeRef.current
    if (transitionMode === 'single' && previousMode !== 'single' && transitionSet.length > 1) {
      setTransitionSet(transitionSet.slice(-1))
    }
    previousTransitionModeRef.current = transitionMode
  }, [transitionMode, transitionSet])

  useEffect(() => {
    const prev = previousFormatRef.current
    if (prev === generatorFormatTab) return
    generatorStateRef.current[prev] = snapshotGeneratorState()
    const nextState =
      generatorStateRef.current[generatorFormatTab] || buildDefaultGenState(generatorFormatTab)
    applyGeneratorState(nextState)
    previousFormatRef.current = generatorFormatTab
  }, [generatorFormatTab])

  useEffect(() => {
    if (customScript.trim()) {
      setScriptPanelCollapsed(true)
    }
  }, [customScript])

  useEffect(() => {
    if (!videoId || !renderJobId || videoStatus !== 'rendering') return
    let cancelled = false
    const statusUrls = [
      ENDURL.NEWS_CONTENT_VIDEOS_RENDER_STATUS_REMOTION_PREVIEW.replace(':id', videoId).replace(':jobId', renderJobId),
      ENDURL.NEWS_CONTENT_VIDEOS_RENDER_STATUS_FFMPEG.replace(':id', videoId).replace(':jobId', renderJobId),
      ENDURL.NEWS_CONTENT_VIDEOS_RENDER_STATUS.replace(':id', videoId).replace(':jobId', renderJobId)
    ]

    const fetchStatus = async () => {
      for (const statusUrl of statusUrls) {
        try {
          const statusRes = await axiosInstance.get(statusUrl, { timeout: LONG_TIMEOUT_MS })
          const job = statusRes?.data?.data || statusRes?.data?.job || statusRes?.data
          if (job) return job
        } catch (err: any) {
          const code = Number(err?.response?.status || 0)
          if (code && code !== 404) throw err
        }
      }
      throw new Error('Render job not found')
    }

    const poll = async () => {
      try {
        const job = await fetchStatus()
        const state = String(job?.status || '')
        const progress = Number(job?.progress || 0)
        if (!cancelled) {
          if (state === 'rendering') {
            setRenderStatus(`rendering (${Math.max(1, Math.min(99, progress || 1))}%)`)
          } else {
            setRenderStatus(`${state} (${progress}%)`)
          }
        }
        if (state === 'completed') {
          if (!cancelled) {
            setVideoStatus('ready_for_download')
            setSuccess('Video ready for download.')
          }
          
return true
        }
        if (state === 'failed') {
          if (!cancelled) setError(job?.error || 'Render failed')
          
return true
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Failed to fetch render status')
        
return true
      }
      
return false
    }

    const interval = setInterval(async () => {
      const done = await poll()
      if (done) clearInterval(interval)
    }, 2000)
    poll()
    
return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [videoId, renderJobId, videoStatus])

  const parsedSentences = useMemo(() => {
    const src = String(customScript || '').trim()
    if (!src) return []
    
return src
      .split(/[.!?\u0964|]+/)
      .map(s => s.trim())
      .filter(Boolean)
  }, [customScript])

  const splitScriptToSentences = (rawText: string) =>
    String(rawText || '')
      .trim()
      .split(/[.!?\u0964|]+/)
      .map(s => s.trim())
      .filter(Boolean)

  const buildSentenceFrames = (sentencesInput: string[], totalFrames: number) => {
    const safeSentences = Array.isArray(sentencesInput) ? sentencesInput : []
    const lineCount = Math.max(1, safeSentences.length || 1)
    const safeTotalFrames = Math.max(1, Math.round(Number(totalFrames || 1)))
    const wordCounts = safeSentences.map(sentence => sentence.split(/\s+/).filter(Boolean).length)
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0)
    if (!totalWords) {
      const fallback = Math.max(6, Math.floor(safeTotalFrames / lineCount))
      
return new Array(lineCount).fill(fallback)
    }
    const baseFrames = wordCounts.map(count => Math.max(1, Math.round((count / totalWords) * safeTotalFrames)))
    const sumFrames = baseFrames.reduce((sum, count) => sum + count, 0)
    const diff = safeTotalFrames - sumFrames
    if (diff === 0) return baseFrames
    const next = baseFrames.slice()
    const step = diff > 0 ? 1 : -1
    for (let i = 0; i < Math.abs(diff); i += 1) {
      const idx = i % next.length
      next[idx] = Math.max(1, next[idx] + step)
    }
    
return next
  }

  const buildSentenceBoundaries = (frames: number[]) => {
    const boundaries: number[] = []
    let acc = 0
    frames.forEach(count => {
      acc += Number(count || 0)
      boundaries.push(acc)
    })
    
return boundaries
  }
  const previewSentenceFrames = useMemo(
    () => buildSentenceFrames(parsedSentences, Math.max(1, Number(customPreviewDurationFrames || 1))),
    [customPreviewDurationFrames, parsedSentences]
  )

  const buildSeedValue = (seedKey: string) => {
    let seed = 0
    for (let i = 0; i < seedKey.length; i += 1) {
      seed = (seed * 31 + seedKey.charCodeAt(i)) % 100000
    }
    
return seed
  }

  const transitionOptions: Array<{ value: TransitionKey; label: string }> = [
    { value: 'fade', label: 'Fade' },
    { value: 'slide-left', label: 'Slide Left' },
    { value: 'slide-right', label: 'Slide Right' },
    { value: 'zoom-in', label: 'Zoom In' },
    { value: 'zoom-out', label: 'Zoom Out' },
    { value: 'zoom', label: 'Zoom In-Out' },
    { value: 'pan-left-right', label: 'Pan Left ? Right' },
    { value: 'pan-right-left', label: 'Pan Right ? Left' },
    { value: 'pan-top-bottom', label: 'Pan Top ? Bottom' },
    { value: 'pan-bottom-top', label: 'Pan Bottom ? Top' }
  ]

  const normalizeTransitionSet = (list: TransitionKey[]) => {
    const seen = new Set<string>()
    
return (Array.isArray(list) ? list : [])
      .map(val => String(val) as TransitionKey)
      .filter(val => transitionOptions.some(opt => opt.value === val))
      .filter(val => {
        if (seen.has(val)) return false
        seen.add(val)
        
return true
      })
  }

  const isSequenceUsable = !inheritClipTransitions
  const applyTransitionStrategy = <
    T extends { durationSec: number; transition?: TransitionKey | 'none' }
  >(
    segmentsInput: T[]
  ) => {
    const baseSegments = Array.isArray(segmentsInput) ? segmentsInput : []
    if (!isSequenceUsable) {
      return baseSegments.map(seg => ({
        ...seg,
        transition: seg.transition || 'fade'
      }))
    }

    const list = normalizeTransitionSet(transitionSet)
    const transitions = list.length ? list : (['fade'] as TransitionKey[])
    if (transitionMode === 'single') {
      const singleTransition = transitions[0] || 'fade'
      
return baseSegments.map(seg => ({
        ...seg,
        transition: singleTransition
      }))
    }
    const minDur = Math.max(0, Number(minTransitionDurationSec || 0))
    const imagesTarget = Math.max(1, Number(imagesPerTransition || 1))
    const timeTarget = Math.max(0.1, Number(secondsPerTransition || 0.1))

    let tIndex = 0
    let imageCount = 0
    let timeCount = 0

    return baseSegments.map(seg => {
      const dur = Math.max(0, Number(seg.durationSec || 0))
      const tooShort = skipShortTransitions && minDur > 0 && dur < minDur
      const transition = tooShort
        ? shortTransitionFallback === 'none'
          ? 'none'
          : shortTransitionFallback
        : transitions[tIndex % transitions.length]

      if (!tooShort) {
        imageCount += 1
        timeCount += dur

        const hitImages = imageCount >= imagesTarget
        const hitTime = timeCount >= timeTarget

        if (
          (transitionMode === 'cycle_images' && hitImages) ||
          (transitionMode === 'cycle_time' && hitTime) ||
          (transitionMode === 'hybrid' && (hitImages || hitTime))
        ) {
          tIndex += 1
          imageCount = 0
          timeCount = 0
        }
      }

      return { ...seg, transition: transition as TransitionKey | 'none' }
    })
  }

  const overlayPositions: Array<{ value: OverlayPosition; label: string }> = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'center', label: 'Center' }
  ]
  const overlaySizes: Array<{ value: OverlaySize; label: string }> = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' }
  ]
  const overlayAnimations: Array<{ value: OverlayAnimation; label: string }> = [
    { value: 'none', label: 'None' },
    { value: 'fade', label: 'Fade' }
  ]
  const overlayScheduleModes: Array<{ value: OverlayScheduleMode; label: string }> = [
    { value: 'single', label: 'Single' },
    { value: 'interval', label: 'Repeat Every' },
    { value: 'timeline_list', label: 'Timeline List' },
    { value: 'random', label: 'Random N Times' }
  ]
  const generatorSections = ['Script', 'Audio', 'Clip Builder', 'Gallery', 'Transitions', 'Preview & Download']
  const activeSectionTab = generatorSectionTab[generatorFormatTab]
  const handleSectionTabChange = (_event: SyntheticEvent, value: number) => {
    setGeneratorSectionTab(prev => ({ ...prev, [generatorFormatTab]: value }))
  }
  const addOverlayItem = () => {
    const nextId = `overlay-${Date.now()}`
    setMediaOverlays(prev => [
      ...prev,
      {
        id: nextId,
        type: 'image',
        url: '',
        position: 'bottom-right',
        size: 'md',
        startSec: 0,
        endSec: 10,
        animation: 'none',
        scheduleMode: 'single',
        repeat: false,
        repeatEverySec: 30,
        timelineStarts: '',
        randomCount: 3,
        randomDurationSec: 3,
        label: ''
      }
    ])
  }
  const updateOverlayItem = (id: string, patch: Partial<(typeof mediaOverlays)[number]>) => {
    setMediaOverlays(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))
  }
  const removeOverlayItem = (id: string) => {
    setMediaOverlays(prev => prev.filter(item => item.id !== id))
  }

  const expandMediaOverlaySchedule = (
    overlay: (typeof mediaOverlays)[number],
    totalDurationSec: number
  ) => {
    const normalizedStart = Math.max(0, Number(overlay?.startSec || 0))
    const normalizedEnd = Math.max(normalizedStart + 0.01, Number(overlay?.endSec || normalizedStart + 0.01))
    const singleDuration = Math.max(0.05, normalizedEnd - normalizedStart)
    const scheduleMode =
      overlay?.scheduleMode ||
      (overlay?.repeat ? 'interval' : 'single')

    if (scheduleMode === 'timeline_list') {
      const starts = String(overlay?.timelineStarts || '')
        .split(',')
        .map(item => Number(String(item).trim()))
        .filter(value => Number.isFinite(value) && value >= 0)

      return starts.map(startSec => ({
        ...overlay,
        startSec,
        endSec: Math.min(totalDurationSec, startSec + singleDuration),
        repeat: false
      }))
    }

    if (scheduleMode === 'random') {
      const count = Math.max(1, Number(overlay?.randomCount || 1))
      const duration = Math.max(0.5, Number(overlay?.randomDurationSec || singleDuration))
      const windowStart = normalizedStart
      const windowEnd = Math.max(windowStart + duration, normalizedEnd)
      const available = Math.max(0, windowEnd - windowStart - duration)
      const seedSource = `${overlay.id}:${overlay.url}:${overlay.label || ''}`
      let seed = 0
      for (let i = 0; i < seedSource.length; i += 1) {
        seed = (seed * 31 + seedSource.charCodeAt(i)) % 2147483647
      }
      const normalizedStarts: number[] = []
      for (let i = 0; i < count; i += 1) {
        seed = (seed * 48271) % 2147483647
        const ratio = seed / 2147483647
        const startSec = windowStart + ratio * available
        normalizedStarts.push(Number(startSec.toFixed(3)))
      }
      normalizedStarts.sort((a, b) => a - b)
      
return normalizedStarts.map(startSec => ({
        ...overlay,
        startSec,
        endSec: Math.min(totalDurationSec, startSec + duration),
        repeat: false
      }))
    }

    if (scheduleMode === 'interval') {
      const repeatEverySec = Math.max(singleDuration, Number(overlay?.repeatEverySec || 30))
      const expanded = []
      for (let nextStart = normalizedStart; nextStart < totalDurationSec; nextStart += repeatEverySec) {
        expanded.push({
          ...overlay,
          startSec: nextStart,
          endSec: Math.min(totalDurationSec, nextStart + singleDuration),
          repeat: false
        })
      }
      
return expanded
    }

    return [
      {
        ...overlay,
        startSec: normalizedStart,
        endSec: normalizedEnd,
        repeat: false
      }
    ]
  }

  const snapshotGeneratorState = (): GeneratorState => ({
    customScript,
    customAudioSrc,
    customAudioFileName,
    customPreviewReady,
    customPreviewLayout,
    customPreviewDurationFrames,
    customPerSentenceSec,
    inheritClipTransitions,
    transitionMode,
    transitionSet,
    imagesPerTransition,
    secondsPerTransition,
    minTransitionDurationSec,
    skipShortTransitions,
    shortTransitionFallback,
    mediaOverlays,
    clips,
    clipApproach,
    sentenceKeywords,
    ttsSpeed,
    ttsNoiseScale,
    ttsNoiseW,
    ttsSentencePause,
    ttsNormalizeText,
    ttsSplitSentences,
    language,
    showBackgroundVideo
  })

  const applyGeneratorState = (state: GeneratorState) => {
    setCustomScript(state.customScript)
    setCustomAudioSrc(state.customAudioSrc)
    setCustomAudioFileName(state.customAudioFileName)
    setCustomPreviewReady(state.customPreviewReady)
    setCustomPreviewLayout(state.customPreviewLayout)
    setCustomPreviewDurationFrames(state.customPreviewDurationFrames)
    setCustomPerSentenceSec(state.customPerSentenceSec)
    setInheritClipTransitions(state.inheritClipTransitions)
    setTransitionMode(state.transitionMode)
    setTransitionSet(state.transitionSet)
    setImagesPerTransition(state.imagesPerTransition)
    setSecondsPerTransition(state.secondsPerTransition)
    setMinTransitionDurationSec(state.minTransitionDurationSec)
    setSkipShortTransitions(state.skipShortTransitions)
    setShortTransitionFallback(state.shortTransitionFallback)
    setMediaOverlays(state.mediaOverlays)
    setClips(state.clips)
    setClipApproach(state.clipApproach)
    setSentenceKeywords(state.sentenceKeywords)
    setTtsSpeed(state.ttsSpeed)
    setTtsNoiseScale(state.ttsNoiseScale)
    setTtsNoiseW(state.ttsNoiseW)
    setTtsSentencePause(state.ttsSentencePause)
    setTtsNormalizeText(state.ttsNormalizeText)
    setTtsSplitSentences(state.ttsSplitSentences)
    setLanguage(state.language)
    setShowBackgroundVideo(state.showBackgroundVideo)
  }

  const buildPreviewTimeline = (params: {
    scriptSource: string
    sentences: string[]
    durationSec: number
    fps: number
    clips: typeof activeClips
    titleLabel: string
  }) => {
    const { scriptSource, sentences, durationSec, fps, clips, titleLabel } = params
    const totalFrames = Math.max(1, Math.round(durationSec * fps))
    const sentenceFrames = buildSentenceFrames(sentences, totalFrames)
    const sentenceBoundaries = buildSentenceBoundaries(sentenceFrames)
    const lineCount = Math.max(1, sentences.length)

    const clipRanges = clips.map(clip => {
      const indices = Array.isArray(clip?.sentenceIdx) ? [...clip.sentenceIdx].sort((a, b) => a - b) : []
      const startIdx = indices.length ? indices[0] : 0
      const endIdx = indices.length ? indices[indices.length - 1] : startIdx
      
return {
        startIdx,
        endIdx,
        images: Array.isArray(clip?.images) ? clip.images : [],
        imageWithText: Boolean(clip?.imageWithText),
        useRandomImages: Boolean(clip?.useRandomImages),
        transition: (clip?.transition || 'fade') as any
      }
    }).sort((a, b) => a.startIdx - b.startIdx)

    const allClipImages = clipRanges.flatMap(range => (Array.isArray(range.images) ? range.images : []))
    const seedKey = `${titleLabel}:${scriptSource}:${lineCount}`
    const seed = buildSeedValue(seedKey)

    const resolveRandomImages = (range: typeof clipRanges[number], count: number) => {
      if (!range.useRandomImages || !allClipImages.length) return range.images || []
      const out: Array<{ url: string }> = []
      for (let i = 0; i < count; i += 1) {
        const idx = (seed + i * 17 + range.startIdx * 13) % allClipImages.length
        out.push(allClipImages[idx])
      }
      
return out
    }

    const rawSegments: Array<{
      path: string
      durationSec: number
      startIdx?: number
      endIdx?: number
      imageIdx?: number
      imagesInRange?: number
      imageWithText?: boolean
      transition?: TransitionKey | 'none'
    }> = []

    clipRanges.forEach(activeClip => {
      const startIdx = Math.max(0, activeClip.startIdx)
      const endIdx = Math.min(activeClip.endIdx, lineCount - 1)
      if (endIdx < startIdx) return
      const clipStartFrame = startIdx === 0 ? 0 : sentenceBoundaries[startIdx - 1] || 0
      const clipEndFrame = sentenceBoundaries[endIdx] || totalFrames
      const clipDurationFrames = Math.max(1, clipEndFrame - clipStartFrame)
      const sentenceCount = Math.max(1, endIdx - startIdx + 1)
      const resolvedImages = resolveRandomImages(activeClip, sentenceCount)
      const imagesToUse = resolvedImages.length ? resolvedImages : activeClip.images || []
      if (!imagesToUse.length) return

      const segmentFrames = Math.max(1, Math.floor(clipDurationFrames / imagesToUse.length))
      imagesToUse.forEach((img, imageIdx) => {
        const frameStart = clipStartFrame + imageIdx * segmentFrames
        const frameEnd =
          imageIdx === imagesToUse.length - 1
            ? clipEndFrame
            : Math.min(clipEndFrame, clipStartFrame + (imageIdx + 1) * segmentFrames)
        const durationFrames = Math.max(1, frameEnd - frameStart)
        rawSegments.push({
          path: String(img?.url || ''),
          durationSec: durationFrames / fps,
          transition: (activeClip as any).transition || 'fade',
          imageWithText: Boolean((activeClip as any).imageWithText),
          startIdx,
          endIdx,
          imageIdx,
          imagesInRange: imagesToUse.length
        })
      })
    })

    const overlays = sentences.map((sentence, sentenceIdx) => {
      const startFrame = sentenceIdx === 0 ? 0 : sentenceBoundaries[sentenceIdx - 1] || 0
      const endFrame = sentenceBoundaries[sentenceIdx] || totalFrames
      
return {
        startSec: startFrame / fps,
        endSec: endFrame / fps,
        text: sentence,
        showFooter: sentenceIdx >= Math.max(0, lineCount - 3)
      }
    })

    return { segments: applyTransitionStrategy(rawSegments), overlays, totalFrames }
  }

  const activeClips = useMemo(
    () => clips.filter(clip => (clip.approach || 'multi_sentence') === clipApproach),
    [clips, clipApproach]
  )
  const previewTimelineForRender = useMemo(() => {
    const durationSec = Math.max(0.01, Number(customPreviewDurationFrames || 1) / PREVIEW_FPS)
    
return buildPreviewTimeline({
      scriptSource: customScript.trim() ? customScript.trim() : script.trim(),
      sentences: parsedSentences,
      durationSec,
      fps: PREVIEW_FPS,
      clips: activeClips,
      titleLabel: 'R4D News'
    })
  }, [activeClips, buildPreviewTimeline, customPreviewDurationFrames, customScript, parsedSentences, script])

  const sentenceImageRows = useMemo(
    () =>
      parsedSentences.map((sentence, idx) => {
        const clip = clips.find(item => Array.isArray(item.sentenceIdx) && item.sentenceIdx.includes(idx))
        
return {
          idx,
          sentence,
          images: Array.isArray(clip?.images) ? clip.images : []
        }
      }),
    [parsedSentences, clips]
  )

  const galleryItems = useMemo(() => {
    const fromClips = clips.flatMap(clip => clip.images || [])
    const fromFiltered = filteredNewsImages.map((url, idx) => ({ name: `filtered-${idx + 1}`, url }))
    const merged = [...imageGallery, ...fromFiltered, ...fromClips]
    const uniq = new Map<string, { name: string; url: string }>()
    merged.forEach(item => {
      if (item?.url && !uniq.has(item.url)) {
        uniq.set(item.url, { name: item.name || 'image', url: item.url })
      }
    })
    
return Array.from(uniq.values())
  }, [imageGallery, filteredNewsImages, clips])

  const galleryUseCounts = useMemo(() => {
    const counts = new Map<string, number>()
    clips.forEach(clip => {
      ;(clip.images || []).forEach(img => {
        const url = String(img?.url || '')
        if (!url) return
        counts.set(url, (counts.get(url) || 0) + 1)
      })
    })
    
return counts
  }, [clips])
  const usedSentenceIdx = useMemo(() => new Set(activeClips.flatMap(clip => clip.sentenceIdx)), [activeClips])
  const nextClipNeedingImagesId = useMemo(() => {
    const nextClip = activeClips.find(clip => !Array.isArray(clip.images) || clip.images.length === 0)
    
return nextClip ? nextClip.id : null
  }, [activeClips])
  const nextRequiredIdx = useMemo(() => {
    for (let i = 0; i < parsedSentences.length; i += 1) {
      if (!usedSentenceIdx.has(i)) return i
    }
    
return -1
  }, [parsedSentences, usedSentenceIdx])
  const canOpenClipModal = parsedSentences.length > 0
  const usedSentenceIdxForModal = useMemo(() => {
    const used = new Set<number>()
    activeClips.forEach(clip => {
      if (editingClipId !== null && clip.id === editingClipId) return
      clip.sentenceIdx.forEach(idx => used.add(idx))
    })
    
return used
  }, [activeClips, editingClipId])
  const handleOpenClipModal = () => {
    setClipSelectedIdx([])
    setClipImages([])
    setClipSelectionCollapsed(false)
    setClipImageWithText(false)
    setClipUseRandomImages(false)
    setClipTransition('fade')
    setImageQuery('')
    setImageProvider('all')
    setImageResults([])
    setEditingClipId(null)
    setClipModalOpen(true)
  }
  const handleOpenSingleSentenceModal = (idx: number) => {
    const existing = activeClips.find(clip => Array.isArray(clip.sentenceIdx) && clip.sentenceIdx.includes(idx))
    if (existing) {
      handleEditClip(existing.id)
      
return
    }
    setClipSelectedIdx([idx])
    setClipImages([])
    setClipSelectionCollapsed(true)
    setClipImageWithText(false)
    setClipUseRandomImages(false)
    setClipTransition('fade')
    setImageQuery(sentenceKeywords[idx] || '')
    setImageProvider('all')
    setImageResults([])
    setEditingClipId(null)
    setClipModalOpen(true)
  }
  const handleCloseClipModal = () => setClipModalOpen(false)
  const handleToggleClipSentence = (idx: number) => {
    if (usedSentenceIdxForModal.has(idx)) return
    setClipSelectedIdx(prev => {
      if (clipApproach === 'single_sentence') {
        if (idx !== nextRequiredIdx) return prev
        
return prev.includes(idx) ? [] : [idx]
      }
      if (!prev.length) {
        if (idx !== nextRequiredIdx) return prev
        
return [idx]
      }
      if (prev.includes(idx)) {
        if (prev.length === 1) return []
        const min = Math.min(...prev)
        const max = Math.max(...prev)
        if (idx !== min && idx !== max) return prev
        
return prev.filter(item => item !== idx)
      }
      const min = Math.min(...prev)
      const max = Math.max(...prev)
      if (idx === min - 1 || idx === max + 1) {
        return [...prev, idx].sort((a, b) => a - b)
      }
      
return prev
    })
  }

  useEffect(() => {
    if (!clipModalOpen || clipApproach !== 'multi_sentence' || clipSelectionCollapsed || editingClipId !== null) return
    if (nextRequiredIdx < 0) return

    let attempts = 0
    let cancelled = false

    const scrollToTarget = () => {
      if (cancelled) return

      const target = clipSentenceItemRefs.current[nextRequiredIdx]
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
return
      }

      if (attempts < 12) {
        attempts += 1
        window.setTimeout(scrollToTarget, 60)
      }
    }

    window.setTimeout(scrollToTarget, 80)

    return () => {
      cancelled = true
    }
  }, [clipModalOpen, clipApproach, clipSelectionCollapsed, editingClipId, nextRequiredIdx])

  useEffect(() => {
    if (activeSectionTab !== 2 || clipApproach !== 'multi_sentence' || !nextClipNeedingImagesId) return

    let cancelled = false
    let attempts = 0

    const scrollToClipCard = () => {
      if (cancelled) return

      const target = clipCardRefs.current[nextClipNeedingImagesId]
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
return
      }

      if (attempts < 12) {
        attempts += 1
        window.setTimeout(scrollToClipCard, 60)
      }
    }

    window.setTimeout(scrollToClipCard, 80)

    return () => {
      cancelled = true
    }
  }, [activeSectionTab, clipApproach, nextClipNeedingImagesId, activeClips.length])

  useEffect(() => {
    setClipSelectedIdx([])
    setClipImages([])
    setClipSelectionCollapsed(false)
    setClipImageWithText(false)
    setClipUseRandomImages(false)
    setClipTransition('fade')
  }, [clipApproach])

  useEffect(() => {
    const next: Record<number, string> = {}
    clips.forEach(clip => {
      if (typeof clip.keyword === 'string' && clip.keyword.trim() && clip.sentenceIdx.length) {
        next[clip.sentenceIdx[0]] = clip.keyword.trim()
      }
    })
    setSentenceKeywords(prev => ({ ...prev, ...next }))
  }, [clips])
  const handleAddModalImages = (files: FileList | null) => {
    if (!files || !files.length) return
    if (!videoId) {
      setError('Video id missing. Please reload.')
      
return
    }
    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
    const upload = async (file: File) => {
      const dataUrl = await toDataUrl(file)
      const url = ENDURL.NEWS_CONTENT_VIDEOS_UPLOAD_IMAGE.replace(':id', videoId)
      const res = await axiosInstance.post(
        url,
        { dataUrl, fileName: file.name },
        { timeout: LONG_TIMEOUT_MS }
      )
      const savedUrl = String(res?.data?.data?.url || '').trim()
      
return { name: file.name, url: toAbsoluteSrc(savedUrl || '') }
    }
    Promise.all(Array.from(files).map(file => upload(file)))
      .then(nextImages => {
        setImageGallery(prev => {
          const merged = [...prev]
          nextImages.forEach(img => {
            if (!merged.some(item => item.url === img.url)) merged.push(img)
          })
          
return merged
        })
        setClipImages(prev => {
          const merged = [...prev]
          nextImages.forEach(img => {
            if (!merged.some(item => item.url === img.url)) merged.push(img)
          })
          
return merged
        })
      })
      .catch(err => setError(err?.message || 'Failed to upload images'))
  }
  const handleAddOverlayImages = (overlayId: string, files: FileList | null) => {
    if (!files || !files.length) return
    if (!videoId) {
      setError('Video id missing. Please reload.')
      
return
    }
    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
    const upload = async (file: File) => {
      const dataUrl = await toDataUrl(file)
      const url = ENDURL.NEWS_CONTENT_VIDEOS_UPLOAD_IMAGE.replace(':id', videoId)
      const res = await axiosInstance.post(
        url,
        { dataUrl, fileName: file.name },
        { timeout: LONG_TIMEOUT_MS }
      )
      const savedUrl = String(res?.data?.data?.url || '').trim()
      
return { name: file.name, url: toAbsoluteSrc(savedUrl || '') }
    }

    Promise.all(Array.from(files).map(file => upload(file)))
      .then(nextImages => {
        const first = nextImages[0]
        if (!first?.url) return
        setImageGallery(prev => {
          const merged = [...prev]
          nextImages.forEach(img => {
            if (!merged.some(item => item.url === img.url)) merged.push(img)
          })
          
return merged
        })
        updateOverlayItem(overlayId, { url: first.url, type: 'image' })
      })
      .catch(err => setError(err?.message || 'Failed to upload overlay image'))
  }
  const canSaveClip = clipSelectedIdx.length > 0
  const handleSaveClip = async () => {
    if (!clipSelectedIdx.length) return
    const sentenceIdx = [...clipSelectedIdx].sort((a, b) => a - b)
    const parts = sentenceIdx.map(idx => parsedSentences[idx]).filter(Boolean)
            const text = parts.join('. ').trim()
            if (!text) return
            const keyword =
              clipApproach === 'single_sentence' && sentenceIdx.length === 1
                ? String(sentenceKeywords[sentenceIdx[0]] || '').trim()
                : editingClipId !== null
                ? String(clips.find(clip => clip.id === editingClipId)?.keyword || '').trim()
                : ''
    const nextClips =
      editingClipId !== null
        ? clips.map(clip =>
            clip.id === editingClipId
              ? {
                  ...clip,
                  sentenceIdx,
                  text,
                  images: clipImages,
                  imageWithText: clipImageWithText,
                  useRandomImages: clipUseRandomImages,
                  transition: clipTransition,
                  keyword: keyword || clip.keyword || ''
                }
              : clip
          )
        : [
            ...clips,
            {
              id: clips.length + 1,
              sentenceIdx,
              text,
              images: clipImages,
              imageWithText: clipImageWithText,
              useRandomImages: clipUseRandomImages,
              transition: clipTransition,
              approach: clipApproach,
              keyword
            }
          ]
    const persisted = await persistClips(nextClips)
    setClips(persisted)
    setClipModalOpen(false)
  }

  const handleEditClip = (clipId: number) => {
    const clip = activeClips.find(item => item.id === clipId)
    if (!clip) return
    setEditingClipId(clipId)
    setClipSelectedIdx(Array.isArray(clip.sentenceIdx) ? clip.sentenceIdx.slice() : [])
    setClipImages(Array.isArray(clip.images) ? clip.images : [])
    setClipImageWithText(Boolean(clip.imageWithText))
    setClipUseRandomImages(Boolean(clip.useRandomImages))
    setClipTransition((clip as any).transition || 'fade')
    setImageQuery(clip.keyword || '')
    setClipSelectionCollapsed(true)
    setClipModalOpen(true)
  }

  useEffect(() => {
    if (language !== 'hindi') return
    if (targetDurationSec === 60) setTargetDurationSec(240)
    if (scriptWordsMin === 120) setScriptWordsMin(400)
    if (scriptWordsMax === 220) setScriptWordsMax(450)
  }, [language, scriptWordsMax, scriptWordsMin, targetDurationSec])

  const handleGenerateScript = async () => {
    try {
      setError('')
      setSuccess('')
      setLoadingScript(true)
      setAudioUrl('')
      setAudioFileName('')
      const durationValue = Number.isFinite(targetDurationSec) && targetDurationSec >= 20 ? targetDurationSec : undefined
      const resolvedScriptLength = durationValue && durationValue > 120 ? 'long' : 'short'
      const minWordsValue = Number.isFinite(scriptWordsMin) && scriptWordsMin >= 30 ? scriptWordsMin : undefined
      const maxWordsValue = Number.isFinite(scriptWordsMax) && scriptWordsMax >= 30 ? scriptWordsMax : undefined

      const res = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCRIPT,
        {
          topic: title.trim(),
          extraInfo: content.trim(),
          extraInfoType: 'GENERAL_CONTEXT',
          platform: 'YouTube',
          tone: 'newsroom, concise, factual',
          language: modelLanguage,
          targetDurationSec: durationValue,
          scriptLength: resolvedScriptLength,
          scriptWordsMin: minWordsValue,
          scriptWordsMax: maxWordsValue,
          model: model.trim() || undefined
        },
        { timeout: LONG_TIMEOUT_MS }
      )

      const data = res?.data?.data || {}
      const generated = String(data?.videoScript || data?.script || '').trim()
      if (!generated) {
        throw new Error('No script was returned')
      }
      setScript(generated)
      setSuccess('Script generated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate script')
    } finally {
      setLoadingScript(false)
    }
  }

  const handleGenerateAudio = async () => {
    if (!script.trim()) return
    try {
      setError('')
      setSuccess('')
      setLoadingAudio(true)

      const res = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCENE_AUDIOS,
        {
          language: ttsLanguage,
          model: ttsModel,
          scenes: [
            {
              id: 1,
              narration: script.trim(),
              heading: title.trim() || 'News'
            }
          ],
          tuning: {
            speed: ttsSpeed,
            noiseScale: ttsNoiseScale,
            noiseW: ttsNoiseW,
            sentencePause: ttsSentencePause
          },
          options: {
            normalizeText: ttsNormalizeText,
            splitSentences: ttsSplitSentences
          }
        },
        { timeout: LONG_TIMEOUT_MS }
      )

      const scenes = Array.isArray(res?.data?.data?.scenes) ? res.data.data.scenes : []
      const first = scenes[0] || {}
      const url = String(first?.audioUrl || '').trim()
      if (!url) throw new Error('Audio URL missing')
      const absUrl = toAbsoluteSrc(url)
      setAudioUrl(absUrl)
      setAudioFileName(String(first?.fileName || '').trim())

      if (videoId) {
        const relative = toRelativeAssetUrl(url)
        const updateUrl = ENDURL.NEWS_CONTENT_VIDEOS_UPDATE.replace(':id', videoId)
        await axiosInstance.put(
          updateUrl,
          { audioUrl: relative || url },
          { timeout: LONG_TIMEOUT_MS }
        )
      }

      setSuccess('Audio generated and saved.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate audio')
    } finally {
      setLoadingAudio(false)
    }
  }

  const handleGenerateCustomAudio = async () => {
    if (!customScript.trim()) return
    try {
      setError('')
      setSuccess('')
      setCustomAudioLoading(true)

      const res = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCENE_AUDIOS,
        {
          language: ttsLanguage,
          model: ttsModel,
          scenes: [
            {
              id: 1,
              narration: customScript.trim(),
              heading: title.trim() || 'News'
            }
          ],
          tuning: {
            speed: ttsSpeed,
            noiseScale: ttsNoiseScale,
            noiseW: ttsNoiseW,
            sentencePause: ttsSentencePause
          },
          options: {
            normalizeText: ttsNormalizeText,
            splitSentences: ttsSplitSentences
          }
        },
        { timeout: LONG_TIMEOUT_MS }
      )

      const scenes = Array.isArray(res?.data?.data?.scenes) ? res.data.data.scenes : []
      const first = scenes[0] || {}
      const url = String(first?.audioUrl || '').trim()
      if (!url) throw new Error('Audio URL missing')
      const absUrl = toAbsoluteSrc(url)
      setCustomAudioSrc(absUrl)
      setCustomAudioFileName(String(first?.fileName || '').trim())
      setCustomPreviewReady(false)
      if (videoId) {
        const relative = toRelativeAssetUrl(url)
        const updateUrl = ENDURL.NEWS_CONTENT_VIDEOS_UPDATE.replace(':id', videoId)
        await axiosInstance.put(
          updateUrl,
          { audioUrl: relative || url },
          { timeout: LONG_TIMEOUT_MS }
        )
      }

      setSuccess('Final script audio generated and saved.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate custom audio')
    } finally {
      setCustomAudioLoading(false)
    }
  }

  const toRelativeAssetUrl = (url: string) => {
    const raw = String(url || '').trim()
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    if (raw.startsWith(apiBase)) {
      return raw.replace(apiBase, '').replace(/^\/+/, '')
    }
    
return raw.replace(/^\/+/, '')
  }

  const persistClips = async (nextClips: typeof clips) => {
    if (!videoId) return nextClips
    setClipSaving(true)
    try {
      const uploadedClips = await Promise.all(
        nextClips.map(async clip => {
          const images = await Promise.all(
            clip.images.map(async img => {
              const raw = String(img.url || '').trim()
              if (!raw) return img
              const relative = toRelativeAssetUrl(raw)
              if (relative.includes('content/news-content/videos/assets/images/')) {
                return { ...img, url: toAbsoluteSrc(relative) }
              }
              if (relative.startsWith('http://') || relative.startsWith('https://')) {
                const uploadUrl = ENDURL.NEWS_CONTENT_VIDEOS_UPLOAD_IMAGE.replace(':id', videoId)
                const res = await axiosInstance.post(
                  uploadUrl,
                  { sourceUrl: relative, fileName: img.name },
                  { timeout: LONG_TIMEOUT_MS }
                )
                const savedUrl = String(res?.data?.data?.url || '').trim()
                
return { ...img, url: savedUrl ? toAbsoluteSrc(savedUrl) : raw }
              }
              
return img
            })
          )
          
return { ...clip, images }
        })
      )

      const payload = {
        clips: uploadedClips.map(clip => ({
          id: clip.id,
          sentenceIdx: clip.sentenceIdx,
          text: clip.text,
          images: clip.images.map(img => ({ name: img.name, url: toRelativeAssetUrl(img.url) })),
          imageWithText: clip.imageWithText,
          useRandomImages: clip.useRandomImages,
          transition: clip.transition || 'fade',
          approach: clip.approach || 'multi_sentence',
          keyword: clip.keyword || ''
        }))
      }
      const url = ENDURL.NEWS_CONTENT_VIDEOS_UPDATE.replace(':id', videoId)
      await axiosInstance.put(url, payload, { timeout: LONG_TIMEOUT_MS })
      setClips(uploadedClips)
      setSuccess('Clip saved.')
      
return uploadedClips
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save clip')
      
return nextClips
    } finally {
      setClipSaving(false)
    }
  }

  const handleSaveVideo = async () => {
    if (!videoId) return
    try {
      setError('')
      setSuccess('')
      setSaving(true)

      const sourceAudio = customAudioSrc || audioUrl
      let audioUrlToSave = toRelativeAssetUrl(sourceAudio)
      if (sourceAudio && !audioUrlToSave.includes('content/news-content/videos/assets/audio/')) {
        const blob = await fetch(sourceAudio).then(res => res.blob())
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result || ''))
          reader.onerror = () => reject(new Error('Failed to read audio'))
          reader.readAsDataURL(blob)
        })
        const uploadUrl = ENDURL.NEWS_CONTENT_VIDEOS_UPLOAD_AUDIO.replace(':id', videoId)
        const uploadRes = await axiosInstance.post(
          uploadUrl,
          { dataUrl, fileName: customAudioFileName || audioFileName || 'audio.wav' },
          { timeout: LONG_TIMEOUT_MS }
        )
        const savedUrl = String(uploadRes?.data?.data?.url || '').trim()
        if (savedUrl) {
          audioUrlToSave = savedUrl
          setCustomAudioSrc(toAbsoluteSrc(savedUrl))
        }
      }

      const uploadedClips = await Promise.all(
        clips.map(async clip => {
          const images = await Promise.all(
            clip.images.map(async img => {
              const url = String(img.url || '')
              if (url.startsWith('http://') || url.startsWith('https://')) {
                const uploadUrl = ENDURL.NEWS_CONTENT_VIDEOS_UPLOAD_IMAGE.replace(':id', videoId)
                const res = await axiosInstance.post(
                  uploadUrl,
                  { sourceUrl: url, fileName: img.name },
                  { timeout: LONG_TIMEOUT_MS }
                )
                const savedUrl = String(res?.data?.data?.url || '').trim()
                
return { name: img.name, url: savedUrl ? toAbsoluteSrc(savedUrl) : url }
              }
              
return img
            })
          )
          
return { ...clip, images }
        })
      )

      const scriptToSave = customScript.trim() ? customScript.trim() : script.trim()
      const payload = {
        language,
        script: scriptToSave,
        audioUrl: audioUrlToSave,
        sentenceKeywords,
        clipApproach,
        clips: uploadedClips.map(clip => ({
          id: clip.id,
          sentenceIdx: clip.sentenceIdx,
          text: clip.text,
          images: clip.images.map(img => ({ name: img.name, url: toRelativeAssetUrl(img.url) })),
          imageWithText: clip.imageWithText,
          useRandomImages: clip.useRandomImages,
          transition: clip.transition || 'fade',
          approach: clip.approach || 'multi_sentence',
          keyword: clip.keyword || ''
        })),
        status: videoStatus
      }
      const url = ENDURL.NEWS_CONTENT_VIDEOS_UPDATE.replace(':id', videoId)
      await axiosInstance.put(url, payload, { timeout: LONG_TIMEOUT_MS })
      setClips(uploadedClips)
      setSuccess('Video saved.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save video')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadVideo = async (format: 'landscape' | 'short', useGpu = false, testSeconds?: number) => {
    if (!videoId) return
    try {
      setError('')
      setSuccess('')
      setRendering(true)
      setRenderStatus('Starting Remotion render...')

      if (!customAudioSrc.trim()) {
        throw new Error('Please generate audio before rendering.')
      }
      if (!customPreviewReady) {
        throw new Error('Load preview first, then download to keep exact sync.')
      }
      const preparedClips = await persistClips(clips)
      const clipsForRender = preparedClips.filter(clip => (clip.approach || 'multi_sentence') === clipApproach)
      if (!clipsForRender.length) {
        throw new Error('Please create clips for all sentences before rendering.')
      }
      if (usedSentenceIdx.size !== parsedSentences.length) {
        throw new Error('All sentences must be included in exactly one clip before rendering.')
      }

      const renderFps = PREVIEW_FPS
      const durationFrames = Math.max(1, Number(customPreviewDurationFrames || 1))
      const perSentenceSec = Number(customPerSentenceSec || 5)
      const limitedFrames =
        Number(testSeconds || 0) > 0
          ? Math.max(1, Math.min(durationFrames, Math.round(Number(testSeconds) * renderFps)))
          : durationFrames
      const renderFrameEnd = Number(testSeconds || 0) > 0 ? Math.max(0, limitedFrames - 1) : undefined

      const url = ENDURL.NEWS_CONTENT_VIDEOS_GENERATE_REMOTION_PREVIEW
      const previewProps = {
        title: 'R4D News',
        script: customScript.trim() ? customScript.trim() : script.trim(),
        audioUrl: customAudioSrc || audioUrl,
        stylePreset: 'data',
        clips: clipsForRender.map(clip => ({
          ...clip,
          images: Array.isArray(clip.images)
            ? clip.images.map(img => ({
                ...img,
                url: toRelativeAssetUrl(img.url)
              }))
            : []
        })),
        sentences: parsedSentences,
        sentenceFrames: previewSentenceFrames,
        perSentenceSec,
        showBackgroundVideo,
        transitionMode,
        inheritClipTransitions,
        transitionSet,
        imagesPerTransition,
        secondsPerTransition,
        minTransitionDurationSec,
        skipShortTransitions,
        shortTransitionFallback,
        mediaOverlays: mediaOverlays.map(item => ({
          type: item.type,
          url: item.url,
          position: item.position,
          size: item.size,
          startSec: item.startSec,
          endSec: item.endSec,
          animation: item.animation,
          scheduleMode: item.scheduleMode,
          repeat: item.repeat,
          repeatEverySec: item.repeatEverySec,
          timelineStarts: item.timelineStarts,
          randomCount: item.randomCount,
          randomDurationSec: item.randomDurationSec,
          label: item.label || ''
        })),
        timeline: previewTimelineForRender
      }
      const res = await axiosInstance.post(
        url,
        {
          videoId: Number(videoId),
          format,
          resolution: '1080p',
          durationInFrames: durationFrames,
          renderFrameEnd,
          qualityMode: useGpu ? 'gpu' : 'high',
          useGpu,
          previewProps
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const jobId = String(res?.data?.data?.jobId || '')
      const fileName = String(res?.data?.data?.fileName || '')
      if (!jobId || !fileName) throw new Error('Render job not created')
      setRenderJobId(jobId)
      setVideoStatus('rendering')

      const statusUrl = ENDURL.NEWS_CONTENT_VIDEOS_RENDER_STATUS_REMOTION_PREVIEW.replace(':id', videoId).replace(
        ':jobId',
        jobId
      )
      const estimatedRenderSeconds = Math.max(0, Number(res?.data?.data?.estimatedRenderSeconds || 0))
      const maxPollCount = Math.max(120, Math.ceil((Math.max(estimatedRenderSeconds, 600) + 60) / 3))
      let completed = false
      for (let i = 0; i < maxPollCount; i += 1) {
        const statusRes = await axiosInstance.get(statusUrl, { timeout: LONG_TIMEOUT_MS })
        const job = statusRes?.data?.data || statusRes?.data?.job || statusRes?.data
        const state = String(job?.status || '')
        const progress = Number(job?.progress || 0)
        setRenderStatus(`${state} (${progress}%)`)
        if (state === 'completed') {
          completed = true
          break
        }
        if (state === 'failed') throw new Error(job?.error || 'Render failed')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      if (!completed) throw new Error('Render timed out')

      const downloadUrl = ENDURL.NEWS_CONTENT_VIDEOS_RENDERED.replace(':fileName', fileName)
      const resolvedUrl = downloadUrl.startsWith('http') ? downloadUrl : `${apiBase}/${downloadUrl}`
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer')

      setSuccess(
        Number(testSeconds || 0) > 0 ? `Test video (${testSeconds}s) ready for download.` : 'Video ready for download.'
      )
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to render video')
    } finally {
      setRendering(false)
      setRenderStatus('')
    }
  }





  const handleGenerateFfmpegVideo = async (format: 'landscape' | 'short', testSeconds?: number) => {
    if (!videoId) return
    try {
      setError('')
      setSuccess('')
      setRendering(true)
      setRenderStatus('Starting FFmpeg video render...')

      const renderFps = PREVIEW_FPS
      const preparedClips = await persistClips(clips)
      const clipsForRender = preparedClips.filter(clip => (clip.approach || 'multi_sentence') === clipApproach)
      const scriptSource = customScript.trim() ? customScript.trim() : script.trim()
      const sentences = splitScriptToSentences(scriptSource)
      const durationSec = customAudioSrc ? await getAudioDuration(customAudioSrc) : 0
      if (!durationSec) throw new Error('Audio duration not available')
      const timeline = buildPreviewTimeline({
        scriptSource,
        sentences,
        durationSec,
        fps: renderFps,
        clips: clipsForRender,
        titleLabel: 'R4D News'
      })
      const limitSec = Number(testSeconds || 0) > 0 ? Math.max(1, Number(testSeconds)) : 0
      const limitedTimeline =
        limitSec > 0
          ? (() => {
              let acc = 0
              const limitedSegments: typeof timeline.segments = []
              timeline.segments.forEach(segment => {
                if (acc >= limitSec) return
                const remaining = limitSec - acc
                const dur = Math.max(0, Number(segment?.durationSec || 0))
                if (dur <= 0) return
                const nextDur = Math.min(dur, remaining)
                if (nextDur <= 0) return
                limitedSegments.push({
                  ...segment,
                  durationSec: nextDur
                })
                acc += nextDur
              })
              const limitedOverlays = (Array.isArray(timeline.overlays) ? timeline.overlays : [])
                .map(overlay => ({
                  ...overlay,
                  startSec: Math.max(0, Math.min(limitSec, Number(overlay.startSec || 0))),
                  endSec: Math.max(0, Math.min(limitSec, Number(overlay.endSec || 0)))
                }))
                .filter(overlay => overlay.endSec > overlay.startSec)
              
return {
                ...timeline,
                segments: limitedSegments,
                overlays: limitedOverlays,
                totalFrames: Math.max(1, Math.round(limitSec * renderFps))
              }
            })()
          : timeline
      const url = ENDURL.NEWS_CONTENT_VIDEOS_GENERATE_FFMPEG
      const res = await axiosInstance.post(
        url,
        {
          videoId: Number(videoId),
          format,
          resolution: '1080p',
          fps: renderFps,
          qualityMode: 'high',
          audioUrl: customAudioSrc || audioUrl,
          timeline: limitedTimeline,
          mediaOverlays: mediaOverlays.map(item => ({
            type: item.type,
            url: item.url,
            position: item.position,
            size: item.size,
            startSec: limitSec > 0 ? Math.max(0, Math.min(limitSec, Number(item.startSec || 0))) : item.startSec,
            endSec: limitSec > 0 ? Math.max(0, Math.min(limitSec, Number(item.endSec || 0))) : item.endSec,
            animation: item.animation,
            scheduleMode: item.scheduleMode,
            repeat: item.repeat,
            repeatEverySec: item.repeatEverySec,
            timelineStarts: item.timelineStarts,
            randomCount: item.randomCount,
            randomDurationSec: item.randomDurationSec,
            label: item.label || ''
          }))
        },
        { timeout: LONG_TIMEOUT_MS }
      )

      const jobId = String(res?.data?.data?.jobId || '')
      const fileName = String(res?.data?.data?.fileName || '')
      if (!jobId || !fileName) throw new Error('FFmpeg render job not created')
      setRenderJobId(jobId)
      setVideoStatus('rendering')

      const statusUrl = ENDURL.NEWS_CONTENT_VIDEOS_RENDER_STATUS_FFMPEG.replace(':id', videoId).replace(':jobId', jobId)
      let completed = false
      for (let i = 0; i < 120; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const statusRes = await axiosInstance.get(statusUrl)
        const state = String(statusRes?.data?.data?.status || '')
        if (state === 'completed') {
          completed = true
          break
        }
        if (state === 'failed') {
          throw new Error(statusRes?.data?.data?.error || 'FFmpeg render failed')
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
      if (!completed) throw new Error('Render timed out')

      const apiBase = String(process.env.NEXT_PUBLIC_API_BASE_URL || '').trim()
      const downloadUrl = ENDURL.NEWS_CONTENT_VIDEOS_RENDERED.replace(':fileName', fileName)
      const resolvedUrl = downloadUrl.startsWith('http') ? downloadUrl : `${apiBase}/${downloadUrl}`
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer')

      setSuccess(limitSec > 0 ? `FFmpeg test video (${limitSec}s) ready for download.` : 'FFmpeg video ready for download.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate FFmpeg video')
    } finally {
      setRendering(false)
    }
  }

  const handleConvertGeneratedScriptToHindi = async () => {
    const sourceScript = String(script || '').trim()
    if (!sourceScript) return
    try {
      setError('')
      setSuccess('')
      setLoadingHindiScript(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONVERT_SCRIPT_HINDI,
        {
          topic: title.trim(),
          script: sourceScript,
          model: model.trim() || undefined
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const data = res?.data?.data || {}
      const hindiScript = String(data?.hindiScript || '').trim()
      if (!hindiScript) throw new Error('Hindi script was not generated')
      setCustomScript(hindiScript)
      setLanguage('hindi')
      setSuccess('Hindi script generated and copied to Final Script For Video.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate Hindi script')
    } finally {
      setLoadingHindiScript(false)
    }
  }

  const handleConvertGeneratedScriptToHindiGemini = async () => {
    const sourceScript = String(script || '').trim()
    if (!sourceScript) return
    try {
      setError('')
      setSuccess('')
      setLoadingHindiScriptGemini(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONVERT_SCRIPT_HINDI_GEMINI,
        {
          topic: title.trim(),
          script: sourceScript
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const data = res?.data?.data || {}
      const hindiScript = String(data?.hindiScript || '').trim()
      if (!hindiScript) throw new Error('Hindi script was not generated by Gemini')
      setCustomScript(hindiScript)
      setScript(sourceScript)
      setLanguage('hindi')
      setSuccess('Hindi script (Gemini) generated and copied to Final Script For Video.')
    } catch (err: any) {
      const partialScript = String(err?.response?.data?.data?.hindiScript || '').trim()
      if (partialScript) {
        setCustomScript(partialScript)
        setScript(sourceScript)
        setLanguage('hindi')
      }
      setError(err?.response?.data?.message || err?.message || 'Failed to generate Hindi script with Gemini')
    } finally {
      setLoadingHindiScriptGemini(false)
    }
  }

  const handleGenerateRemotionPreviewVideo = async (format: 'landscape' | 'short', testSeconds?: number) => {
    if (!videoId) return
    try {
      setError('')
      setSuccess('')
      setRendering(true)
      setRenderStatus('Starting Remotion preview render...')

      if (!customPreviewReady) {
        throw new Error('Load preview first.')
      }
      if (!customAudioSrc.trim()) {
        throw new Error('Please generate audio before rendering.')
      }

      const preparedClips = await persistClips(clips)
      const clipsForRender = preparedClips.filter(clip => (clip.approach || 'multi_sentence') === clipApproach)
      const durationFrames = Math.max(1, Number(customPreviewDurationFrames || 1))
      const renderFps = PREVIEW_FPS
      const limitedFrames =
        Number(testSeconds || 0) > 0
          ? Math.max(1, Math.min(durationFrames, Math.round(Number(testSeconds) * renderFps)))
          : durationFrames
      const renderFrameEnd = Number(testSeconds || 0) > 0 ? Math.max(0, limitedFrames - 1) : undefined

      const url = ENDURL.NEWS_CONTENT_VIDEOS_GENERATE_REMOTION_PREVIEW
      const previewProps = {
        title: 'R4D News',
        script: customScript.trim(),
        audioUrl: customAudioSrc,
        stylePreset: 'data',
        clips: clipsForRender,
        sentences: parsedSentences,
        sentenceFrames: previewSentenceFrames,
        perSentenceSec: customPerSentenceSec,
        showBackgroundVideo,
        transitionMode,
        inheritClipTransitions,
        transitionSet,
        imagesPerTransition,
        secondsPerTransition,
        minTransitionDurationSec,
        skipShortTransitions,
        shortTransitionFallback,
        mediaOverlays,
        timeline: previewTimelineForRender
      }
      const res = await axiosInstance.post(
        url,
        {
          videoId: Number(videoId),
          format,
          resolution: '1080p',
          durationInFrames: durationFrames,
          renderFrameEnd,
          qualityMode: 'high',
          useGpu: false,
          previewProps
        },
        { timeout: LONG_TIMEOUT_MS }
      )

      const jobId = String(res?.data?.data?.jobId || '')
      const fileName = String(res?.data?.data?.fileName || '')
      if (!jobId || !fileName) throw new Error('Remotion preview render job not created')

      setRenderJobId(jobId)
      setVideoStatus('rendering')

      const statusUrl = ENDURL.NEWS_CONTENT_VIDEOS_RENDER_STATUS_REMOTION_PREVIEW.replace(':id', videoId).replace(':jobId', jobId)
      const estimatedRenderSeconds = Math.max(0, Number(res?.data?.data?.estimatedRenderSeconds || 0))
      const maxPollCount = Math.max(120, Math.ceil((Math.max(estimatedRenderSeconds, 600) + 60) / 3))
      let completed = false
      for (let i = 0; i < maxPollCount; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const statusRes = await axiosInstance.get(statusUrl, { timeout: LONG_TIMEOUT_MS })
        const job = statusRes?.data?.data || {}
        const state = String(job?.status || '')
        const progress = Number(job?.progress || 0)
        setRenderStatus(`${state} (${progress}%)`)
        if (state === 'completed') {
          completed = true
          break
        }
        if (state === 'failed') {
          throw new Error(job?.error || 'Remotion preview render failed')
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      if (!completed) throw new Error('Render timed out')

      const apiBase = String(process.env.NEXT_PUBLIC_API_BASE_URL || '').trim()
      const downloadUrl = ENDURL.NEWS_CONTENT_VIDEOS_RENDERED.replace(':fileName', fileName)
      const resolvedUrl = downloadUrl.startsWith('http') ? downloadUrl : `${apiBase}/${downloadUrl}`
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer')
      setSuccess(Number(testSeconds || 0) > 0 ? `Remotion test video (${testSeconds}s) ready.` : 'Remotion video ready for download.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate Remotion preview video')
    } finally {
      setRendering(false)
    }
  }

  const handleDownloadLandscapeFastGpu = async () => {
    if (!videoId) return
    try {
      setError('')
      setSuccess('')
      setRendering(true)
      setRenderStatus('Creating fast GPU render job...')

      if (generatorFormatTab !== 'landscape') {
        throw new Error('Fast GPU download is available for landscape only.')
      }
      if (!customPreviewReady) {
        throw new Error('Load preview first.')
      }
      if (!customAudioSrc.trim()) {
        throw new Error('Please generate audio before rendering.')
      }

      const preparedClips = await persistClips(clips)
      const clipsForRender = preparedClips.filter(clip => (clip.approach || 'multi_sentence') === clipApproach)
      const durationFrames = Math.max(1, Number(customPreviewDurationFrames || 1))
      const previewProps = {
        title: title.trim() || 'R4D News',
        script: customScript.trim(),
        audioUrl: customAudioSrc,
        stylePreset: 'data',
        clips: clipsForRender,
        sentences: parsedSentences,
        sentenceFrames: previewSentenceFrames,
        perSentenceSec: customPerSentenceSec,
        showBackgroundVideo,
        transitionMode,
        inheritClipTransitions,
        transitionSet,
        imagesPerTransition,
        secondsPerTransition,
        minTransitionDurationSec,
        skipShortTransitions,
        shortTransitionFallback,
        mediaOverlays,
        timeline: previewTimelineForRender
      }

      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_VIDEOS_FAST_GPU_CREATE,
        {
          videoId: Number(videoId),
          format: 'landscape',
          resolution: '1080p',
          durationInFrames: durationFrames,
          qualityMode: 'gpu',
          previewProps
        },
        { timeout: LONG_TIMEOUT_MS }
      )

      const jobId = String(res?.data?.data?.jobId || '')
      if (!jobId) throw new Error('Fast GPU render job not created')

      setRenderJobId(jobId)
      setVideoStatus('rendering')
      setSuccess('Fast GPU render job created. Redirecting to progress page...')
      router.push(`/news-content/render-jobs?jobId=${encodeURIComponent(jobId)}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create fast GPU render job')
    } finally {
      setRendering(false)
    }
  }

  const handleStopQuickRecord = () => {
    if (quickRecorderTimeoutRef.current) {
      window.clearTimeout(quickRecorderTimeoutRef.current)
      quickRecorderTimeoutRef.current = null
    }
    const recorder = quickRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      setQuickRecording(false)
    }
    previewPlayerRef.current?.pause?.()
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
    }
  }

  const handleStartQuickRecord = async () => {
    if (!customPreviewReady) {
      setError('Prepare preview first.')
      
return
    }
    try {
      setError('')
      setSuccess('')
      const getCaptureStream = (): MediaStream | null => {
        const previewNode = previewContainerRef.current
        if (!previewNode) return null

        const canvas = previewNode.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas && typeof canvas.captureStream === 'function') {
          return canvas.captureStream(PREVIEW_FPS)
        }

        const playerVideo = previewNode.querySelector('.remotion-player video') as HTMLVideoElement | null
        if (playerVideo && typeof (playerVideo as any).captureStream === 'function') {
          return (playerVideo as any).captureStream()
        }

        const iframe = previewNode.querySelector('iframe') as HTMLIFrameElement | null
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document
        if (iframeDoc) {
          const iframeCanvas = iframeDoc.querySelector('canvas') as HTMLCanvasElement | null
          if (iframeCanvas && typeof iframeCanvas.captureStream === 'function') {
            return iframeCanvas.captureStream(PREVIEW_FPS)
          }
          const iframeVideo = iframeDoc.querySelector('video') as HTMLVideoElement | null
          if (iframeVideo && typeof (iframeVideo as any).captureStream === 'function') {
            return (iframeVideo as any).captureStream()
          }
        }

        return null
      }

      const waitForCaptureStream = async () => {
        const timeoutAt = Date.now() + 3000
        let stream = getCaptureStream()
        while (!stream && Date.now() < timeoutAt) {
          // wait for Player surface to mount
          // eslint-disable-next-line no-await-in-loop
          await new Promise(resolve => window.setTimeout(resolve, 120))
          stream = getCaptureStream()
        }
        
return stream
      }

      let videoStream = await waitForCaptureStream()
      let fallbackAudioTracks: MediaStreamTrack[] = []
      if (!videoStream) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: PREVIEW_FPS
          },
          audio: true
        })
        const displayVideoTrack = displayStream.getVideoTracks()[0]

        // Region Capture (Chrome): crop tab capture to preview container only.
        const cropTargetApi = (window as any).CropTarget
        const canCropTo = displayVideoTrack && typeof (displayVideoTrack as any).cropTo === 'function'
        if (cropTargetApi?.fromElement && canCropTo && previewContainerRef.current) {
          try {
            const target = await cropTargetApi.fromElement(previewContainerRef.current)
            await (displayVideoTrack as any).cropTo(target)
          } catch (_) {
            // If crop fails, keep full tab capture as fallback.
          }
        }
        videoStream = new MediaStream(displayVideoTrack ? [displayVideoTrack] : [])
        fallbackAudioTracks = displayStream.getAudioTracks()
      }
      const mergedStream = new MediaStream()
      videoStream.getVideoTracks().forEach(track => mergedStream.addTrack(track))

      const audioElement = previewAudioRef.current
      const captureStreamFn = audioElement && (audioElement as any).captureStream
      if (audioElement && typeof captureStreamFn === 'function') {
        const audioStream = captureStreamFn.call(audioElement) as MediaStream
        audioStream.getAudioTracks().forEach(track => mergedStream.addTrack(track))
      } else if (fallbackAudioTracks.length) {
        fallbackAudioTracks.forEach(track => mergedStream.addTrack(track))
      }

      const mimeCandidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      const mimeType = mimeCandidates.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm'
      const targetVideoBps = customPreviewLayout === 'short' ? 12_000_000 : 16_000_000
      const targetAudioBps = 192_000
      let recorder: MediaRecorder | null = null
      const recorderOptions = [
        { mimeType, videoBitsPerSecond: targetVideoBps, audioBitsPerSecond: targetAudioBps },
        { mimeType, videoBitsPerSecond: targetVideoBps },
        { mimeType }
      ]
      for (const options of recorderOptions) {
        try {
          recorder = new MediaRecorder(mergedStream, options as MediaRecorderOptions)
          break
        } catch (_) {
          recorder = null
        }
      }
      if (!recorder) {
        throw new Error('MediaRecorder is not supported with current browser settings')
      }
      quickRecorderChunksRef.current = []
      quickRecorderRef.current = recorder

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          quickRecorderChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        setQuickRecording(false)
        mergedStream.getTracks().forEach(track => track.stop())
        const chunks = quickRecorderChunksRef.current
        if (!chunks.length) return
        const blob = new Blob(chunks, { type: mimeType })
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `preview-recording-${customPreviewLayout}-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(blobUrl)
        setSuccess('Quick HD recording downloaded.')
      }

      previewPlayerRef.current?.seekTo?.(0)
      previewPlayerRef.current?.play?.()
      if (audioElement) {
        audioElement.currentTime = 0
        await audioElement.play().catch(() => {})
      }

      recorder.start(250)
      setQuickRecording(true)
      const durationMs = Math.ceil((customPreviewDurationFrames / PREVIEW_FPS) * 1000) + 300
      quickRecorderTimeoutRef.current = window.setTimeout(() => {
        handleStopQuickRecord()
      }, durationMs)
    } catch (err: any) {
      setQuickRecording(false)
      setError(err?.message || 'Failed to start quick recording')
    }
  }



  const handleSearchImages = async (providerOverride?: 'all' | 'unsplash' | 'pexels' | 'pixabay') => {
    if (!imageQuery.trim()) return
    const providerToUse = providerOverride || imageProvider
    try {
      setImageLoading(true)
      const res = await axiosInstance.get(ENDURL.NEWS_CONTENT_IMAGE_SEARCH, {
        params: { query: imageQuery.trim(), provider: providerToUse, perPage: 18 },
        timeout: LONG_TIMEOUT_MS
      })
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setImageResults(
        data.map((item: any) => ({
          id: String(item?.id || ''),
          provider: String(item?.provider || ''),
          thumbUrl: String(item?.thumbUrl || ''),
          fullUrl: String(item?.fullUrl || '')
        }))
      )
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to search images')
    } finally {
      setImageLoading(false)
    }
  }

  const handleAddResultImage = (image: { id: string; provider: string; fullUrl: string }) => {
    if (!image.fullUrl) return
    setImageGallery(prev => {
      const exists = prev.some(item => item.url === image.fullUrl)
      if (exists) return prev
      
return [...prev, { name: `${image.provider}-${image.id}`, url: image.fullUrl }]
    })
  }

  const handleUseResultImage = (image: { id: string; provider: string; fullUrl: string }) => {
    if (!image.fullUrl) return
    setImageGallery(prev => {
      const exists = prev.some(item => item.url === image.fullUrl)
      if (exists) return prev
      
return [...prev, { name: `${image.provider}-${image.id}`, url: image.fullUrl }]
    })
    setClipImages(prev => {
      if (prev.some(item => item.url === image.fullUrl)) return prev
      
return [...prev, { name: `${image.provider}-${image.id}`, url: image.fullUrl }]
    })
  }

  const handleRefineImageQuery = async () => {
    const sentence = String(imageQuery || '').trim()
    if (!sentence) return
    try {
      setRefineLoading(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_VIDEOS_KEYWORD,
        { sentence },
        { timeout: LONG_TIMEOUT_MS }
      )
      const keyword = String(res?.data?.data?.keyword || '').trim()
      if (keyword) setImageQuery(keyword)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to refine search phrase')
    } finally {
      setRefineLoading(false)
    }
  }

  const handleRemoveClipImage = (idx: number) => {
    setClipImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleAddGalleryToClip = (image: { name: string; url: string }) => {
    if (!image?.url) return
    setClipImages(prev => {
      if (prev.some(item => item.url === image.url)) return prev
      
return [...prev, image]
    })
  }

  const handleReorderClipImages = (from: number, to: number) => {
    setClipImages(prev => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
      const next = prev.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      
return next
    })
  }

  const handleGenerateKeyword = async (idx: number) => {
    const sentence = String(parsedSentences[idx] || '').trim()
    if (!sentence) return
    try {
      setKeywordLoading(prev => ({ ...prev, [idx]: true }))
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_VIDEOS_KEYWORD,
        { sentence },
        { timeout: LONG_TIMEOUT_MS }
      )
      const keyword = String(res?.data?.data?.keyword || '').trim()
      if (keyword) {
        setSentenceKeywords(prev => ({ ...prev, [idx]: keyword }))
        if (clipSelectedIdx.length === 1 && clipSelectedIdx[0] === idx) {
          setImageQuery(keyword)
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate keyword')
    } finally {
      setKeywordLoading(prev => ({ ...prev, [idx]: false }))
    }
  }

  const handleGenerateAllKeywords = async () => {
    if (!parsedSentences.length) return
    const targets = parsedSentences
      .map((_, idx) => idx)
      .filter(idx => !sentenceKeywords[idx] && !keywordLoading[idx])
    if (!targets.length) return
    setKeywordLoading(prev => {
      const next = { ...prev }
      targets.forEach(idx => {
        next[idx] = true
      })
      
return next
    })
    await Promise.all(
      targets.map(async idx => {
        const sentence = String(parsedSentences[idx] || '').trim()
        if (!sentence) return
        try {
          const res = await axiosInstance.post(
            ENDURL.NEWS_CONTENT_VIDEOS_KEYWORD,
            { sentence },
            { timeout: LONG_TIMEOUT_MS }
          )
          const keyword = String(res?.data?.data?.keyword || '').trim()
          if (keyword) {
            setSentenceKeywords(prev => ({ ...prev, [idx]: keyword }))
          }
        } catch (_) {
          // ignore per-item error
        } finally {
          setKeywordLoading(prev => ({ ...prev, [idx]: false }))
        }
      })
    )
  }

  const handleGenerateAllClipKeywords = async () => {
    if (clipApproach !== 'multi_sentence' || !activeClips.length) return

    const targets = activeClips.filter(clip => !String(clip.keyword || '').trim() && String(clip.text || '').trim())
    if (!targets.length) {
      setSuccess('All multi-sentence clips already have keywords.')
      
return
    }

    try {
      setError('')
      setSuccess('')
      setClipKeywordBatchLoading(true)

      const keywordByClipId: Record<number, string> = {}

      await Promise.all(
        targets.map(async clip => {
          const sentence = String(clip.text || '').trim()
          if (!sentence) return
          const res = await axiosInstance.post(
            ENDURL.NEWS_CONTENT_VIDEOS_KEYWORD,
            { sentence },
            { timeout: LONG_TIMEOUT_MS }
          )
          const keyword = String(res?.data?.data?.keyword || '').trim()
          if (keyword) {
            keywordByClipId[clip.id] = keyword
          }
        })
      )

      const nextClips = clips.map(clip => {
        if ((clip.approach || 'multi_sentence') !== 'multi_sentence') return clip
        const keyword = keywordByClipId[clip.id]
        
return keyword ? { ...clip, keyword } : clip
      })

      const persisted = await persistClips(nextClips)
      setClips(persisted)
      setSuccess('Keywords generated for multi-sentence clips.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate clip keywords')
    } finally {
      setClipKeywordBatchLoading(false)
    }
  }

  const handlePrepareCustomPreview = async (layout: 'landscape' | 'short') => {
    if (!customScript.trim() || !customAudioSrc.trim()) return
    try {
      setError('')
      setSuccess('')
      const { durationFrames, perSentenceSec } = await resolveRenderTiming(PREVIEW_FPS)
      setCustomPerSentenceSec(perSentenceSec)
      setCustomPreviewDurationFrames(durationFrames)
      setCustomPreviewReady(true)
      setCustomPreviewLayout(layout)
      setSuccess(layout === 'short' ? 'Short preview is ready.' : 'Landscape preview is ready.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to prepare preview')
    }
  }

  const resolveRenderTiming = async (fps: number) => {
    const durationSec = customAudioSrc ? await getAudioDuration(customAudioSrc) : 0
    const perSentenceSec =
      parsedSentences.length > 0 && durationSec > 0 ? durationSec / parsedSentences.length : customPerSentenceSec
    const durationFrames =
      durationSec > 0 ? Math.max(fps * 6, Math.round(durationSec * fps)) : customPreviewDurationFrames
    if (durationSec > 0) {
      setCustomPerSentenceSec(perSentenceSec)
      setCustomPreviewDurationFrames(durationFrames)
    }
    
return { durationFrames, perSentenceSec }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          News Content
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
                <Typography variant='h6'>Script Generator</Typography>
                <Button variant='outlined' onClick={() => setScriptPanelCollapsed(prev => !prev)}>
                  {scriptPanelCollapsed ? 'Expand' : 'Collapse'}
                </Button>
              </Stack>
              <Collapse in={!scriptPanelCollapsed}>
              <TextField label='Title' value={title} onChange={e => setTitle(e.target.value)} fullWidth />
              <TextField
                label='Content'
                value={content}
                onChange={e => setContent(e.target.value)}
                fullWidth
                multiline
                minRows={8}
              />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label='Model' value={model} onChange={e => setModel(e.target.value)} sx={{ minWidth: 240 }} />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label='Target Duration (sec)'
                  type='number'
                  value={targetDurationSec}
                  onChange={e => setTargetDurationSec(Number(e.target.value || 0))}
                  inputProps={{ min: 20, max: 900 }}
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  label='Script Min Words'
                  type='number'
                  value={scriptWordsMin}
                  onChange={e => setScriptWordsMin(Number(e.target.value || 0))}
                  inputProps={{ min: 30, max: 8000 }}
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  label='Script Max Words'
                  type='number'
                  value={scriptWordsMax}
                  onChange={e => setScriptWordsMax(Number(e.target.value || 0))}
                  inputProps={{ min: 30, max: 8000 }}
                  sx={{ minWidth: 200 }}
                />
              </Stack>

              <Stack
                direction='row'
                spacing={2}
                alignItems='center'
                sx={{ flexWrap: 'wrap', rowGap: 2 }}
              >
                <Button variant='contained' onClick={handleGenerateScript} disabled={loadingScript || !title.trim()}>
                  {loadingScript ? 'Generating...' : 'Generate Script'}
                </Button>
                <TextField
                  select
                  label='Language'
                  value={language}
                  onChange={e => setLanguage(e.target.value as 'english' | 'hindi')}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value='english'>English</MenuItem>
                  <MenuItem value='hindi'>Hindi</MenuItem>
                </TextField>
                <Button variant='outlined' onClick={handleGenerateAudio} disabled={loadingAudio || !script.trim()}>
                  {loadingAudio ? 'Generating Audio...' : 'Generate Audio'}
                </Button>
                <Button
                  variant='outlined'
                  color='secondary'
                  onClick={handleConvertGeneratedScriptToHindi}
                  disabled={loadingHindiScript || !script.trim()}
                >
                  {loadingHindiScript ? 'Converting...' : 'Generate Hindi Script'}
                </Button>
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={handleConvertGeneratedScriptToHindiGemini}
                  disabled={loadingHindiScriptGemini || !script.trim()}
                >
                  {loadingHindiScriptGemini ? 'Converting (Gemini)...' : 'Generate Hindi (Gemini)'}
                </Button>
              </Stack>

              <Divider />

              <TextField
                label='Generated Script'
                value={script}
                onChange={e => setScript(e.target.value)}
                fullWidth
                multiline
                minRows={10}
              />

              {audioUrl ? (
                <Stack spacing={1}>
                  <Typography variant='body2' color='text.secondary'>
                    Audio: {audioFileName || 'generated'}
                  </Typography>
                  <audio controls src={audioUrl} />
                </Stack>
              ) : null}
              </Collapse>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>Video Generator</Typography>
              <Tabs
                value={generatorFormatTab}
                onChange={(_e, value) => setGeneratorFormatTab(value)}
                textColor='primary'
                indicatorColor='primary'
              >
                <Tab label='Landscape Generator' value='landscape' />
                <Tab label='Shorts Generator' value='short' />
              </Tabs>
              <Tabs
                value={activeSectionTab}
                onChange={handleSectionTabChange}
                textColor='primary'
                indicatorColor='primary'
                variant='scrollable'
                allowScrollButtonsMobile
              >
                {generatorSections.map((label, idx) => (
                  <Tab key={`section-${label}`} label={label} value={idx} />
                ))}
              </Tabs>
              {activeSectionTab === 0 ? (
                <TextField
                  label='Final Script For Video'
                  value={customScript}
                  onChange={e => setCustomScript(e.target.value)}
                  fullWidth
                  multiline
                  minRows={6}
                  maxRows={10}
                />
              ) : null}
              {activeSectionTab === 1 ? (
                <>
                  <Stack spacing={1.5}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      TTS Tuning
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <TextField
                        label='Speed'
                        type='number'
                        value={ttsSpeed}
                        onChange={e => setTtsSpeed(Number(e.target.value || 0))}
                        inputProps={{ min: 0.75, max: 1.35, step: 0.05 }}
                        sx={{ maxWidth: 160 }}
                      />
                      <TextField
                        label='Noise Scale'
                        type='number'
                        value={ttsNoiseScale}
                        onChange={e => setTtsNoiseScale(Number(e.target.value || 0))}
                        inputProps={{ min: 0.1, max: 1.3, step: 0.05 }}
                        sx={{ maxWidth: 160 }}
                      />
                      <TextField
                        label='Noise W'
                        type='number'
                        value={ttsNoiseW}
                        onChange={e => setTtsNoiseW(Number(e.target.value || 0))}
                        inputProps={{ min: 0.1, max: 1.3, step: 0.05 }}
                        sx={{ maxWidth: 160 }}
                      />
                      <TextField
                        label='Sentence Pause'
                        type='number'
                        value={ttsSentencePause}
                        onChange={e => setTtsSentencePause(Number(e.target.value || 0))}
                        inputProps={{ min: 0, max: 1.2, step: 0.05 }}
                        sx={{ maxWidth: 180 }}
                      />
                    </Stack>
                    <Stack direction='row' spacing={2}>
                      <FormControlLabel
                        control={<Checkbox checked={ttsNormalizeText} onChange={e => setTtsNormalizeText(e.target.checked)} />}
                        label='Normalize Text'
                      />
                      <FormControlLabel
                        control={<Checkbox checked={ttsSplitSentences} onChange={e => setTtsSplitSentences(e.target.checked)} />}
                        label='Split Sentences'
                      />
                    </Stack>
                  </Stack>
                  <Stack direction='row' spacing={2} alignItems='center'>
                    <TextField
                      select
                      label='Audio Language'
                      value={language}
                      onChange={e => setLanguage(e.target.value as 'english' | 'hindi')}
                      sx={{ maxWidth: 220 }}
                    >
                      <MenuItem value='english'>English</MenuItem>
                      <MenuItem value='hindi'>Hindi</MenuItem>
                    </TextField>
                    <Button
                      variant='contained'
                      onClick={handleGenerateCustomAudio}
                      disabled={customAudioLoading || !customScript.trim()}
                    >
                      {customAudioLoading ? 'Generating Audio...' : 'Generate Audio'}
                    </Button>
                  </Stack>
                </>
              ) : null}
              {activeSectionTab === 5 ? (
                <Stack
                  direction='row'
                  spacing={2}
                  sx={{ flexWrap: 'wrap', rowGap: 2 }}
                >
                  <TextField
                    label='Test Duration (sec)'
                    type='number'
                    value={testRenderSeconds}
                    onChange={e => setTestRenderSeconds(Math.max(1, Number(e.target.value || 1)))}
                    inputProps={{ min: 1, max: 120 }}
                    sx={{ width: 180 }}
                  />
                  <Button
                    variant='outlined'
                    onClick={() => handlePrepareCustomPreview(generatorFormatTab)}
                    disabled={!customScript.trim() || !customAudioSrc.trim()}
                  >
                    Preview {generatorFormatTab === 'short' ? 'Short' : 'Landscape'}
                  </Button>
                  <Button
                    variant='contained'
                    onClick={() => handleDownloadVideo(generatorFormatTab)}
                    disabled={rendering || !customAudioSrc.trim()}
                  >
                    {rendering
                      ? 'Rendering...'
                      : `Download ${generatorFormatTab === 'short' ? 'Short' : 'Landscape'}`}
                  </Button>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={() => handleGenerateFfmpegVideo(generatorFormatTab)}
                    disabled={rendering}
                  >
                    {rendering ? 'Rendering...' : 'Generate FFMPEG Video'}
                  </Button>
                  <Button
                    variant='outlined'
                    color='secondary'
                    onClick={() => handleDownloadVideo(generatorFormatTab, false, testRenderSeconds)}
                    disabled={rendering || !customAudioSrc.trim()}
                  >
                    {`Test Remotion (${testRenderSeconds}s)`}
                  </Button>
                  <Button
                    variant='contained'
                    color='secondary'
                    onClick={() => handleGenerateRemotionPreviewVideo(generatorFormatTab)}
                    disabled={rendering || !customAudioSrc.trim()}
                  >
                    {rendering ? 'Rendering...' : 'Generate Remotion Video'}
                  </Button>
                  <Button
                    variant='contained'
                    color='success'
                    onClick={handleDownloadLandscapeFastGpu}
                    disabled={rendering || !customAudioSrc.trim() || generatorFormatTab !== 'landscape'}
                  >
                    {rendering ? 'Starting...' : 'Download Landscape Fast (GPU)'}
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => router.push('/news-content/render-jobs')}
                  >
                    View Fast Render Jobs
                  </Button>
                  <Button
                    variant={quickRecording ? 'contained' : 'outlined'}
                    color={quickRecording ? 'error' : 'secondary'}
                    onClick={quickRecording ? handleStopQuickRecord : handleStartQuickRecord}
                    disabled={!customPreviewReady || !customAudioSrc.trim()}
                  >
                    {quickRecording ? 'Stop Recording' : 'Record Preview HD (Beta)'}
                  </Button>
                </Stack>
              ) : null}
              {activeSectionTab === 2 ? (
                <Stack spacing={1.5}>
                  <Stack direction='row' spacing={2} alignItems='center'>
                    <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                      Clip Builder
                    </Typography>
                    {clipApproach === 'multi_sentence' ? (
                      <>
                        <Button variant='outlined' onClick={handleOpenClipModal} disabled={!canOpenClipModal}>
                          Add New Clip
                        </Button>
                        <Button
                          variant='outlined'
                          onClick={handleGenerateAllClipKeywords}
                          disabled={clipKeywordBatchLoading || !activeClips.length}
                        >
                          {clipKeywordBatchLoading ? 'Generating Keywords...' : 'Get Keywords For All Clips'}
                        </Button>
                      </>
                    ) : null}
                    {clipApproach === 'single_sentence' ? (
                      <Button variant='outlined' onClick={handleGenerateAllKeywords}>
                        Get Keywords For All
                      </Button>
                    ) : null}
                    <FormControl sx={{ minWidth: 240 }}>
                      <InputLabel id='clip-approach-label'>Clip Approach</InputLabel>
                      <Select
                        labelId='clip-approach-label'
                        label='Clip Approach'
                        value={clipApproach}
                        onChange={e => setClipApproach(e.target.value as 'multi_sentence' | 'single_sentence')}
                      >
                        <MenuItem value='multi_sentence'>Multi-sentence Clip (Current)</MenuItem>
                        <MenuItem value='single_sentence'>Single Sentence per Clip</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                  {clipApproach === 'multi_sentence' ? (
                    activeClips.length ? (
                      <Box ref={clipCardsContainerRef} sx={{ maxHeight: 260, overflowY: 'auto' }}>
                        <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
                          {activeClips.map(clip => {
                            const label =
                              clip.sentenceIdx.length > 0
                                ? `${clip.sentenceIdx[0] + 1}-${clip.sentenceIdx[clip.sentenceIdx.length - 1] + 1}`
                                : `Clip ${clip.id}`
                            const hasImages = Array.isArray(clip.images) && clip.images.length > 0
                            
return (
                              <Card
                                key={`clip-${clip.id}`}
                                ref={el => {
                                  clipCardRefs.current[clip.id] = el
                                }}
                                variant='outlined'
                                sx={{
                                  width: 200,
                                  borderColor: hasImages ? 'success.main' : 'warning.main',
                                  bgcolor: hasImages ? 'rgba(76, 175, 80, 0.08)' : 'rgba(255, 152, 0, 0.08)'
                                }}
                              >
                                <CardContent>
                                  <Stack spacing={1}>
                                    <Box
                                      sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 2,
                                        bgcolor: hasImages ? 'success.light' : 'warning.light',
                                        color: hasImages ? 'success.contrastText' : 'warning.contrastText',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: 18
                                      }}
                                    >
                                      {label}
                                    </Box>
                                    <Typography variant='body2' color={hasImages ? 'success.main' : 'warning.main'} sx={{ fontWeight: 700 }}>
                                      {clip.images.length} image(s)
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {clip.transition || 'fade'}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      Keyword: {clip.keyword || '-'}
                                    </Typography>
                                    <Button size='small' variant='outlined' onClick={() => handleEditClip(clip.id)}>
                                      Edit
                                    </Button>
                                  </Stack>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </Stack>
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No clips added yet.
                      </Typography>
                    )
                  ) : (
                    <Stack
                      spacing={1}
                      sx={{ maxHeight: 360, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}
                    >
                      {parsedSentences.map((sentence, idx) => {
                        const used = usedSentenceIdxForModal.has(idx)
                        
return (
                          <Box
                            key={`sentence-row-${idx}`}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 220px',
                              gap: 2,
                              alignItems: 'center'
                            }}
                          >
                            <Button
                              variant='text'
                              color='inherit'
                              onClick={() => handleOpenSingleSentenceModal(idx)}
                              sx={{
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                bgcolor: used ? '#7c3aed !important' : 'transparent',
                                color: used ? '#f8fafc !important' : 'text.primary',
                                border: '1px solid rgba(148,163,184,0.35)',
                                '&:hover': {
                                  bgcolor: used ? '#6d28d9 !important' : 'rgba(148,163,184,0.15)'
                                }
                              }}
                            >
                              {idx + 1}. {sentence} {used ? '(Edit)' : ''}
                            </Button>
                            <Stack spacing={0.5} alignItems='flex-end'>
                              <Typography variant='caption' color='text.secondary'>
                                {sentenceKeywords[idx] || '-'}
                              </Typography>
                              <Button
                                size='small'
                                variant='outlined'
                                onClick={() => handleGenerateKeyword(idx)}
                                disabled={keywordLoading[idx]}
                              >
                                {keywordLoading[idx] ? 'Generating...' : 'Get Keyword'}
                              </Button>
                            </Stack>
                          </Box>
                        )
                      })}
                    </Stack>
                  )}
                </Stack>
              ) : null}
              {activeSectionTab === 0 ? (
                <Stack spacing={1.5}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                    Sentence Images
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 280,
                      overflowY: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5
                    }}
                  >
                    <Stack spacing={1.5}>
                      {sentenceImageRows.map(row => (
                        <Box
                          key={`sentence-image-${row.idx}`}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(220px, 1fr) minmax(240px, 1fr)',
                            gap: 2,
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1
                          }}
                        >
                          <Typography variant='body2'>
                            {row.idx + 1}. {row.sentence}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {row.images.length ? (
                              row.images.map((img, imgIdx) => (
                                <Box
                                  key={`sentence-${row.idx}-img-${imgIdx}`}
                                  sx={{
                                    width: 72,
                                    height: 52,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(148,163,184,0.35)',
                                    bgcolor: 'action.hover'
                                  }}
                                >
                                  <img
                                    src={img.url}
                                    alt={`sentence-${row.idx}-img-${imgIdx}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                </Box>
                              ))
                            ) : (
                              <Typography variant='caption' color='text.secondary'>
                                No images selected.
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              ) : null}
              {activeSectionTab === 3 ? (
                <Stack spacing={1.5}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                    Image Gallery
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 260,
                      overflowY: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(() => {
                        const selected = sentenceImageRows.flatMap(row => row.images.map(img => img.url))
                        const all = [...filteredNewsImages, ...selected]
                        const uniq = Array.from(new Set(all))
                        
return uniq.length ? (
                          uniq.map((img, idx) => (
                            <Box
                              key={`gallery-${idx}`}
                              sx={{
                                width: 84,
                                height: 60,
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '1px solid rgba(148,163,184,0.35)',
                                bgcolor: 'action.hover'
                              }}
                            >
                              <img
                                src={img}
                                alt={`gallery-${idx}`}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </Box>
                          ))
                        ) : (
                          <Typography variant='caption' color='text.secondary'>
                            No images available.
                          </Typography>
                        )
                      })()}
                    </Box>
                  </Box>
                </Stack>
              ) : null}
              {activeSectionTab === 5 ? (
                <Stack direction='row' spacing={2} alignItems='center'>
                  <TextField
                    select
                    label='Status'
                    value={videoStatus}
                    onChange={e =>
                      setVideoStatus(e.target.value as 'draft' | 'finished' | 'published' | 'ready_for_download' | 'rendering')
                    }
                    sx={{ maxWidth: 200 }}
                  >
                    <MenuItem value='draft'>Draft</MenuItem>
                    <MenuItem value='finished'>Finished</MenuItem>
                    <MenuItem value='published'>Published</MenuItem>
                    <MenuItem value='ready_for_download'>Ready For Download</MenuItem>
                    <MenuItem value='rendering'>Rendering</MenuItem>
                  </TextField>
                  <FormControlLabel
                    control={<Checkbox checked={showBackgroundVideo} onChange={e => setShowBackgroundVideo(e.target.checked)} />}
                    label='Show Background Video'
                  />
                  <Button variant='outlined' onClick={handleSaveVideo} disabled={saving || !videoId}>
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                </Stack>
              ) : null}
              {activeSectionTab === 4 ? (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                    Transition Sequence
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={inheritClipTransitions}
                        onChange={e => setInheritClipTransitions(e.target.checked)}
                      />
                    }
                    label='Inherit per clip transitions'
                  />
                  <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
                    <FormControl sx={{ minWidth: 220 }}>
                      <InputLabel id='transition-mode-label'>Mode</InputLabel>
                      <Select
                        labelId='transition-mode-label'
                        label='Mode'
                        value={transitionMode}
                        onChange={e => setTransitionMode(e.target.value as TransitionMode)}
                        disabled={!isSequenceUsable}
                      >
                        <MenuItem value='single'>Single (Use Global/Clip)</MenuItem>
                        <MenuItem value='cycle_images'>Cycle by Images</MenuItem>
                        <MenuItem value='cycle_time'>Cycle by Time</MenuItem>
                        <MenuItem value='hybrid'>Hybrid</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 320, flex: 1 }}>
                      <InputLabel id='transition-set-label'>Global Transition Set</InputLabel>
                      <Select
                        multiple
                        labelId='transition-set-label'
                        label='Global Transition Set'
                        value={transitionSet}
                        onChange={e => {
                          const next = e.target.value as TransitionKey[]
                          if (transitionMode === 'single') {
                            setTransitionSet(next.length ? [next[next.length - 1]] : [])
                          } else {
                            setTransitionSet(next)
                          }
                        }}
                        disabled={!isSequenceUsable}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 320
                            }
                          }
                        }}
                        renderValue={selected =>
                          (selected as TransitionKey[])
                            .map(item => transitionOptions.find(opt => opt.value === item)?.label || item)
                            .join(', ')
                        }
                      >
                        {transitionOptions.map(option => (
                          <MenuItem key={`set-${option.value}`} value={option.value}>
                            <Checkbox checked={transitionSet.includes(option.value)} />
                            <ListItemText primary={option.label} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {transitionMode === 'single'
                          ? 'Select one transition to apply it to all images.'
                          : 'Order is preserved. Sequence applies only when "Inherit per clip" is off.'}
                      </FormHelperText>
                    </FormControl>
                    <TextField
                      label='Images / transition'
                      type='number'
                      value={imagesPerTransition}
                      onChange={e => setImagesPerTransition(Math.max(1, Number(e.target.value || 1)))}
                      sx={{ maxWidth: 180 }}
                      disabled={!isSequenceUsable || transitionMode === 'cycle_time' || transitionMode === 'single'}
                    />
                    <TextField
                      label='Seconds / transition'
                      type='number'
                      value={secondsPerTransition}
                      onChange={e => setSecondsPerTransition(Math.max(0.1, Number(e.target.value || 0.1)))}
                      sx={{ maxWidth: 180 }}
                      disabled={!isSequenceUsable || transitionMode === 'cycle_images' || transitionMode === 'single'}
                    />
                  </Stack>
                  <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={skipShortTransitions}
                          onChange={e => setSkipShortTransitions(e.target.checked)}
                          disabled={!isSequenceUsable || transitionMode === 'single'}
                        />
                      }
                      label='Skip transition for short sentence'
                    />
                    {skipShortTransitions ? (
                      <TextField
                        label='Min duration for transitions (sec)'
                        type='number'
                        value={minTransitionDurationSec}
                        onChange={e => setMinTransitionDurationSec(Math.max(0, Number(e.target.value || 0)))}
                        sx={{ maxWidth: 240 }}
                        disabled={!isSequenceUsable || transitionMode === 'single'}
                      />
                    ) : null}
                    <FormControl sx={{ minWidth: 220 }}>
                      <InputLabel id='short-transition-fallback-label'>Short Clip Fallback</InputLabel>
                      <Select
                        labelId='short-transition-fallback-label'
                        label='Short Clip Fallback'
                        value={shortTransitionFallback}
                        onChange={e => setShortTransitionFallback(e.target.value as TransitionKey | 'none')}
                        disabled={!isSequenceUsable || !skipShortTransitions || transitionMode === 'single'}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 240
                            }
                          }
                        }}
                      >
                        <MenuItem value='none'>None</MenuItem>
                        {transitionOptions.map(option => (
                          <MenuItem key={`short-${option.value}`} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>
              ) : null}
              {activeSectionTab === 3 ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2} sx={{ mb: 1.5 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                      Overlay Stickers (Image / Clip)
                    </Typography>
                    <Button variant='outlined' size='small' onClick={addOverlayItem}>
                      Add Overlay
                    </Button>
                  </Stack>
                  {mediaOverlays.length ? (
                    <Stack spacing={1.5}>
                      {mediaOverlays.map((overlay, idx) => (
                        <Box
                          key={overlay.id}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1.5,
                            display: 'grid',
                            gridTemplateColumns: 'minmax(120px, 1fr) minmax(160px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr)',
                            gap: 1.5,
                            alignItems: 'center'
                          }}
                        >
                          <TextField
                            label='Type'
                            select
                            value={overlay.type}
                            onChange={e => updateOverlayItem(overlay.id, { type: e.target.value as OverlayType })}
                          >
                            <MenuItem value='image'>Image</MenuItem>
                            <MenuItem value='video'>Clip</MenuItem>
                          </TextField>
                          <TextField
                            label='URL'
                            value={overlay.url}
                            onChange={e => updateOverlayItem(overlay.id, { url: e.target.value })}
                            placeholder={overlay.type === 'video' ? 'Paste clip URL' : 'Paste image URL'}
                          />
                          {overlay.type === 'image' ? (
                            <FormControl>
                              <InputLabel id={`${overlay.id}-gallery-label`}>Select From Gallery</InputLabel>
                              <Select
                                labelId={`${overlay.id}-gallery-label`}
                                label='Select From Gallery'
                                value={galleryItems.some(item => item.url === overlay.url) ? overlay.url : ''}
                                onChange={e => updateOverlayItem(overlay.id, { url: e.target.value, type: 'image' })}
                                MenuProps={{
                                  PaperProps: {
                                    style: {
                                      maxHeight: 320
                                    }
                                  }
                                }}
                                renderValue={selected => {
                                  const selectedItem = galleryItems.find(item => item.url === selected)
                                  
return selectedItem ? selectedItem.name : 'Choose image'
                                }}
                              >
                                <MenuItem value=''>
                                  <em>Choose image</em>
                                </MenuItem>
                                {galleryItems.map(image => (
                                  <MenuItem key={`${overlay.id}-gallery-${image.url}`} value={image.url}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <Box
                                        component='img'
                                        src={image.url}
                                        alt={image.name}
                                        sx={{
                                          width: 44,
                                          height: 44,
                                          objectFit: 'cover',
                                          borderRadius: 1,
                                          border: '1px solid',
                                          borderColor: 'divider'
                                        }}
                                      />
                                      <Typography variant='body2'>{image.name}</Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : null}
                          {overlay.type === 'image' ? (
                            <Button variant='outlined' component='label'>
                              Upload Image
                              <input
                                type='file'
                                accept='image/*'
                                hidden
                                onChange={e => handleAddOverlayImages(overlay.id, e.target.files)}
                              />
                            </Button>
                          ) : null}
                          <TextField
                            label='Position'
                            select
                            value={overlay.position}
                            onChange={e => updateOverlayItem(overlay.id, { position: e.target.value as OverlayPosition })}
                          >
                            {overlayPositions.map(option => (
                              <MenuItem key={`${overlay.id}-${option.value}`} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            label='Size'
                            select
                            value={overlay.size}
                            onChange={e => updateOverlayItem(overlay.id, { size: e.target.value as OverlaySize })}
                          >
                            {overlaySizes.map(option => (
                              <MenuItem key={`${overlay.id}-size-${option.value}`} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            label='Start (sec)'
                            type='number'
                            value={overlay.startSec}
                            onChange={e =>
                              updateOverlayItem(overlay.id, { startSec: Math.max(0, Number(e.target.value || 0)) })
                            }
                          />
                          <TextField
                            label='End (sec)'
                            type='number'
                            value={overlay.endSec}
                            onChange={e =>
                              updateOverlayItem(overlay.id, {
                                endSec: Math.max(Number(overlay.startSec || 0), Number(e.target.value || 0))
                              })
                            }
                          />
                          <TextField
                            label='Animation'
                            select
                            value={overlay.animation}
                            onChange={e => updateOverlayItem(overlay.id, { animation: e.target.value as OverlayAnimation })}
                          >
                            {overlayAnimations.map(option => (
                              <MenuItem key={`${overlay.id}-anim-${option.value}`} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            label='Schedule'
                            select
                            value={overlay.scheduleMode}
                            onChange={e =>
                              updateOverlayItem(overlay.id, {
                                scheduleMode: e.target.value as OverlayScheduleMode,
                                repeat: e.target.value === 'interval'
                              })
                            }
                          >
                            {overlayScheduleModes.map(option => (
                              <MenuItem key={`${overlay.id}-schedule-${option.value}`} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          {overlay.scheduleMode === 'interval' ? (
                            <TextField
                              label='Repeat Every (sec)'
                              type='number'
                              value={overlay.repeatEverySec}
                              onChange={e =>
                                updateOverlayItem(overlay.id, {
                                  repeatEverySec: Math.max(1, Number(e.target.value || 1)),
                                  repeat: true
                                })
                              }
                            />
                          ) : null}
                          {overlay.scheduleMode === 'timeline_list' ? (
                            <TextField
                              label='Timeline Starts (sec)'
                              value={overlay.timelineStarts}
                              onChange={e => updateOverlayItem(overlay.id, { timelineStarts: e.target.value })}
                              placeholder='20, 55, 110'
                            />
                          ) : null}
                          {overlay.scheduleMode === 'random' ? (
                            <>
                              <TextField
                                label='Show N Times'
                                type='number'
                                value={overlay.randomCount}
                                onChange={e =>
                                  updateOverlayItem(overlay.id, {
                                    randomCount: Math.max(1, Number(e.target.value || 1))
                                  })
                                }
                              />
                              <TextField
                                label='Each For (sec)'
                                type='number'
                                value={overlay.randomDurationSec}
                                onChange={e =>
                                  updateOverlayItem(overlay.id, {
                                    randomDurationSec: Math.max(0.5, Number(e.target.value || 0.5))
                                  })
                                }
                              />
                            </>
                          ) : null}
                          <TextField
                            label='Label (optional)'
                            value={overlay.label || ''}
                            onChange={e => updateOverlayItem(overlay.id, { label: e.target.value })}
                          />
                          <Button color='error' variant='outlined' onClick={() => removeOverlayItem(overlay.id)}>
                            Remove
                          </Button>
                          <Typography variant='caption' color='text.secondary'>
                            Overlay {idx + 1}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      No overlays added yet.
                    </Typography>
                  )}
                </Box>
              ) : null}
              {activeSectionTab === 5 ? (
                <>
                  {renderStatus ? (
                    <Typography variant='body2' color='text.secondary'>
                      Render: {renderStatus}
                    </Typography>
                  ) : null}
                  {customAudioSrc ? (
                    <Stack spacing={1}>
                      <Typography variant='body2' color='text.secondary'>
                        Audio: {customAudioFileName || 'generated'}
                      </Typography>
                      <audio ref={previewAudioRef} controls src={customAudioSrc} crossOrigin='anonymous' />
                    </Stack>
                  ) : null}
                  {customPreviewReady ? (
                    <Box ref={previewContainerRef} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', p: 1 }}>
                      <Player
                        ref={previewPlayerRef}
                        key={`${customPreviewLayout}:${customAudioSrc}:${customPreviewDurationFrames}:${parsedSentences.length}:${activeClips.length}`}
                        component={ShortScriptAudioPreviewComposition as any}
                        durationInFrames={customPreviewDurationFrames}
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
                          title: 'R4D News',
                          script: customScript.trim(),
                          audioUrl: customAudioSrc,
                          stylePreset: 'data',
                          clips: activeClips,
                          sentences: parsedSentences,
                          sentenceFrames: previewSentenceFrames,
                          perSentenceSec: customPerSentenceSec,
                          showBackgroundVideo,
                          transitionMode,
                          inheritClipTransitions,
                          transitionSet,
                          imagesPerTransition,
                          secondsPerTransition,
                          minTransitionDurationSec,
                          skipShortTransitions,
                          shortTransitionFallback,
                          mediaOverlays,
                          timeline: previewTimelineForRender
                        }}
                        controls
                      />
                    </Box>
                  ) : null}
                </>
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
      <Dialog open={clipModalOpen} onClose={handleCloseClipModal} maxWidth='md' fullWidth>
        <DialogTitle>Add New Clip</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant='subtitle2' color='text.secondary'>
              {clipApproach === 'single_sentence'
                ? 'Single sentence per clip. Select a sentence below to configure.'
                : 'Select consecutive sentences. You can only add at the start or end of the current selection.'}
            </Typography>
            {editingClipId !== null ? (
              <FormHelperText>Editing Clip {editingClipId}</FormHelperText>
            ) : null}
            {clipApproach === 'multi_sentence' ? (
              <>
                <Button variant='outlined' onClick={() => setClipSelectionCollapsed(prev => !prev)}>
                  {clipSelectionCollapsed ? 'Expand Sentence List' : 'Collapse Sentence List'}
                </Button>
                <Collapse in={!clipSelectionCollapsed}>
                  <Stack
                    ref={clipSentenceListRef}
                    spacing={0.5}
                    sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}
                  >
                    {parsedSentences.map((sentence, idx) => {
                      const used = usedSentenceIdxForModal.has(idx)
                      const checked = clipSelectedIdx.includes(idx)
                      const canStart = clipSelectedIdx.length === 0 && idx === nextRequiredIdx
                      const canExtend =
                        clipApproach === 'multi_sentence' &&
                        clipSelectedIdx.length > 0 &&
                        (idx === Math.min(...clipSelectedIdx) - 1 || idx === Math.max(...clipSelectedIdx) + 1)
                      const selectionDisabled =
                        used || (!checked && !canStart && !canExtend)
                      
return (
                        <Box
                          key={`clip-s-${idx}`}
                          ref={(el: HTMLDivElement | null) => {
                            clipSentenceItemRefs.current[idx] = el
                          }}
                        >
                          <FormControlLabel
                            control={<Checkbox checked={checked} disabled={selectionDisabled} onChange={() => handleToggleClipSentence(idx)} />}
                            label={`${idx + 1}. ${sentence}`}
                            sx={{ alignItems: 'flex-start', opacity: used || selectionDisabled ? 0.5 : 1, m: 0 }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </Collapse>
              </>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Selected sentence: {clipSelectedIdx.length ? clipSelectedIdx[0] + 1 : '-'}
              </Typography>
            )}
            {clipSelectedIdx.length ? (
              <>
                <FormHelperText>
                  Selected sentences: {clipSelectedIdx[0] + 1}-{clipSelectedIdx[clipSelectedIdx.length - 1] + 1}
                </FormHelperText>
                <Collapse in={clipSelectionCollapsed}>
                  <Stack spacing={1} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    {clipSelectedIdx.map(idx => (
                      <Typography key={`sel-${idx}`} variant='body2'>
                        {idx + 1}. {parsedSentences[idx]}
                      </Typography>
                    ))}
                  </Stack>
                </Collapse>
              </>
            ) : null}
            <Stack direction='row' spacing={2} alignItems='center'>
              <Button variant='outlined' component='label'>
                Add Images
                <input type='file' accept='image/*' multiple hidden onChange={e => handleAddModalImages(e.target.files)} />
              </Button>
              <Typography variant='body2' color='text.secondary'>
                {clipImages.length ? `${clipImages.length} image(s) selected` : 'No images selected'}
              </Typography>
            </Stack>
            <Stack direction='row' spacing={2} alignItems='center'>
              <TextField
                label='Search Images'
                value={imageQuery}
                onChange={e => setImageQuery(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                variant='outlined'
                onClick={handleRefineImageQuery}
                disabled={refineLoading || !imageQuery.trim()}
              >
                {refineLoading ? 'Refining...' : 'Refine Phrase'}
              </Button>
              <Button variant='contained' onClick={() => void handleSearchImages()} disabled={imageLoading || !imageQuery.trim()}>
                {imageLoading ? 'Searching...' : 'Search'}
              </Button>
            </Stack>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                Provider:
              </Typography>
              {(['all', 'unsplash', 'pexels', 'pixabay'] as const).map(provider => (
                <Button
                  key={`provider-${provider}`}
                  size='small'
                  variant={imageProvider === provider ? 'contained' : 'outlined'}
                  onClick={() => {
                    setImageProvider(provider)
                    handleSearchImages(provider)
                  }}
                >
                  {provider === 'all' ? 'All' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Button>
              ))}
            </Stack>
            <FormControl sx={{ maxWidth: 220 }}>
              <InputLabel id='clip-transition-label'>Transition</InputLabel>
              <Select
                labelId='clip-transition-label'
                label='Transition'
                value={clipTransition}
                onChange={e => setClipTransition(e.target.value as TransitionKey)}
              >
                {transitionOptions.map(option => (
                  <MenuItem key={`clip-${option.value}`} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {galleryItems.length ? (
              <Stack spacing={1}>
                <Typography variant='subtitle2'>Image Gallery Collection</Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  {galleryItems.map((image, idx) => (
                    <Card key={`gallery-${idx}`} variant='outlined' sx={{ width: 140 }}>
                      <img src={image.url} alt={image.name} style={{ width: '100%', height: 90, objectFit: 'contain' }} />
                      <Stack direction='row' spacing={1} sx={{ p: 1 }} alignItems='center' justifyContent='space-between'>
                        <Typography variant='caption'>In use: {galleryUseCounts.get(image.url) || 0}</Typography>
                        <Button size='small' variant='outlined' onClick={() => handleAddGalleryToClip(image)}>
                          Use ({galleryUseCounts.get(image.url) || 0})
                        </Button>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            ) : null}
            {galleryItems.length && imageResults.length ? <Divider /> : null}
            {imageResults.length ? (
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                {imageResults.map(item => (
                  <Card key={`${item.provider}-${item.id}`} variant='outlined' sx={{ width: 160 }}>
                    <img src={item.thumbUrl || item.fullUrl} alt={item.id} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                    <Stack spacing={0.5} sx={{ p: 1 }}>
                      <Typography variant='caption'>{item.provider}</Typography>
                      <Stack direction='row' spacing={1}>
                        <Button size='small' variant='outlined' onClick={() => handleAddResultImage(item)}>
                          Add to Gallery
                        </Button>
                        <Button size='small' variant='contained' onClick={() => handleUseResultImage(item)}>
                          Use It
                        </Button>
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : null}
            <FormControlLabel
              control={<Checkbox checked={clipImageWithText} onChange={e => setClipImageWithText(e.target.checked)} />}
              label='Use Image With Text layout (unchecked = full screen image)'
            />
              <FormControlLabel
                control={<Checkbox checked={clipUseRandomImages} onChange={e => setClipUseRandomImages(e.target.checked)} />}
                label='Use Random Images (from all clips)'
              />
            {clipImages.length ? (
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                {clipImages.map((image, idx) => (
                  <Card
                    key={`modal-img-${idx}`}
                    variant='outlined'
                    sx={{ width: 140, position: 'relative' }}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', String(idx))}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      const from = Number(e.dataTransfer.getData('text/plain'))
                      handleReorderClipImages(from, idx)
                    }}
                  >
                    <Button
                      size='small'
                      variant='contained'
                      color='error'
                      onClick={() => handleRemoveClipImage(idx)}
                      sx={{ position: 'absolute', top: 6, right: 6, minWidth: 'auto', px: 1, py: 0 }}
                    >
                      Remove
                    </Button>
                    <img src={image.url} alt={image.name} style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                    <Typography variant='caption' sx={{ px: 1, py: 0.5, display: 'block' }}>
                      {image.name}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClipModal}>Cancel</Button>
          <Button variant='contained' onClick={handleSaveClip} disabled={!canSaveClip || clipSaving}>
            {clipSaving ? 'Saving...' : 'Save Clip'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default NewsContentPage
