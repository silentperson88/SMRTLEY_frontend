import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import LinearProgress from '@mui/material/LinearProgress'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { ShortScriptAudioPreviewComposition } from 'src/remotion/ShortScriptAudioPreviewComposition'
import { NewsScriptHighlightsComposition } from 'src/remotion/NewsScriptHighlightsComposition'

const Player = dynamic(() => import('@remotion/player').then(mod => mod.Player), {
  ssr: false
})

const PREVIEW_FPS = 30
type Language = 'hi' | 'en'

type LangText = Record<Language, string>
type LangSceneText = Record<Language, Array<{ heading: string; text: string }>>

type DemoApproach = {
  id: string
  title: string
  type: 'single' | 'multi'
  description: string
  stylePreset: 'flash' | 'data' | 'story'
  textByLang?: LangText
  multiScenesByLang?: LangSceneText
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

const extractBullets = (text: string) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
  return lines
    .map(line => line.replace(/^[-*•]\s+|^\d+[.)]\s+/, '').trim())
    .filter((line, idx) => /^[-*•]\s+/.test(lines[idx]) || /^\d+[.)]\s+/.test(lines[idx]))
}

const toSpokenBulletNarration = (text: string, lang: Language) => {
  const bullets = extractBullets(text)
  if (bullets.length < 2) return text
  if (lang === 'hi') {
    const intro = 'मुख्य बिंदु ध्यान से सुनिए।'
    const points = bullets.map((item, idx) => `मुद्दा ${idx + 1}: ${item}।`).join(' ')
    return `${intro} ${points} यही आज का सार है।`
  }
  const intro = 'Here are the key points.'
  const points = bullets.map((item, idx) => `Point ${idx + 1}: ${item}.`).join(' ')
  return `${intro} ${points} That is the quick summary.`
}

const defaultApproaches: DemoApproach[] = [
  {
    id: 'greeting-paragraph',
    title: 'Greeting + Paragraph + Conclusion',
    type: 'single',
    stylePreset: 'story',
    description: 'Decorative greeting at start and thank-you close at end.',
    textByLang: {
      hi: 'नमस्कार दोस्तों। आज के बुलेटिन में कंपनी के ग्रोथ आउटलुक, डिमांड संकेत और आगे की रणनीति पर फोकस है। प्रबंधन ने कहा कि अगले क्वार्टर में प्रदर्शन बेहतर रह सकता है। धन्यवाद, ऐसे ही अपडेट्स के लिए जुड़े रहिए।',
      en: 'Hello everyone. In this bulletin, we focus on the company growth outlook, demand signals, and next execution plan. Management commentary indicates stronger momentum in upcoming quarters. Thanks for watching and follow for more concise updates.'
    }
  },
  {
    id: 'bullet-template',
    title: 'Bullet Point News Layout',
    type: 'single',
    stylePreset: 'data',
    description: 'Shows list UI when content has bullet lines.',
    textByLang: {
      hi: 'स्टॉक अपडेट: रिलायंस इंडस्ट्रीज\n- तिमाही राजस्व में साल-दर-साल लगभग 11 प्रतिशत वृद्धि दर्ज हुई।\n- शुद्ध लाभ में सुधार के साथ मार्जिन ट्रेंड स्थिर और मजबूत रहा।\n- रिटेल सेगमेंट में बिक्री गति बेहतर रही और फुटफॉल में सुधार दिखा।\n- टेलीकॉम बिजनेस में प्रति यूज़र औसत राजस्व बढ़ने के संकेत मिले।\n- बोर्ड ने ऊर्जा ट्रांजिशन प्रोजेक्ट्स के लिए नए पूंजी व्यय को मंजूरी दी।\n- प्रबंधन ने पूरे साल के लिए ऑपरेटिंग प्रदर्शन पर सकारात्मक दृष्टिकोण बरकरार रखा।',
      en: 'Quick market update:\n- Revenue growth beat estimate\n- Margin improved\n- Board approved expansion capex\n- Full-year guidance maintained\nOverall tone remains constructive.'
    }
  },
  {
    id: 'hindi-stock-bullets',
    title: 'Hindi Stock Bulletin (Hardcoded)',
    type: 'single',
    stylePreset: 'data',
    description: 'Hardcoded Hindi bullet news for stock-content preview.',
    textByLang: {
      hi: 'स्टॉक अपडेट: टाटा मोटर्स\n- कुल बिक्री में तिमाही आधार पर सुधार देखा गया, खासकर कमर्शियल सेगमेंट में।\n- परिचालन मार्जिन में बढ़ोतरी से मुनाफे की गुणवत्ता बेहतर हुई।\n- कंपनी ने लागत नियंत्रण और सप्लाई चेन दक्षता पर फोकस बढ़ाया।\n- इलेक्ट्रिक वाहन पोर्टफोलियो के लिए अगले वित्त वर्ष का लॉन्च रोडमैप साझा किया गया।\n- ऑटोमोटिव कर्ज में कमी के संकेत मिले, जिससे बैलेंस शीट मजबूत हुई।\n- प्रबंधन ने मांग ट्रेंड को सावधानीपूर्ण लेकिन सकारात्मक बताया।',
      en: 'Stock update: Tata Motors\n- Quarterly sales trend improved.\n- Operating margin expanded.\n- Cost efficiency initiatives continued.\n- EV launch roadmap shared.\n- Automotive debt reduced.\n- Management outlook remained cautiously positive.'
    }
  },
  {
    id: 'breaking-flash',
    title: 'Breaking Flash Anchor',
    type: 'single',
    stylePreset: 'flash',
    description: 'Fast hook style with high-energy transitions.',
    textByLang: {
      hi: 'ब्रेकिंग अपडेट। कंपनी ने रणनीतिक विस्तार योजना की घोषणा की है, जिससे अगले कुछ क्वार्टर में क्षमता बढ़ने की संभावना है। अब निवेशकों की नजर ऑर्डर फ्लो और निष्पादन की गति पर रहेगी।',
      en: 'Breaking update. The company announced a strategic expansion plan that could lift capacity in the coming quarters. Investor focus now shifts to order flow and execution speed.'
    }
  },
  {
    id: 'split-scenes-pro',
    title: 'Professional Multi-Scene Slides',
    type: 'multi',
    stylePreset: 'flash',
    description: 'Slide movement, transitions, and per-scene pacing with audio sync.',
    multiScenesByLang: {
      hi: [
        { heading: 'स्वागत', text: 'वेलकम बैक। एक मिनट में आज की मुख्य मार्केट हेडलाइंस देखते हैं।' },
        { heading: 'मुख्य अपडेट', text: 'कंपनी ने बेहतर डिमांड संकेत और विस्तार योजना पर सकारात्मक टिप्पणी दी।' },
        { heading: 'डेटा पॉइंट्स', text: '- रेवेन्यू मोमेंटम बेहतर\n- मार्जिन स्थिर\n- आउटलुक सकारात्मक' },
        { heading: 'निष्कर्ष', text: 'धन्यवाद। अगले अपडेट में हम नतीजों और निष्पादन की पुष्टि ट्रैक करेंगे।' }
      ],
      en: [
        { heading: 'Greeting', text: 'Welcome back. Here are today’s key market headlines in under one minute.' },
        { heading: 'Main Update', text: 'The company highlighted stronger demand signals and expansion intent.' },
        { heading: 'Data Points', text: '- Revenue momentum improved\n- Margin trend stayed stable\n- Outlook remained positive' },
        { heading: 'Conclusion', text: 'Thanks for watching. Next update tracks earnings confirmation and execution.' }
      ]
    }
  }
]

const RemotionDemoPage: NextPage = () => {
  const router = useRouter()
  const [approaches, setApproaches] = useState<DemoApproach[]>(defaultApproaches)
  const [selectedId, setSelectedId] = useState(defaultApproaches[0].id)
  const [templateLanguage, setTemplateLanguage] = useState<Record<string, Language>>(
    Object.fromEntries(defaultApproaches.map(item => [item.id, 'hi']))
  )
  const [loadingId, setLoadingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewAudioSrc, setPreviewAudioSrc] = useState('')
  const [previewAudioName, setPreviewAudioName] = useState('')
  const [previewDurationFrames, setPreviewDurationFrames] = useState(PREVIEW_FPS * 20)
  const [previewScenes, setPreviewScenes] = useState<Array<{ id: number; heading: string; onScreenText: string; durationSec: number; audioUrl?: string }>>([])
  const [previewScript, setPreviewScript] = useState('')
  const [previewStyle, setPreviewStyle] = useState<'flash' | 'data' | 'story'>('flash')
  const [previewMode, setPreviewMode] = useState<'single' | 'multi'>('single')

  const selected = useMemo(() => approaches.find(item => item.id === selectedId) || approaches[0], [approaches, selectedId])
  const apiBase = useMemo(() => String(process.env.NEXT_PUBLIC_API_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, ''), [])
  const toAbsolute = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const normalized = url.startsWith('/') ? url : `/${url}`
    return `${apiBase}${normalized}`
  }

  const getLang = (id: string): Language => templateLanguage[id] || 'hi'

  useEffect(() => {
    const q = String(router.query?.approach || '').trim()
    if (!q) return
    const exists = approaches.some(item => item.id === q)
    if (exists) setSelectedId(q)
  }, [router.query?.approach, approaches])

  const updateSingleText = (id: string, lang: Language, value: string) => {
    setApproaches(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              textByLang: {
                hi: item.textByLang?.hi || '',
                en: item.textByLang?.en || '',
                [lang]: value
              }
            }
          : item
      )
    )
  }

  const updateMultiScene = (id: string, lang: Language, index: number, field: 'heading' | 'text', value: string) => {
    setApproaches(prev =>
      prev.map(item => {
        if (item.id !== id || !item.multiScenesByLang) return item
        const current = item.multiScenesByLang[lang] || []
        const next = [...current]
        next[index] = { ...next[index], [field]: value }
        return {
          ...item,
          multiScenesByLang: {
            hi: item.multiScenesByLang.hi || [],
            en: item.multiScenesByLang.en || [],
            [lang]: next
          }
        }
      })
    )
  }

  const generatePreview = async (approach: DemoApproach) => {
    try {
      const lang = getLang(approach.id)
      setLoadingId(approach.id)
      setError('')
      setSuccess('')
      setPreviewAudioSrc('')
      setPreviewAudioName('')
      const model = lang === 'hi' ? 'paratham' : 'lessac'

      if (approach.type === 'single') {
        const narration = String(approach.textByLang?.[lang] || '').trim()
        if (!narration) throw new Error('Script is empty')
        const spokenNarration = toSpokenBulletNarration(narration, lang)
        const res = await axiosInstance.post(
          ENDURL.NEWS_GENERATE_SCENE_AUDIOS,
          {
            language: lang,
            model,
            scenes: [{ id: 1, heading: approach.title, narration: spokenNarration }],
            options: { normalizeText: true, splitSentences: false }
          },
          { timeout: 8 * 60 * 1000 }
        )
        const scene = Array.isArray(res?.data?.data?.scenes) ? res.data.data.scenes[0] : null
        const audioUrl = toAbsolute(String(scene?.audioUrl || ''))
        if (!audioUrl) throw new Error('Audio URL missing')
        const duration = await getAudioDuration(audioUrl)
        const durationFrames = Math.max(PREVIEW_FPS * 6, Math.round((duration || 8) * PREVIEW_FPS))

        setPreviewMode('single')
        setPreviewStyle(approach.stylePreset)
        setPreviewScript(narration)
        setPreviewAudioSrc(audioUrl)
        setPreviewAudioName(String(scene?.fileName || 'single-script.wav'))
        setPreviewDurationFrames(durationFrames)
        setPreviewScenes([])
        setSuccess(`Audio and preview generated (${(duration || 0).toFixed(1)}s) in ${lang.toUpperCase()}.`)
        return
      }

      const scenesInput = (approach.multiScenesByLang?.[lang] || []).map((scene, idx) => ({
        id: idx + 1,
        heading: scene.heading,
        narration: scene.text
      }))
      if (!scenesInput.length) throw new Error('No split scenes available')

      const res = await axiosInstance.post(
        ENDURL.NEWS_GENERATE_SCENE_AUDIOS,
        {
          language: lang,
          model,
          scenes: scenesInput,
          options: { normalizeText: true, splitSentences: false }
        },
        { timeout: 8 * 60 * 1000 }
      )

      const returned: any[] = Array.isArray(res?.data?.data?.scenes) ? res.data.data.scenes : []
      if (!returned.length) throw new Error('No scene audio generated')

      const sceneDurations = await Promise.all(
        returned.map(async scene => {
          const audioUrl = toAbsolute(String(scene?.audioUrl || ''))
          const d = await getAudioDuration(audioUrl)
          return {
            id: Number(scene?.id || 0),
            heading: String(scene?.heading || 'Scene'),
            onScreenText: String(scene?.narration || ''),
            audioUrl,
            durationSec: Math.max(1, d || Number(scene?.durationSec || 4))
          }
        })
      )
      const totalSec = sceneDurations.reduce((sum, s) => sum + Number(s.durationSec || 0), 0)

      setPreviewMode('multi')
      setPreviewStyle(approach.stylePreset)
      setPreviewScenes(sceneDurations)
      setPreviewDurationFrames(Math.max(PREVIEW_FPS * 8, Math.round(totalSec * PREVIEW_FPS)))
      setPreviewScript('')
      setPreviewAudioSrc('')
      setPreviewAudioName('')
      setSuccess(`Split audio preview generated (${totalSec.toFixed(1)}s total) in ${lang.toUpperCase()}.`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate preview')
    } finally {
      setLoadingId('')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          Remotion News Template Lab
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Each template has its own language dropdown. Hindi text {'->'} Hindi audio, English text {'->'} English audio.
        </Typography>
      </Grid>

      <Grid item xs={12} lg={7}>
        <Stack spacing={3}>
          {approaches.map(approach => {
            const lang = getLang(approach.id)
            const scenes = approach.multiScenesByLang?.[lang] || []
            return (
              <Card key={approach.id} variant={approach.id === selectedId ? 'elevation' : 'outlined'}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Box>
                        <Typography variant='h6'>{approach.title}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {approach.description}
                        </Typography>
                      </Box>
                      <Stack direction='row' spacing={1}>
                        <Chip size='small' label={`Style: ${approach.stylePreset}`} />
                        <TextField
                          select
                          size='small'
                          label='Language'
                          value={lang}
                          onChange={event =>
                            setTemplateLanguage(prev => ({
                              ...prev,
                              [approach.id]: event.target.value as Language
                            }))
                          }
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value='hi'>Hindi</MenuItem>
                          <MenuItem value='en'>English</MenuItem>
                        </TextField>
                        <Button size='small' variant='outlined' onClick={() => setSelectedId(approach.id)}>
                          Use This
                        </Button>
                      </Stack>
                    </Stack>

                    {approach.type === 'single' ? (
                      <TextField
                        label='Script Text'
                        value={approach.textByLang?.[lang] || ''}
                        onChange={event => updateSingleText(approach.id, lang, event.target.value)}
                        multiline
                        minRows={5}
                        fullWidth
                      />
                    ) : (
                      <Stack spacing={1.5}>
                        {scenes.map((scene, idx) => (
                          <Card key={`${approach.id}-${lang}-${idx}`} variant='outlined'>
                            <CardContent>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={3}>
                                  <TextField
                                    label='Heading'
                                    value={scene.heading}
                                    onChange={event => updateMultiScene(approach.id, lang, idx, 'heading', event.target.value)}
                                    fullWidth
                                  />
                                </Grid>
                                <Grid item xs={12} md={9}>
                                  <TextField
                                    label='Scene Text'
                                    value={scene.text}
                                    onChange={event => updateMultiScene(approach.id, lang, idx, 'text', event.target.value)}
                                    fullWidth
                                  />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}

                    <Stack direction='row' spacing={2}>
                      <Button variant='contained' onClick={() => generatePreview(approach)} disabled={loadingId === approach.id}>
                        {loadingId === approach.id ? 'Generating...' : 'Generate Audio & Preview'}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      </Grid>

      <Grid item xs={12} lg={5}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>Live Preview</Typography>
              <Typography variant='caption' color='text.secondary'>
                Preview length follows generated audio duration exactly.
              </Typography>
              <Divider />

              {previewMode === 'single' && previewAudioSrc ? (
                <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', p: 1 }}>
                  <Player
                    component={ShortScriptAudioPreviewComposition as any}
                    durationInFrames={previewDurationFrames}
                    fps={PREVIEW_FPS}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{ width: '100%', maxWidth: 920, aspectRatio: '16 / 9', margin: '0 auto' }}
                    inputProps={{
                      title: selected?.title || 'Demo',
                      script: previewScript,
                      audioUrl: previewAudioSrc,
                      stylePreset: previewStyle
                    }}
                    controls
                  />
                </Box>
              ) : null}

              {previewMode === 'multi' && previewScenes.length > 0 ? (
                <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', p: 1 }}>
                  <Player
                    component={NewsScriptHighlightsComposition as any}
                    durationInFrames={previewDurationFrames}
                    fps={PREVIEW_FPS}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{ width: '100%', maxWidth: 920, aspectRatio: '16 / 9', margin: '0 auto' }}
                    inputProps={{
                      title: selected?.title || 'Split Demo',
                      scenes: previewScenes,
                      stylePreset: previewStyle
                    }}
                    controls
                  />
                </Box>
              ) : null}

              {!previewAudioSrc && !previewScenes.length ? <Alert severity='info'>Choose a template and click "Generate Audio & Preview".</Alert> : null}
              {loadingId ? <LinearProgress /> : null}

              {previewAudioSrc ? (
                <Stack spacing={1}>
                  <Typography variant='caption' color='text.secondary'>
                    {previewAudioName}
                  </Typography>
                  <audio controls src={previewAudioSrc} style={{ width: '100%' }} />
                </Stack>
              ) : null}

              <Chip label={`Duration: ${(previewDurationFrames / PREVIEW_FPS).toFixed(1)}s`} color='primary' variant='outlined' />
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

export default RemotionDemoPage
