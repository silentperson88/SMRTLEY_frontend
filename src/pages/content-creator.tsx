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

type CreatorChunk = {
  id: number
  heading: string
  text: string
  imagePrompt: string
  imageHint: string
  voiceStyle: string
  durationSec: number
}

const defaultScript =
  'Today we are tracking momentum in large-cap technology stocks. The market opened positive with strong buying in software names. Later in the day, financials and auto stocks joined the rally. Traders are now watching earnings guidance and global cues for tomorrow.'

const splitByAiMock = (script: string): CreatorChunk[] => {
  const sentences = script
    .split(/(?<=[.!?])\s+/)
    .map(item => item.trim())
    .filter(Boolean)

  const base = sentences.length ? sentences : [script.trim()]
  const groups: string[] = []

  for (let i = 0; i < base.length; i += 2) {
    groups.push(base.slice(i, i + 2).join(' '))
  }

  return groups.slice(0, 5).map((text, idx) => ({
    id: idx + 1,
    heading: `Scene ${idx + 1}`,
    text,
    imagePrompt: `Stock market visual for scene ${idx + 1} with clean finance style graphics`,
    imageHint: idx % 2 === 0 ? 'Use candlestick overlay with data labels' : 'Use newsroom style with market board backdrop',
    voiceStyle: idx % 2 === 0 ? 'Confident neutral narrator' : 'Fast-paced market update tone',
    durationSec: 7 + idx
  }))
}

const ContentCreatorPage: NextPage = () => {
  const [script, setScript] = useState(defaultScript)
  const [chunks, setChunks] = useState<CreatorChunk[]>([])
  const [mergeStarted, setMergeStarted] = useState(false)
  const [mergeDone, setMergeDone] = useState(false)

  const totalDuration = useMemo(() => chunks.reduce((sum, chunk) => sum + chunk.durationSec, 0), [chunks])

  const handleSplit = () => {
    const next = splitByAiMock(script)
    setChunks(next)
    setMergeStarted(false)
    setMergeDone(false)
  }

  const handleMerge = () => {
    setMergeStarted(true)
    setMergeDone(false)
    window.setTimeout(() => {
      setMergeDone(true)
      setMergeStarted(false)
    }, 1400)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          Content Creator Flow (Static Demo)
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Script to chunk pipeline with mock AI splitting, scene cards, media slots, and final merge preview.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>1) Paste Full Script</Typography>
              <TextField
                multiline
                minRows={6}
                label='Long-form script'
                value={script}
                onChange={event => setScript(event.target.value)}
                placeholder='Paste full script for short video creation...'
              />
              <Stack direction='row' spacing={2}>
                <Button variant='contained' onClick={handleSplit} disabled={!script.trim()}>
                  Split Script with AI (Mock)
                </Button>
                <Button
                  variant='outlined'
                  onClick={() => {
                    setScript(defaultScript)
                    setChunks([])
                    setMergeDone(false)
                    setMergeStarted(false)
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {chunks.length > 0 ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography variant='h6'>2) Scene Chunks (Editable)</Typography>
                <Chip label={`${chunks.length} scenes | ~${totalDuration}s`} color='primary' />
              </Stack>
              <Divider sx={{ my: 2 }} />

              <Grid container spacing={4}>
                {chunks.map(chunk => (
                  <Grid item xs={12} key={chunk.id}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Stack spacing={2}>
                          <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                            {chunk.heading}
                          </Typography>

                          <TextField multiline minRows={3} label='Chunk Text' value={chunk.text} />

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  border: '1px dashed',
                                  borderColor: 'divider',
                                  borderRadius: 1.5,
                                  p: 2,
                                  minHeight: 140,
                                  background:
                                    'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(30,64,175,0.04) 100%)'
                                }}
                              >
                                <Typography variant='subtitle2'>Image Container (Mock)</Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                  Prompt: {chunk.imagePrompt}
                                </Typography>
                                <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                                  Creative note: {chunk.imageHint}
                                </Typography>
                                <Button variant='text' size='small' sx={{ mt: 1, px: 0 }}>
                                  Regenerate Image (Mock)
                                </Button>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Box
                                sx={{
                                  border: '1px dashed',
                                  borderColor: 'divider',
                                  borderRadius: 1.5,
                                  p: 2,
                                  minHeight: 140
                                }}
                              >
                                <Typography variant='subtitle2'>Audio For This Chunk (Mock)</Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                  Voice style: {chunk.voiceStyle}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Planned duration: {chunk.durationSec} seconds
                                </Typography>
                                <Stack direction='row' spacing={1} sx={{ mt: 1.5 }}>
                                  <Button size='small' variant='outlined'>
                                    Play Preview
                                  </Button>
                                  <Button size='small' variant='text'>
                                    Replace Audio
                                  </Button>
                                </Stack>
                              </Box>
                            </Grid>
                          </Grid>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {chunks.length > 0 ? (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant='h6'>3) Merge and Final Output</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Final build order: {chunks.map(chunk => chunk.heading).join(' -> ')}
                </Typography>
                <Stack direction='row' spacing={2}>
                  <Button variant='contained' onClick={handleMerge} disabled={mergeStarted}>
                    {mergeStarted ? 'Merging...' : 'Merge All Chunks (Mock)'}
                  </Button>
                  <Button variant='outlined' disabled>
                    Export Timeline JSON (Mock)
                  </Button>
                </Stack>
                {mergeStarted ? <LinearProgress /> : null}
                {mergeDone ? (
                  <Alert severity='success'>
                    Merge complete (mock). Next step later: backend render pipeline to output final video.
                  </Alert>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : null}
    </Grid>
  )
}

export default ContentCreatorPage
