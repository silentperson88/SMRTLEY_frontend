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

type OllamaChatApiData = {
  model?: string
  response?: string
}

type OllamaChatApiResponse = {
  data?: OllamaChatApiData
}

const OllamaChatPage = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [model, setModel] = useState('gemma3:1b')

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  const sendPrompt = async (event: FormEvent) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    }

    setInput('')
    setError('')
    setLoading(true)
    setMessages(prev => [...prev, userMessage])

    try {
      const res = await axiosInstance.post<OllamaChatApiResponse>(ENDURL.OLLAMA_CHAT, {
        text,
        model: model.trim() || undefined
      })

      const answer = String(res.data?.data?.response || '').trim()
      const answerModel = String(res.data?.data?.model || '').trim()

      if (!answer) {
        throw new Error('Empty response from model')
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer
      }

      setMessages(prev => [...prev, assistantMessage])
      if (answerModel) setModel(answerModel)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to get response from Ollama')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          Ollama Chat
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Simple local chat with your backend endpoint and local Ollama model.
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
                  bgcolor: 'background.default'
                }}
              >
                {messages.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    No messages yet. Ask anything to start.
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
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        <Typography variant='caption' sx={{ opacity: 0.8 }}>
                          {message.role === 'user' ? 'You' : 'Model'}
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
                    label='Model'
                    value={model}
                    onChange={event => setModel(event.target.value)}
                    placeholder='gemma3:1b'
                    fullWidth
                  />
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
              <Chip label={`Current model: ${model || 'gemma3:1b'}`} color='primary' variant='outlined' />
              <Typography variant='body2' color='text.secondary'>
                Endpoint: <strong>{ENDURL.OLLAMA_CHAT}</strong>
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                This page sends your text to `user-backend`, and backend forwards it to local Ollama.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default OllamaChatPage
