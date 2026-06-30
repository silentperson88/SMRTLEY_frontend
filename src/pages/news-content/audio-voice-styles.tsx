import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { NextPage } from 'next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'

type VoiceStyle =
  | 'male_deep'
  | 'female_bright'
  | 'cartoon'
  | 'robotic'
  | 'angry'
  | 'sad'
  | 'energetic'
  | 'news_anchor'

type OutputFormat = 'mp3' | 'wav'
type NoiseType = 'none' | 'room' | 'hiss' | 'white' | 'vinyl'

type VoiceStyleConfig = {
  volumeDb: number
  speed: number
  pitchSemitones: number
  normalize: boolean
  compress: boolean
  noiseType: NoiseType
  noiseLevelDb: number
  reverb: boolean
  reverbAmount: number
  echo: boolean
  echoDelayMs: number
  echoDecay: number
  lowpassHz: number
  highpassHz: number
  fadeInSec: number
  fadeOutSec: number
  reverse: boolean
}

const apiBase = String(process.env.NEXT_PUBLIC_API_BASE_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, '')

const styleDescriptions: Record<VoiceStyle, string> = {
  male_deep: 'Lower, fuller voice feel. Good for heavier narration.',
  female_bright: 'Brighter and slightly higher voice feel.',
  cartoon: 'Stylized, playful voice approximation.',
  robotic: 'Tighter, flatter, synthetic-style voice.',
  angry: 'Sharper and more forceful delivery.',
  sad: 'Softer, slower, more emotional voice feel.',
  energetic: 'Faster, punchier delivery.',
  news_anchor: 'Controlled, balanced, newsroom-style voice.'
}

const styleDefaults: Record<VoiceStyle, VoiceStyleConfig> = {
  male_deep: {
    volumeDb: 0,
    speed: 0.98,
    pitchSemitones: -4,
    normalize: true,
    compress: true,
    noiseType: 'none',
    noiseLevelDb: -36,
    reverb: false,
    reverbAmount: 0.12,
    echo: false,
    echoDelayMs: 110,
    echoDecay: 0.12,
    lowpassHz: 11500,
    highpassHz: 70,
    fadeInSec: 0.04,
    fadeOutSec: 0.06,
    reverse: false
  },
  female_bright: {
    volumeDb: 0,
    speed: 1.02,
    pitchSemitones: 4,
    normalize: true,
    compress: true,
    noiseType: 'none',
    noiseLevelDb: -36,
    reverb: false,
    reverbAmount: 0.12,
    echo: false,
    echoDelayMs: 110,
    echoDecay: 0.12,
    lowpassHz: 14500,
    highpassHz: 90,
    fadeInSec: 0.03,
    fadeOutSec: 0.05,
    reverse: false
  },
  cartoon: {
    volumeDb: 1,
    speed: 1.08,
    pitchSemitones: 6,
    normalize: true,
    compress: false,
    noiseType: 'none',
    noiseLevelDb: -36,
    reverb: false,
    reverbAmount: 0.08,
    echo: false,
    echoDelayMs: 95,
    echoDecay: 0.1,
    lowpassHz: 13500,
    highpassHz: 120,
    fadeInSec: 0.02,
    fadeOutSec: 0.04,
    reverse: false
  },
  robotic: {
    volumeDb: 0,
    speed: 1,
    pitchSemitones: 0,
    normalize: true,
    compress: true,
    noiseType: 'none',
    noiseLevelDb: -36,
    reverb: false,
    reverbAmount: 0,
    echo: false,
    echoDelayMs: 90,
    echoDecay: 0.08,
    lowpassHz: 6200,
    highpassHz: 220,
    fadeInSec: 0.02,
    fadeOutSec: 0.04,
    reverse: false
  },
  angry: {
    volumeDb: 2,
    speed: 1.05,
    pitchSemitones: 1,
    normalize: true,
    compress: true,
    noiseType: 'none',
    noiseLevelDb: -36,
    reverb: false,
    reverbAmount: 0.1,
    echo: false,
    echoDelayMs: 105,
    echoDecay: 0.1,
    lowpassHz: 14000,
    highpassHz: 85,
    fadeInSec: 0.02,
    fadeOutSec: 0.04,
    reverse: false
  },
  sad: {
    volumeDb: -1,
    speed: 0.94,
    pitchSemitones: -1,
    normalize: true,
    compress: false,
    noiseType: 'room',
    noiseLevelDb: -40,
    reverb: true,
    reverbAmount: 0.12,
    echo: false,
    echoDelayMs: 110,
    echoDecay: 0.12,
    lowpassHz: 10500,
    highpassHz: 70,
    fadeInSec: 0.08,
    fadeOutSec: 0.1,
    reverse: false
  },
  energetic: {
    volumeDb: 1,
    speed: 1.06,
    pitchSemitones: 1,
    normalize: true,
    compress: true,
    noiseType: 'none',
    noiseLevelDb: -36,
    reverb: false,
    reverbAmount: 0.08,
    echo: false,
    echoDelayMs: 100,
    echoDecay: 0.08,
    lowpassHz: 14500,
    highpassHz: 90,
    fadeInSec: 0.02,
    fadeOutSec: 0.04,
    reverse: false
  },
  news_anchor: {
    volumeDb: 0,
    speed: 1,
    pitchSemitones: 0,
    normalize: true,
    compress: true,
    noiseType: 'none',
    noiseLevelDb: -36,
    reverb: false,
    reverbAmount: 0.08,
    echo: false,
    echoDelayMs: 100,
    echoDecay: 0.08,
    lowpassHz: 12500,
    highpassHz: 80,
    fadeInSec: 0.02,
    fadeOutSec: 0.04,
    reverse: false
  }
}

const AudioVoiceStylesPage: NextPage = () => {
  const [fileName, setFileName] = useState('')
  const [audioDataUrl, setAudioDataUrl] = useState('')
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
  const [outputAudioUrl, setOutputAudioUrl] = useState('')
  const [outputAudioFileName, setOutputAudioFileName] = useState('')
  const [style, setStyle] = useState<VoiceStyle>('news_anchor')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3')
  const [config, setConfig] = useState<VoiceStyleConfig>(styleDefaults.news_anchor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const outputAudioSrc = useMemo(() => {
    if (!outputAudioUrl) return ''
    const normalizedPath = outputAudioUrl.startsWith('/') ? outputAudioUrl : `/${outputAudioUrl}`
    
return `${apiBase}${normalizedPath}`
  }, [outputAudioUrl])

  const setStyleProfile = (nextStyle: VoiceStyle) => {
    setStyle(nextStyle)
    setConfig(styleDefaults[nextStyle])
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError('')
    setSuccess('')
    setOutputAudioUrl('')
    setOutputAudioFileName('')

    const previewUrl = URL.createObjectURL(file)
    setAudioPreviewUrl(previewUrl)

    const reader = new FileReader()
    reader.onload = () => setAudioDataUrl(String(reader.result || ''))
    reader.onerror = () => setError('Unable to read audio file')
    reader.readAsDataURL(file)
  }

  const updateConfig = (patch: Partial<VoiceStyleConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }))
  }

  const handleProcess = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      if (!audioDataUrl) throw new Error('Please upload an audio file first')

      const payload = {
        audioDataUrl,
        fileName,
        preset: 'original',
        outputFormat,
        options: {
          ...config
        }
      }

      const res = await axiosInstance.post(ENDURL.NEWS_AUDIO_TOOLS_PROCESS, payload, {
        timeout: 10 * 60 * 1000
      })

      const processed = res?.data?.data
      if (!processed?.audioUrl) throw new Error('Processed audio URL missing in response')

      setOutputAudioUrl(processed.audioUrl)
      setOutputAudioFileName(processed.fileName || '')
      setSuccess('Voice style applied successfully.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to process audio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Stack spacing={1}>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            Voice Styles
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            This page gives you stronger, stylized voice transformations for a more male, female, cartoon, robotic, or emotional feel.
          </Typography>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        {error ? <Alert severity='error'>{error}</Alert> : null}
        {success ? <Alert severity='success'>{success}</Alert> : null}
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                  Upload Audio
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Pick a narration file or generated TTS audio and convert it into a different style.
                </Typography>
              </Stack>

              <Button variant='outlined' component='label'>
                {fileName ? 'Replace Audio' : 'Upload Audio'}
                <input hidden type='file' accept='audio/*' onChange={onFileChange} />
              </Button>

              {fileName ? (
                <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
                  Selected: {fileName}
                </Typography>
              ) : null}

              {audioPreviewUrl ? <audio controls src={audioPreviewUrl} style={{ width: '100%' }} /> : null}

              <FormControl fullWidth>
                <InputLabel id='voice-style-label'>Voice Style</InputLabel>
                <Select
                  labelId='voice-style-label'
                  value={style}
                  label='Voice Style'
                  onChange={event => setStyleProfile(event.target.value as VoiceStyle)}
                >
                  <MenuItem value='news_anchor'>News Anchor</MenuItem>
                  <MenuItem value='male_deep'>Male Deep</MenuItem>
                  <MenuItem value='female_bright'>Female Bright</MenuItem>
                  <MenuItem value='cartoon'>Cartoon</MenuItem>
                  <MenuItem value='robotic'>Robotic</MenuItem>
                  <MenuItem value='angry'>Angry</MenuItem>
                  <MenuItem value='sad'>Sad</MenuItem>
                  <MenuItem value='energetic'>Energetic</MenuItem>
                </Select>
              </FormControl>
              <Typography variant='body2' color='text.secondary'>
                {styleDescriptions[style]}
              </Typography>

              <FormControl fullWidth>
                <InputLabel id='format-label'>Output Format</InputLabel>
                <Select
                  labelId='format-label'
                  value={outputFormat}
                  label='Output Format'
                  onChange={event => setOutputFormat(event.target.value as OutputFormat)}
                >
                  <MenuItem value='mp3'>MP3</MenuItem>
                  <MenuItem value='wav'>WAV</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Stack spacing={4}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                  Style Controls
                </Typography>

                <Stack spacing={2}>
                  <Typography variant='body2'>Volume: {config.volumeDb} dB</Typography>
                  <Slider
                    value={config.volumeDb}
                    min={-24}
                    max={24}
                    step={1}
                    onChange={(_, value) => updateConfig({ volumeDb: Number(value) })}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant='body2'>Speed: {config.speed.toFixed(2)}x</Typography>
                  <Slider
                    value={config.speed}
                    min={0.75}
                    max={1.35}
                    step={0.01}
                    onChange={(_, value) => updateConfig({ speed: Number(value) })}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant='body2'>Pitch: {config.pitchSemitones} semitones</Typography>
                  <Slider
                    value={config.pitchSemitones}
                    min={-12}
                    max={12}
                    step={1}
                    onChange={(_, value) => updateConfig({ pitchSemitones: Number(value) })}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControlLabel
                    control={<Checkbox checked={config.normalize} onChange={(_, checked) => updateConfig({ normalize: checked })} />}
                    label='Normalize'
                  />
                  <FormControlLabel
                    control={<Checkbox checked={config.compress} onChange={(_, checked) => updateConfig({ compress: checked })} />}
                    label='Compress'
                  />
                  <FormControlLabel
                    control={<Checkbox checked={config.reverse} onChange={(_, checked) => updateConfig({ reverse: checked })} />}
                    label='Reverse'
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                  Tone Shaping
                </Typography>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id='noise-label'>Ambience</InputLabel>
                    <Select
                      labelId='noise-label'
                      value={config.noiseType}
                      label='Ambience'
                      onChange={event => updateConfig({ noiseType: event.target.value as NoiseType })}
                    >
                      <MenuItem value='none'>None</MenuItem>
                      <MenuItem value='room'>Room Tone</MenuItem>
                      <MenuItem value='hiss'>Hiss</MenuItem>
                      <MenuItem value='white'>White Noise</MenuItem>
                      <MenuItem value='vinyl'>Vinyl Crackle</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label='Noise Level (dB)'
                    type='number'
                    value={config.noiseLevelDb}
                    onChange={event => updateConfig({ noiseLevelDb: Number(event.target.value) })}
                    disabled={config.noiseType === 'none'}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label='Lowpass Hz'
                    type='number'
                    value={config.lowpassHz}
                    onChange={event => updateConfig({ lowpassHz: Number(event.target.value) })}
                  />
                  <TextField
                    fullWidth
                    label='Highpass Hz'
                    type='number'
                    value={config.highpassHz}
                    onChange={event => updateConfig({ highpassHz: Number(event.target.value) })}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant='body2'>Reverb Amount: {config.reverbAmount.toFixed(2)}</Typography>
                  <Slider
                    value={config.reverbAmount}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(_, value) => updateConfig({ reverbAmount: Number(value) })}
                    disabled={!config.reverb}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={config.reverb} onChange={(_, checked) => updateConfig({ reverb: checked })} />}
                    label='Add Reverb'
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant='body2'>Echo Delay: {config.echoDelayMs} ms</Typography>
                  <Slider
                    value={config.echoDelayMs}
                    min={20}
                    max={500}
                    step={5}
                    onChange={(_, value) => updateConfig({ echoDelayMs: Number(value) })}
                    disabled={!config.echo}
                  />
                  <Typography variant='body2'>Echo Decay: {config.echoDecay.toFixed(2)}</Typography>
                  <Slider
                    value={config.echoDecay}
                    min={0.05}
                    max={0.95}
                    step={0.01}
                    onChange={(_, value) => updateConfig({ echoDecay: Number(value) })}
                    disabled={!config.echo}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={config.echo} onChange={(_, checked) => updateConfig({ echo: checked })} />}
                    label='Add Echo'
                  />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label='Fade In Seconds'
                    type='number'
                    inputProps={{ min: 0, max: 30, step: 0.1 }}
                    value={config.fadeInSec}
                    onChange={event => updateConfig({ fadeInSec: Number(event.target.value) })}
                  />
                  <TextField
                    fullWidth
                    label='Fade Out Seconds'
                    type='number'
                    inputProps={{ min: 0, max: 30, step: 0.1 }}
                    value={config.fadeOutSec}
                    onChange={event => updateConfig({ fadeOutSec: Number(event.target.value) })}
                  />
                </Stack>

                <Button variant='contained' onClick={handleProcess} disabled={loading || !audioDataUrl}>
                  {loading ? 'Processing...' : 'Generate Styled Voice'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                Result
              </Typography>
              {outputAudioSrc ? (
                <Stack spacing={2}>
                  <Typography variant='body2'>
                    Generated file: {outputAudioFileName || 'Unknown'}
                  </Typography>
                  <audio controls src={outputAudioSrc} style={{ width: '100%' }} />
                  <Button variant='outlined' component='a' href={outputAudioSrc} download>
                    Download Styled Audio
                  </Button>
                </Stack>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Process an uploaded audio file to hear the styled version here.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default AudioVoiceStylesPage
