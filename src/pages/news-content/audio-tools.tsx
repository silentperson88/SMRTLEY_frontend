import { useEffect, useMemo, useState } from 'react'
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
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'

type AudioPreset =
  | 'original'
  | 'broadcast'
  | 'warm_room'
  | 'radio'
  | 'cinematic'
  | 'lofi'
  | 'noisy_tv'
  | 'clean'

type OutputFormat = 'mp3' | 'wav'
type NoiseType = 'none' | 'room' | 'hiss' | 'white' | 'vinyl'

type ProcessedAudio = {
  fileName: string
  audioUrl: string
  outputFormat: OutputFormat
  durationSec?: number
  sampleRate?: number
  options?: Record<string, any>
}

type SavedPreset = {
  id: number
  preset_name: string
  preset_config: Record<string, any>
}

const apiBase = String(process.env.NEXT_PUBLIC_API_BASE_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, '')

const presetDescriptions: Record<AudioPreset, string> = {
  original: 'No effect. Keeps the uploaded audio unchanged.',
  broadcast: 'Loud, clean newsroom style polish.',
  warm_room: 'Soft room ambience with a warm feel.',
  radio: 'Narrow band, classic radio tone.',
  cinematic: 'Dramatic, fuller, more spacious sound.',
  lofi: 'Muted, nostalgic, slightly dusty texture.',
  noisy_tv: 'Adds TV-like background noise and bandwidth cut.',
  clean: 'Voice cleanup with normalization and compression.'
}

const AudioToolsPage: NextPage = () => {
  const [fileName, setFileName] = useState('')
  const [audioDataUrl, setAudioDataUrl] = useState('')
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('')
  const [outputAudioUrl, setOutputAudioUrl] = useState('')
  const [outputAudioFileName, setOutputAudioFileName] = useState('')
  const [preset, setPreset] = useState<AudioPreset>('original')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3')
  const [volumeDb, setVolumeDb] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [pitchSemitones, setPitchSemitones] = useState(0)
  const [normalize, setNormalize] = useState(false)
  const [compress, setCompress] = useState(false)
  const [noiseType, setNoiseType] = useState<NoiseType>('none')
  const [noiseLevelDb, setNoiseLevelDb] = useState(-30)
  const [reverb, setReverb] = useState(false)
  const [reverbAmount, setReverbAmount] = useState(0.25)
  const [echo, setEcho] = useState(false)
  const [echoDelayMs, setEchoDelayMs] = useState(110)
  const [echoDecay, setEchoDecay] = useState(0.18)
  const [lowpassHz, setLowpassHz] = useState(0)
  const [highpassHz, setHighpassHz] = useState(0)
  const [fadeInSec, setFadeInSec] = useState(0)
  const [fadeOutSec, setFadeOutSec] = useState(0)
  const [reverse, setReverse] = useState(false)
  const [loading, setLoading] = useState(false)
  const [presetLoading, setPresetLoading] = useState(false)
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [savePresetName, setSavePresetName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const outputAudioSrc = useMemo(() => {
    if (!outputAudioUrl) return ''
    const normalizedPath = outputAudioUrl.startsWith('/') ? outputAudioUrl : `/${outputAudioUrl}`
    
return `${apiBase}${normalizedPath}`
  }, [outputAudioUrl])

  const buildPresetConfig = () => ({
    preset,
    outputFormat,
    volumeDb,
    speed,
    pitchSemitones,
    normalize,
    compress,
    noiseType,
    noiseLevelDb,
    reverb,
    reverbAmount,
    echo,
    echoDelayMs,
    echoDecay,
    lowpassHz,
    highpassHz,
    fadeInSec,
    fadeOutSec,
    reverse
  })

  const applyPresetConfig = (config: Record<string, any>) => {
    if (!config || typeof config !== 'object') return
    if (config.preset) setPreset(config.preset as AudioPreset)
    if (config.outputFormat) setOutputFormat(config.outputFormat as OutputFormat)
    if (config.volumeDb !== undefined) setVolumeDb(Number(config.volumeDb))
    if (config.speed !== undefined) setSpeed(Number(config.speed))
    if (config.pitchSemitones !== undefined) setPitchSemitones(Number(config.pitchSemitones))
    if (config.normalize !== undefined) setNormalize(Boolean(config.normalize))
    if (config.compress !== undefined) setCompress(Boolean(config.compress))
    if (config.noiseType) setNoiseType(config.noiseType as NoiseType)
    if (config.noiseLevelDb !== undefined) setNoiseLevelDb(Number(config.noiseLevelDb))
    if (config.reverb !== undefined) setReverb(Boolean(config.reverb))
    if (config.reverbAmount !== undefined) setReverbAmount(Number(config.reverbAmount))
    if (config.echo !== undefined) setEcho(Boolean(config.echo))
    if (config.echoDelayMs !== undefined) setEchoDelayMs(Number(config.echoDelayMs))
    if (config.echoDecay !== undefined) setEchoDecay(Number(config.echoDecay))
    if (config.lowpassHz !== undefined) setLowpassHz(Number(config.lowpassHz))
    if (config.highpassHz !== undefined) setHighpassHz(Number(config.highpassHz))
    if (config.fadeInSec !== undefined) setFadeInSec(Number(config.fadeInSec))
    if (config.fadeOutSec !== undefined) setFadeOutSec(Number(config.fadeOutSec))
    if (config.reverse !== undefined) setReverse(Boolean(config.reverse))
  }

  const loadPresets = async () => {
    try {
      setPresetLoading(true)
      const res = await axiosInstance.get(ENDURL.NEWS_AUDIO_TOOLS_PRESETS, { timeout: 60 * 1000 })
      const data = Array.isArray(res?.data?.data) ? res.data.data : []
      setSavedPresets(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load presets')
    } finally {
      setPresetLoading(false)
    }
  }

  useEffect(() => {
    loadPresets()
  }, [])

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
    reader.onload = () => {
      setAudioDataUrl(String(reader.result || ''))
    }
    reader.onerror = () => {
      setError('Unable to read audio file')
    }
    reader.readAsDataURL(file)
  }

  const handleSavePreset = async () => {
    try {
      const nextName = String(savePresetName || '').trim()
      if (!nextName) {
        throw new Error('Please enter a preset name')
      }

      setLoading(true)
      setError('')
      setSuccess('')
      const res = await axiosInstance.post(
        ENDURL.NEWS_AUDIO_TOOLS_PRESETS,
        {
          presetName: nextName,
          presetConfig: buildPresetConfig()
        },
        { timeout: 60 * 1000 }
      )
      const saved = res?.data?.data
      if (!saved?.id) {
        throw new Error('Preset save failed')
      }
      setSaveDialogOpen(false)
      setSavePresetName('')
      setSuccess(`Preset "${saved.preset_name}" saved.`)
      await loadPresets()
      setSelectedPresetId(String(saved.id))
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save preset')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadSelectedPreset = async () => {
    try {
      const presetId = String(selectedPresetId || '').trim()
      if (!presetId) {
        throw new Error('Choose a saved preset first')
      }
      const selected = savedPresets.find(item => String(item.id) === presetId)
      if (!selected) {
        throw new Error('Saved preset not found')
      }
      applyPresetConfig(selected.preset_config || {})
      setPreset(selected.preset_config?.preset || preset)
      setSuccess(`Preset "${selected.preset_name}" loaded.`)
    } catch (err: any) {
      setError(err?.message || 'Failed to load preset')
    }
  }

  const applyPreset = (nextPreset: AudioPreset) => {
    setPreset(nextPreset)

    switch (nextPreset) {
      case 'broadcast':
        setNormalize(true)
        setCompress(true)
        setNoiseType('none')
        setVolumeDb(1)
        setLowpassHz(12000)
        setHighpassHz(80)
        break
      case 'warm_room':
        setNormalize(true)
        setCompress(false)
        setNoiseType('room')
        setNoiseLevelDb(-36)
        setReverb(true)
        setReverbAmount(0.25)
        break
      case 'radio':
        setNormalize(false)
        setCompress(true)
        setNoiseType('hiss')
        setNoiseLevelDb(-30)
        setLowpassHz(3800)
        setHighpassHz(250)
        break
      case 'cinematic':
        setNormalize(true)
        setCompress(true)
        setNoiseType('none')
        setReverb(true)
        setEcho(true)
        setVolumeDb(2)
        break
      case 'lofi':
        setNormalize(false)
        setCompress(false)
        setNoiseType('vinyl')
        setNoiseLevelDb(-32)
        setLowpassHz(7000)
        setEcho(true)
        break
      case 'noisy_tv':
        setNormalize(true)
        setCompress(false)
        setNoiseType('white')
        setNoiseLevelDb(-24)
        setLowpassHz(5000)
        break
      case 'clean':
        setNormalize(true)
        setCompress(true)
        setNoiseType('none')
        setReverb(false)
        setEcho(false)
        setVolumeDb(0)
        setLowpassHz(0)
        setHighpassHz(0)
        break
      case 'original':
      default:
        setNormalize(false)
        setCompress(false)
        setNoiseType('none')
        setReverb(false)
        setEcho(false)
        setVolumeDb(0)
        setSpeed(1)
        setPitchSemitones(0)
        setLowpassHz(0)
        setHighpassHz(0)
        setFadeInSec(0)
        setFadeOutSec(0)
        setReverse(false)
        break
    }
  }

  const handleProcess = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      if (!audioDataUrl) {
        throw new Error('Please upload an audio file first')
      }

      const payload = {
        audioDataUrl,
        fileName,
        preset,
        outputFormat,
        options: {
          volumeDb,
          speed,
          pitchSemitones,
          normalize,
          compress,
          noiseType,
          noiseLevelDb,
          reverb,
          reverbAmount,
          echo,
          echoDelayMs,
          echoDecay,
          lowpassHz,
          highpassHz,
          fadeInSec,
          fadeOutSec,
          reverse
        }
      }

      const res = await axiosInstance.post(ENDURL.NEWS_AUDIO_TOOLS_PROCESS, payload, {
        timeout: 10 * 60 * 1000
      })
      const processed = res?.data?.data as ProcessedAudio | undefined
      if (!processed?.audioUrl) {
        throw new Error('Processed audio URL missing in response')
      }

      setOutputAudioUrl(processed.audioUrl)
      setOutputAudioFileName(processed.fileName || '')
      setSuccess('Audio processed successfully.')
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
            Audio Tools
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Upload a voice track, then clean it, remix it, add ambience, or reshape the tone into a new version.
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
                  Upload
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Choose an AI generated audio file or any narration file you want to restyle.
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

              <Divider />

              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id='preset-label'>Preset</InputLabel>
                  <Select
                    labelId='preset-label'
                    value={preset}
                    label='Preset'
                    onChange={event => applyPreset(event.target.value as AudioPreset)}
                  >
                    <MenuItem value='original'>Original</MenuItem>
                    <MenuItem value='broadcast'>Broadcast polish</MenuItem>
                    <MenuItem value='clean'>Clean voice</MenuItem>
                    <MenuItem value='warm_room'>Warm room</MenuItem>
                    <MenuItem value='radio'>Radio</MenuItem>
                    <MenuItem value='cinematic'>Cinematic</MenuItem>
                    <MenuItem value='lofi'>Lo-fi</MenuItem>
                    <MenuItem value='noisy_tv'>Noisy TV</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant='body2' color='text.secondary'>
                  {presetDescriptions[preset]}
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

              <Divider />

              <Stack spacing={2}>
                <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                  Saved Presets
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id='saved-preset-label'>Select Preset</InputLabel>
                  <Select
                    labelId='saved-preset-label'
                    value={selectedPresetId}
                    label='Select Preset'
                    onChange={event => setSelectedPresetId(String(event.target.value))}
                  >
                    <MenuItem value=''>None</MenuItem>
                    {savedPresets.map(item => (
                      <MenuItem key={item.id} value={String(item.id)}>
                        {item.preset_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction='row' spacing={2}>
                  <Button variant='outlined' onClick={loadPresets} disabled={presetLoading}>
                    {presetLoading ? 'Refreshing...' : 'Refresh Presets'}
                  </Button>
                  <Button variant='outlined' onClick={handleLoadSelectedPreset} disabled={!selectedPresetId}>
                    Load Preset
                  </Button>
                </Stack>

                <Button variant='contained' onClick={() => setSaveDialogOpen(true)}>
                  Save Current Settings
                </Button>
              </Stack>
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
                  Voice Shaping
                </Typography>

                <Stack spacing={2}>
                  <Typography variant='body2'>Volume: {volumeDb} dB</Typography>
                  <Slider
                    value={volumeDb}
                    min={-24}
                    max={24}
                    step={1}
                    onChange={(_, value) => setVolumeDb(Number(value))}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant='body2'>Speed: {speed.toFixed(2)}x</Typography>
                  <Slider
                    value={speed}
                    min={0.5}
                    max={1.75}
                    step={0.01}
                    onChange={(_, value) => setSpeed(Number(value))}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant='body2'>Pitch: {pitchSemitones} semitones</Typography>
                  <Slider
                    value={pitchSemitones}
                    min={-12}
                    max={12}
                    step={1}
                    onChange={(_, value) => setPitchSemitones(Number(value))}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControlLabel
                    control={<Checkbox checked={normalize} onChange={(_, checked) => setNormalize(checked)} />}
                    label='Normalize'
                  />
                  <FormControlLabel
                    control={<Checkbox checked={compress} onChange={(_, checked) => setCompress(checked)} />}
                    label='Compression'
                  />
                  <FormControlLabel
                    control={<Checkbox checked={reverse} onChange={(_, checked) => setReverse(checked)} />}
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
                  Noise, Ambience & Finish
                </Typography>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id='noise-label'>Ambience</InputLabel>
                    <Select
                      labelId='noise-label'
                      value={noiseType}
                      label='Ambience'
                      onChange={event => setNoiseType(event.target.value as NoiseType)}
                    >
                      <MenuItem value='none'>None</MenuItem>
                      <MenuItem value='room'>Room tone</MenuItem>
                      <MenuItem value='hiss'>Hiss</MenuItem>
                      <MenuItem value='white'>White noise</MenuItem>
                      <MenuItem value='vinyl'>Vinyl crackle</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label='Noise Level (dB)'
                    type='number'
                    value={noiseLevelDb}
                    onChange={event => setNoiseLevelDb(Number(event.target.value))}
                    disabled={noiseType === 'none'}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant='body2'>Reverb Amount: {reverbAmount.toFixed(2)}</Typography>
                  <Slider
                    value={reverbAmount}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(_, value) => setReverbAmount(Number(value))}
                    disabled={!reverb}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={reverb} onChange={(_, checked) => setReverb(checked)} />}
                    label='Add Reverb'
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant='body2'>Echo Delay: {echoDelayMs} ms</Typography>
                  <Slider
                    value={echoDelayMs}
                    min={20}
                    max={500}
                    step={5}
                    onChange={(_, value) => setEchoDelayMs(Number(value))}
                    disabled={!echo}
                  />
                  <Typography variant='body2'>Echo Decay: {echoDecay.toFixed(2)}</Typography>
                  <Slider
                    value={echoDecay}
                    min={0.05}
                    max={0.95}
                    step={0.01}
                    onChange={(_, value) => setEchoDecay(Number(value))}
                    disabled={!echo}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={echo} onChange={(_, checked) => setEcho(checked)} />}
                    label='Add Echo'
                  />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label='Lowpass Hz'
                    type='number'
                    value={lowpassHz}
                    onChange={event => setLowpassHz(Number(event.target.value))}
                  />
                  <TextField
                    fullWidth
                    label='Highpass Hz'
                    type='number'
                    value={highpassHz}
                    onChange={event => setHighpassHz(Number(event.target.value))}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label='Fade In Seconds'
                    type='number'
                    inputProps={{ min: 0, max: 30, step: 0.1 }}
                    value={fadeInSec}
                    onChange={event => setFadeInSec(Number(event.target.value))}
                  />
                  <TextField
                    fullWidth
                    label='Fade Out Seconds'
                    type='number'
                    inputProps={{ min: 0, max: 30, step: 0.1 }}
                    value={fadeOutSec}
                    onChange={event => setFadeOutSec(Number(event.target.value))}
                  />
                </Stack>

                <Button variant='contained' onClick={handleProcess} disabled={loading || !audioDataUrl}>
                  {loading ? 'Processing...' : 'Process Audio'}
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
                    Download Modified Audio
                  </Button>
                </Stack>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Process an uploaded audio file to hear the modified result here.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Save Audio Preset</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Give this audio configuration a name so you can reuse it later.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label='Preset Name'
              value={savePresetName}
              onChange={event => setSavePresetName(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSavePreset} disabled={loading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default AudioToolsPage
