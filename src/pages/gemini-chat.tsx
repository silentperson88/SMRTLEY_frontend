import { FormEvent, useMemo, useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'

type MessageRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: MessageRole
  content: string
}

type GeminiChatApiData = {
  model?: string
  response?: string
  grounding?: {
    webSearchQueries?: string[]
    sources?: Array<{ title?: string; uri?: string }>
  }
  query?: string
  answer?: string
  found?: boolean
  sources?: string[]
  note?: string
  html?: string
}

type GeminiChatApiResponse = {
  data?: GeminiChatApiData
}

const GeminiChatPage = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resolvedModel, setResolvedModel] = useState('')
  const [groundedQuestion, setGroundedQuestion] = useState('')
  const [groundedAnswer, setGroundedAnswer] = useState('')
  const [groundedError, setGroundedError] = useState('')
  const [groundedLoading, setGroundedLoading] = useState(false)
  const [groundedModel, setGroundedModel] = useState('')
  const [groundedQueries, setGroundedQueries] = useState<string[]>([])
  const [groundedSources, setGroundedSources] = useState<Array<{ title?: string; uri?: string }>>([])
  const [scrapeQuestion, setScrapeQuestion] = useState('')
  const [scrapeAnswer, setScrapeAnswer] = useState('')
  const [scrapeError, setScrapeError] = useState('')
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [scrapeFound, setScrapeFound] = useState(false)
  const [scrapeSources, setScrapeSources] = useState<string[]>([])
  const [scrapeNote, setScrapeNote] = useState('')
  const [scrapeHtml, setScrapeHtml] = useState('')

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])
  const canAskGrounded = useMemo(
    () => groundedQuestion.trim().length > 0 && !groundedLoading,
    [groundedQuestion, groundedLoading]
  )
  const canAskScrape = useMemo(
    () => scrapeQuestion.trim().length > 0 && !scrapeLoading,
    [scrapeQuestion, scrapeLoading]
  )

  const sendPrompt = async (event: FormEvent) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    }

    const nextMessages = [...messages, userMessage]
    setInput('')
    setError('')
    setLoading(true)
    setMessages(nextMessages)

    try {
      const res = await axiosInstance.post<GeminiChatApiResponse>(ENDURL.NEWS_GEMINI_CHAT, {
        messages: nextMessages.map(message => ({
          role: message.role,
          content: message.content,
        })),
      })

      const answer = String(res.data?.data?.response || '').trim()
      const answerModel = String(res.data?.data?.model || '').trim()

      if (!answer) {
        throw new Error('Empty response from Gemini')
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer,
      }

      setMessages(prev => [...prev, assistantMessage])
      if (answerModel) setResolvedModel(answerModel)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to get response from Gemini')
    } finally {
      setLoading(false)
    }
  }

  const askScraped = async (event: FormEvent) => {
    event.preventDefault()
    const question = scrapeQuestion.trim()
    if (!question || scrapeLoading) return

    try {
      setScrapeLoading(true)
      setScrapeError('')
      setScrapeAnswer('')
      setScrapeSources([])
      setScrapeFound(false)
      setScrapeNote('')
      setScrapeHtml('')

      const res = await axiosInstance.post<GeminiChatApiResponse>(ENDURL.NEWS_GOOGLE_AI_SCRAPE_ANSWER, {
        question,
      })

      setScrapeAnswer(String(res.data?.data?.answer || '').trim())
      setScrapeSources(Array.isArray(res.data?.data?.sources) ? (res.data?.data?.sources as string[]) : [])
      setScrapeFound(Boolean(res.data?.data?.found))
      setScrapeNote(String(res.data?.data?.note || '').trim())
      setScrapeHtml(String(res.data?.data?.html || ''))
    } catch (err: any) {
      setScrapeError(err?.response?.data?.message || err?.message || 'Failed to scrape Google AI answer')
    } finally {
      setScrapeLoading(false)
    }
  }

  const askGrounded = async (event: FormEvent) => {
    event.preventDefault()
    const question = groundedQuestion.trim()
    if (!question || groundedLoading) return

    try {
      setGroundedLoading(true)
      setGroundedError('')
      setGroundedAnswer('')
      setGroundedQueries([])
      setGroundedSources([])

      const res = await axiosInstance.post<GeminiChatApiResponse>(ENDURL.NEWS_GEMINI_GROUNDED_ANSWER, {
        question,
      })

      const answer = String(res.data?.data?.response || '').trim()
      const model = String(res.data?.data?.model || '').trim()
      const grounding = res.data?.data?.grounding

      if (!answer) {
        throw new Error('Empty grounded response from Gemini')
      }

      setGroundedAnswer(answer)
      setGroundedModel(model)
      setGroundedQueries(Array.isArray(grounding?.webSearchQueries) ? grounding?.webSearchQueries : [])
      setGroundedSources(Array.isArray(grounding?.sources) ? grounding?.sources : [])
    } catch (err: any) {
      setGroundedError(err?.response?.data?.message || err?.message || 'Failed to get grounded Gemini answer')
    } finally {
      setGroundedLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          Gemini Chat
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Chat with Gemini through content-backend. It is tuned to answer briefly in a news-analysis style and the
          conversation stays only on this page until you refresh.
        </Typography>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={{ minHeight: 520 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  p: 2,
                  minHeight: 360,
                  maxHeight: 520,
                  overflowY: 'auto',
                  bgcolor: 'background.default',
                }}
              >
                {messages.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    No messages yet. Ask Gemini anything to start.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {messages.map(message => (
                      <Box
                        key={message.id}
                        sx={{
                          alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          p: 1.5,
                          borderRadius: 1.5,
                          bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                          color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                          border: message.role === 'assistant' ? '1px solid' : 'none',
                          borderColor: 'divider',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <Typography variant='caption' sx={{ opacity: 0.8 }}>
                          {message.role === 'user' ? 'You' : 'Gemini'}
                        </Typography>
                        <Typography variant='body2'>{message.content}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              <form onSubmit={sendPrompt}>
                <Stack spacing={2}>
                  <TextField
                    label='Message'
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    placeholder='Type your question...'
                    multiline
                    minRows={3}
                    fullWidth
                  />
                  <Stack direction='row' spacing={2} alignItems='center'>
                    <Button type='submit' variant='contained' disabled={!canSend}>
                      {loading ? (
                        <Stack direction='row' spacing={1} alignItems='center'>
                          <CircularProgress size={16} color='inherit' />
                          <span>Thinking</span>
                        </Stack>
                      ) : (
                        'Send'
                      )}
                    </Button>
                    <Button variant='outlined' color='secondary' onClick={() => setMessages([])} disabled={loading}>
                      Clear Chat
                    </Button>
                  </Stack>
                </Stack>
              </form>

              {error ? <Alert severity='error'>{error}</Alert> : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>Usage</Typography>
              <Divider />
              <Chip
                label={`Model: ${resolvedModel || 'Backend default (.env)'}`}
                color='primary'
                variant='outlined'
              />
              <Typography variant='body2' color='text.secondary'>
                Endpoint: <strong>{ENDURL.NEWS_GEMINI_CHAT}</strong>
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                No database writes here. We send the current chat history with each request, so the conversation continues
                until you refresh the page.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                  Grounded News Answer
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                  Ask one question and Gemini will answer using Google Search grounding instead of scraping Google results.
                </Typography>
              </Box>

              <form onSubmit={askGrounded}>
                <Stack spacing={2}>
                  <TextField
                    label='Question'
                    value={groundedQuestion}
                    onChange={event => setGroundedQuestion(event.target.value)}
                    placeholder='Why did this stock hit upper circuit today?'
                    multiline
                    minRows={3}
                    fullWidth
                  />
                  <Stack direction='row' spacing={2} alignItems='center' useFlexGap flexWrap='wrap'>
                    <Button type='submit' variant='contained' disabled={!canAskGrounded}>
                      {groundedLoading ? (
                        <Stack direction='row' spacing={1} alignItems='center'>
                          <CircularProgress size={16} color='inherit' />
                          <span>Searching</span>
                        </Stack>
                      ) : (
                        'Ask With Search'
                      )}
                    </Button>
                    <Chip
                      label={`Model: ${groundedModel || 'Needs backend env'}`}
                      color='secondary'
                      variant='outlined'
                    />
                  </Stack>
                </Stack>
              </form>

              {groundedError ? <Alert severity='error'>{groundedError}</Alert> : null}

              {groundedAnswer ? (
                <Stack spacing={2}>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      p: 2,
                      bgcolor: 'background.default',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <Typography variant='body2'>{groundedAnswer}</Typography>
                  </Box>

                  {groundedQueries.length ? (
                    <Box>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        Search Queries
                      </Typography>
                      <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                        {groundedQueries.map(query => (
                          <Chip key={query} label={query} size='small' variant='outlined' />
                        ))}
                      </Stack>
                    </Box>
                  ) : null}

                  {groundedSources.length ? (
                    <Box>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        Sources
                      </Typography>
                      <Stack spacing={1.2}>
                        {groundedSources.map((source, index) => (
                          <Box key={`${source.uri || source.title}-${index}`} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                              {source.title || source.uri || `Source ${index + 1}`}
                            </Typography>
                            {source.uri ? (
                              <Typography variant='caption' color='text.secondary'>
                                {source.uri}
                              </Typography>
                            ) : null}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                  Google AI Scrape Attempt
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                  This tries to fetch Google search HTML directly and extract the AI answer container. It is more brittle than grounded Gemini and may stop working if Google changes the page.
                </Typography>
              </Box>

              <form onSubmit={askScraped}>
                <Stack spacing={2}>
                  <TextField
                    label='Question'
                    value={scrapeQuestion}
                    onChange={event => setScrapeQuestion(event.target.value)}
                    placeholder='Why did this stock hit upper circuit today?'
                    multiline
                    minRows={3}
                    fullWidth
                  />
                  <Stack direction='row' spacing={2} alignItems='center' useFlexGap flexWrap='wrap'>
                    <Button type='submit' variant='contained' color='secondary' disabled={!canAskScrape}>
                      {scrapeLoading ? (
                        <Stack direction='row' spacing={1} alignItems='center'>
                          <CircularProgress size={16} color='inherit' />
                          <span>Scraping</span>
                        </Stack>
                      ) : (
                        'Try Google Scrape'
                      )}
                    </Button>
                    <Chip label={scrapeFound ? 'Container found' : 'No container yet'} variant='outlined' />
                  </Stack>
                </Stack>
              </form>

              {scrapeError ? <Alert severity='error'>{scrapeError}</Alert> : null}
              {scrapeNote ? <Alert severity={scrapeFound ? 'success' : 'warning'}>{scrapeNote}</Alert> : null}

              {scrapeAnswer ? (
                <Stack spacing={2}>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      p: 2,
                      bgcolor: 'background.default',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <Typography variant='body2'>{scrapeAnswer}</Typography>
                  </Box>

                  {scrapeSources.length ? (
                    <Box>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        Extracted Source Hints
                      </Typography>
                      <Stack spacing={1}>
                        {scrapeSources.map(source => (
                          <Typography key={source} variant='caption' color='text.secondary'>
                            {source}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}

                  {scrapeHtml ? (
                    <Box>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        Raw HTML
                      </Typography>
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1.5,
                          p: 2,
                          bgcolor: 'background.default',
                          maxHeight: 360,
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: 12,
                        }}
                      >
                        {scrapeHtml}
                      </Box>
                    </Box>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default GeminiChatPage
