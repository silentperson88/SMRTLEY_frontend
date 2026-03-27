import { useMemo, useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'

type LanguageCode = 'en' | 'hi'

type GenerateAudioResponse = {
  fileName: string
  language: LanguageCode
  model: string
  audioUrl: string
  appliedTuning?: {
    speed?: number
    noiseScale?: number
    noiseW?: number
    sentencePause?: number
  }
  appliedOptions?: {
    normalizeText?: boolean
    splitSentences?: boolean
  }
}

type AudioHistoryItem = {
  id: string
  fileName: string
  createdAt: string
  audioSrc: string
  language: LanguageCode
  model: string
  speed: number
  noiseScale: number
  noiseW: number
  sentencePause: number
  normalizeText: boolean
  splitSentences: boolean
  previewText: string
}

const modelOptions: Record<LanguageCode, { value: string; label: string }[]> = {
  en: [{ value: 'lessac', label: 'lessac' }],
  hi: [{ value: 'paratham', label: 'paratham' }]
}

const exampleText: Record<LanguageCode, string> = {
  en: 'Hello traders. The market opened strong today with buying interest in technology and banking stocks.',
  hi: 'नमस्कार दोस्तों। आज बाजार में बैंकिंग और आईटी शेयरों में अच्छी तेजी देखने को मिली।'
}

const TtsAudioDemoPage = () => {
  const [language, setLanguage] = useState<LanguageCode>('en')
  const [model, setModel] = useState<string>('lessac')
  const [text, setText] = useState<string>(exampleText.en)
  const [audioSrc, setAudioSrc] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [speed, setSpeed] = useState<number>(1.0)
  const [noiseScale, setNoiseScale] = useState<number>(0.62)
  const [noiseW, setNoiseW] = useState<number>(0.8)
  const [sentencePause, setSentencePause] = useState<number>(0.28)
  const [normalizeText, setNormalizeText] = useState<boolean>(true)
  const [splitSentences, setSplitSentences] = useState<boolean>(false)
  const [history, setHistory] = useState<AudioHistoryItem[]>([])

  const models = useMemo(() => modelOptions[language], [language])

  const onLanguageChange = (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage)
    const nextModel = modelOptions[nextLanguage][0].value
    setModel(nextModel)
    setText(exampleText[nextLanguage])
    setAudioSrc('')
    setError('')
  }

  const onGenerate = async () => {
    try {
      setLoading(true)
      setError('')

      const payload = {
        language,
        model,
        text: text.trim(),
        speed,
        noiseScale,
        noiseW,
        sentencePause,
        normalizeText,
        splitSentences
      }

      const res = await axiosInstance.post<{ data: GenerateAudioResponse }>(ENDURL.GENERATE_TTS_AUDIO, payload, {
        timeout: 8 * 60 * 1000
      })
      const audioUrl = res.data?.data?.audioUrl

      if (!audioUrl) {
        throw new Error('Audio URL missing in response')
      }

      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || String(axiosInstance.defaults.baseURL || '')).replace(
        /\/+$/,
        ''
      )
      const normalizedAudioPath = audioUrl.startsWith('/') ? audioUrl : `/${audioUrl}`
      const finalAudioSrc = `${baseUrl}${normalizedAudioPath}`
      setAudioSrc(finalAudioSrc)

      const appliedTuning = res.data?.data?.appliedTuning || {}
      const appliedOptions = res.data?.data?.appliedOptions || {}
      const newItem: AudioHistoryItem = {
        id: `${Date.now()}-${res.data?.data?.fileName || 'audio'}`,
        fileName: res.data?.data?.fileName || 'unknown.wav',
        createdAt: new Date().toLocaleString(),
        audioSrc: finalAudioSrc,
        language,
        model,
        speed: Number(appliedTuning.speed ?? speed),
        noiseScale: Number(appliedTuning.noiseScale ?? noiseScale),
        noiseW: Number(appliedTuning.noiseW ?? noiseW),
        sentencePause: Number(appliedTuning.sentencePause ?? sentencePause),
        normalizeText: Boolean(appliedOptions.normalizeText ?? normalizeText),
        splitSentences: Boolean(appliedOptions.splitSentences ?? splitSentences),
        previewText: text.trim().slice(0, 120)
      }

      setHistory(prev => [newItem, ...prev].slice(0, 20))
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message
      setError(apiMessage || err?.message || 'Failed to generate audio')
      setAudioSrc('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          Piper TTS Audio Generator
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Paste text, choose language + model, generate WAV from user-backend and play instantly.
        </Typography>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id='language-select-label'>Language</InputLabel>
                  <Select
                    labelId='language-select-label'
                    value={language}
                    label='Language'
                    onChange={event => onLanguageChange(event.target.value as LanguageCode)}
                  >
                    <MenuItem value='en'>English</MenuItem>
                    <MenuItem value='hi'>Hindi</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id='model-select-label'>Model</InputLabel>
                  <Select
                    labelId='model-select-label'
                    value={model}
                    label='Model'
                    onChange={event => setModel(event.target.value)}
                  >
                    {models.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label='Input Text'
                multiline
                minRows={6}
                value={text}
                onChange={event => setText(event.target.value)}
                placeholder='Paste your script here...'
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type='number'
                  label='Speed'
                  inputProps={{ step: 0.01, min: 0.75, max: 1.35 }}
                  value={speed}
                  onChange={event => setSpeed(Number(event.target.value))}
                />
                <TextField
                  fullWidth
                  type='number'
                  label='Noise Scale'
                  inputProps={{ step: 0.01, min: 0.1, max: 1.3 }}
                  value={noiseScale}
                  onChange={event => setNoiseScale(Number(event.target.value))}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type='number'
                  label='Noise W'
                  inputProps={{ step: 0.01, min: 0.1, max: 1.3 }}
                  value={noiseW}
                  onChange={event => setNoiseW(Number(event.target.value))}
                />
                <TextField
                  fullWidth
                  type='number'
                  label='Sentence Pause (sec)'
                  inputProps={{ step: 0.01, min: 0, max: 1.2 }}
                  value={sentencePause}
                  onChange={event => setSentencePause(Number(event.target.value))}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <FormControlLabel
                  control={<Checkbox checked={normalizeText} onChange={event => setNormalizeText(event.target.checked)} />}
                  label='Normalize text (symbols, spacing)'
                />
                <FormControlLabel
                  control={<Checkbox checked={splitSentences} onChange={event => setSplitSentences(event.target.checked)} />}
                  label='Split by sentences for smoother pacing'
                />
              </Stack>

              <Box>
                <Button variant='contained' onClick={onGenerate} disabled={loading || text.trim().length < 10}>
                  {loading ? (
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <CircularProgress size={18} color='inherit' />
                      <span>Generating</span>
                    </Stack>
                  ) : (
                    'Generate Audio'
                  )}
                </Button>
              </Box>

              {error ? <Alert severity='error'>{error}</Alert> : null}

              {audioSrc ? (
                <Box>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Generated Audio
                  </Typography>
                  <audio controls src={audioSrc} style={{ width: '100%' }} />
                </Box>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='h6'>Compare Generated Audios</Typography>
                <Button size='small' color='secondary' onClick={() => setHistory([])} disabled={history.length === 0}>
                  Clear
                </Button>
              </Stack>

              {history.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>
                  Generate multiple clips to compare them here.
                </Typography>
              ) : null}

              {history.map(item => (
                <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant='subtitle2'>{item.fileName}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {item.createdAt}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {item.language.toUpperCase()} | {item.model} | spd {item.speed.toFixed(2)} | ns {item.noiseScale.toFixed(2)} |
                      nw {item.noiseW.toFixed(2)} | pause {item.sentencePause.toFixed(2)}s
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      normalize: {item.normalizeText ? 'on' : 'off'} | split: {item.splitSentences ? 'on' : 'off'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {item.previewText}
                    </Typography>
                    <audio controls src={item.audioSrc} style={{ width: '100%' }} />
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => {
                        setLanguage(item.language)
                        setModel(item.model)
                        setSpeed(item.speed)
                        setNoiseScale(item.noiseScale)
                        setNoiseW(item.noiseW)
                        setSentencePause(item.sentencePause)
                        setNormalizeText(item.normalizeText)
                        setSplitSentences(item.splitSentences)
                        setAudioSrc(item.audioSrc)
                      }}
                    >
                      Use This Setup
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TtsAudioDemoPage
