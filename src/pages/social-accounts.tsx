import { useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'

type SocialAccountFieldSchema = {
  key: string
  label: string
  type: 'text' | 'password' | 'url' | 'textarea' | 'datetime-local'
  required?: boolean
  placeholder?: string
  rows?: number
}

type SocialAccountPlatformSchema = {
  platform: string
  label: string
  description: string
  fields: SocialAccountFieldSchema[]
}

type SocialAccountSchemaResponse = {
  platforms: SocialAccountPlatformSchema[]
}

type SocialAccountRow = {
  id: number
  user_id: number
  platform: string
  account_label: string
  is_connected: boolean
  connection_data?: Record<string, any>
  notes?: string
  last_verified_at?: string
  created_at?: string
  updated_at?: string
}

type SocialAccountDraft = {
  accountLabel: string
  isConnected: boolean
  notes: string
  connectionData: Record<string, string>
}

const emptyDraft = (): SocialAccountDraft => ({
  accountLabel: '',
  isConnected: false,
  notes: '',
  connectionData: {}
})

const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const pad = (input: number) => `${input}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const normalizeInputValue = (value: any, type: SocialAccountFieldSchema['type']) => {
  if (value === undefined || value === null) return ''
  if (type === 'datetime-local') return toDatetimeLocalValue(String(value))
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.join(', ')
  return JSON.stringify(value)
}

const SocialAccountsPage: NextPage = () => {
  const [schema, setSchema] = useState<SocialAccountSchemaResponse | null>(null)
  const [connections, setConnections] = useState<SocialAccountRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, SocialAccountDraft>>({})
  const [activePlatform, setActivePlatform] = useState('youtube')
  const [loading, setLoading] = useState(true)
  const [savingPlatform, setSavingPlatform] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const platformMap = useMemo(() => {
    return (schema?.platforms || []).reduce<Record<string, SocialAccountPlatformSchema>>((acc, item) => {
      acc[item.platform] = item
      return acc
    }, {})
  }, [schema])

  const buildDraft = (platformSchema: SocialAccountPlatformSchema, connection?: SocialAccountRow | null): SocialAccountDraft => {
    const nextDraft = emptyDraft()
    nextDraft.accountLabel = String(connection?.account_label || '')
    nextDraft.isConnected = Boolean(connection?.is_connected)
    nextDraft.notes = String(connection?.notes || '')
    const connectionData = connection?.connection_data && typeof connection.connection_data === 'object' ? connection.connection_data : {}

    for (const field of platformSchema.fields) {
      if (field.key === 'accountLabel' || field.key === 'notes') continue
      nextDraft.connectionData[field.key] = normalizeInputValue(connectionData[field.key], field.type)
    }

    return nextDraft
  }

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [schemaResponse, connectionsResponse] = await Promise.all([
        axiosInstance.get(ENDURL.SOCIAL_ACCOUNTS_SCHEMA),
        axiosInstance.get(ENDURL.SOCIAL_ACCOUNTS_LIST)
      ])

      const schemaData = schemaResponse.data?.data as SocialAccountSchemaResponse
      const savedConnections = (connectionsResponse.data?.data || []) as SocialAccountRow[]

      setSchema(schemaData)
      setConnections(savedConnections)

      const draftMap: Record<string, SocialAccountDraft> = {}
      for (const platformSchema of schemaData?.platforms || []) {
        const saved = savedConnections.find(item => item.platform === platformSchema.platform)
        draftMap[platformSchema.platform] = buildDraft(platformSchema, saved)
      }
      setDrafts(draftMap)

      if (schemaData?.platforms?.length && !draftMap[activePlatform]) {
        setActivePlatform(schemaData.platforms[0].platform)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load social account settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateDraft = (platform: string, patch: Partial<SocialAccountDraft>) => {
    setDrafts(prev => ({
      ...prev,
      [platform]: {
        ...(prev[platform] || emptyDraft()),
        ...patch
      }
    }))
    setError('')
    setSuccess('')
  }

  const updateConnectionField = (platform: string, key: string, value: string) => {
    setDrafts(prev => {
      const current = prev[platform] || emptyDraft()
      if (key === 'accountLabel') {
        return {
          ...prev,
          [platform]: { ...current, accountLabel: value }
        }
      }

      if (key === 'notes') {
        return {
          ...prev,
          [platform]: { ...current, notes: value }
        }
      }

      return {
        ...prev,
        [platform]: {
          ...current,
          connectionData: {
            ...(current.connectionData || {}),
            [key]: value
          }
        }
      }
    })
    setError('')
    setSuccess('')
  }

  const savePlatform = async (platform: string) => {
    const platformDraft = drafts[platform] || emptyDraft()
    const platformSchema = platformMap[platform]
    if (!platformSchema) return

    setSavingPlatform(platform)
    setError('')
    setSuccess('')
    try {
      const payload = {
        accountLabel: platformDraft.accountLabel,
        isConnected: platformDraft.isConnected,
        notes: platformDraft.notes,
        connectionData: platformDraft.connectionData
      }

      const response = await axiosInstance.put(ENDURL.SOCIAL_ACCOUNTS_ITEM.replace(':platform', platform), payload)
      const saved = response.data?.data as SocialAccountRow
      setConnections(prev => {
        const filtered = prev.filter(item => item.platform !== platform)
        return [...filtered, saved].sort((a, b) => a.platform.localeCompare(b.platform))
      })
      setDrafts(prev => ({
        ...prev,
        [platform]: buildDraft(platformSchema, saved)
      }))
      setSuccess(`${platformSchema.label} saved`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Unable to save ${platform} account`)
    } finally {
      setSavingPlatform('')
    }
  }

  const deletePlatform = async (platform: string) => {
    const platformSchema = platformMap[platform]
    if (!platformSchema) return
    setSavingPlatform(platform)
    setError('')
    setSuccess('')
    try {
      await axiosInstance.delete(ENDURL.SOCIAL_ACCOUNTS_ITEM.replace(':platform', platform))
      setConnections(prev => prev.filter(item => item.platform !== platform))
      setDrafts(prev => ({
        ...prev,
        [platform]: buildDraft(platformSchema, null)
      }))
      setSuccess(`${platformSchema.label} disconnected`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Unable to disconnect ${platform} account`)
    } finally {
      setSavingPlatform('')
    }
  }

  const renderField = (platform: string, field: SocialAccountFieldSchema) => {
    const draft = drafts[platform] || emptyDraft()
    const value =
      field.key === 'accountLabel'
        ? draft.accountLabel
        : field.key === 'notes'
        ? draft.notes
        : draft.connectionData?.[field.key] || ''

    const isTextarea = field.type === 'textarea'
    const inputType = field.type === 'password' || field.type === 'url' || field.type === 'datetime-local' ? field.type : 'text'

    return (
      <TextField
        key={`${platform}-${field.key}`}
        fullWidth
        label={field.label}
        value={value}
        required={field.required}
        type={inputType}
        multiline={isTextarea}
        rows={field.rows || 3}
        placeholder={field.placeholder}
        onChange={event => updateConnectionField(platform, field.key, event.target.value)}
        InputLabelProps={field.type === 'datetime-local' ? { shrink: true } : undefined}
      />
    )
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant='h5'>Social Accounts</Typography>
              <Typography variant='body2' color='text.secondary'>
                Link your YouTube, Instagram, and Facebook accounts here. We store the credentials/settings now so the
                posting buttons can use them later.
              </Typography>
              <Alert severity='info'>
                This page stores connection settings for later publishing. Real platform publishing still needs the
                platform OAuth/API wiring, but this is the right place to keep the account data ready.
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {error ? <Alert severity='error'>{error}</Alert> : null}
        {success ? <Alert severity='success'>{success}</Alert> : null}

        <Card>
          <CardContent>
            {loading ? (
              <Typography>Loading social account settings...</Typography>
            ) : (
              <Stack spacing={2}>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  {(schema?.platforms || []).map(platform => {
                    const connected = Boolean(connections.find(item => item.platform === platform.platform)?.is_connected)
                    return (
                      <Chip
                        key={platform.platform}
                        label={`${platform.label} ${connected ? 'Connected' : 'Not linked'}`}
                        color={connected ? 'success' : 'default'}
                        variant={activePlatform === platform.platform ? 'filled' : 'outlined'}
                        onClick={() => setActivePlatform(platform.platform)}
                      />
                    )
                  })}
                </Stack>

                <Tabs
                  value={activePlatform}
                  onChange={(_, next) => setActivePlatform(String(next))}
                  variant='scrollable'
                  scrollButtons='auto'
                >
                  {(schema?.platforms || []).map(platform => (
                    <Tab key={platform.platform} value={platform.platform} label={platform.label} />
                  ))}
                </Tabs>
              </Stack>
            )}
          </CardContent>
        </Card>

        {!loading && schema?.platforms?.length ? (
          (schema.platforms || [])
            .filter(platform => platform.platform === activePlatform)
            .map(platform => {
              const draft = drafts[platform.platform] || emptyDraft()
              const connected = Boolean(connections.find(item => item.platform === platform.platform)?.is_connected)
              return (
                <Card key={platform.platform}>
                  <CardContent>
                    <Stack spacing={3}>
                      <Stack direction='row' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={1}>
                        <Box>
                          <Typography variant='h6'>{platform.label}</Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {platform.description}
                          </Typography>
                        </Box>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                          <Chip label={connected ? 'Linked' : 'Not linked'} color={connected ? 'success' : 'default'} />
                          {draft.isConnected ? <Chip label='Enabled' color='primary' /> : <Chip label='Disabled' variant='outlined' />}
                        </Stack>
                      </Stack>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={draft.isConnected}
                            onChange={event =>
                              updateDraft(platform.platform, { isConnected: event.target.checked })
                            }
                          />
                        }
                        label='Mark this account as active for publishing'
                      />

                      <Divider />

                      <Stack spacing={2}>
                        {platform.fields.map(field => renderField(platform.platform, field))}
                      </Stack>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 3, pb: 3, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      color='error'
                      variant='outlined'
                      onClick={() => deletePlatform(platform.platform)}
                      disabled={savingPlatform === platform.platform || !connected}
                    >
                      Disconnect
                    </Button>
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      <Button variant='outlined' onClick={loadData} disabled={savingPlatform === platform.platform}>
                        Reload
                      </Button>
                      <Button
                        variant='contained'
                        onClick={() => savePlatform(platform.platform)}
                        disabled={savingPlatform === platform.platform}
                      >
                        {savingPlatform === platform.platform ? 'Saving...' : 'Save Connection'}
                      </Button>
                    </Stack>
                  </CardActions>
                </Card>
              )
            })
        ) : null}
      </Stack>
    </Box>
  )
}

export default SocialAccountsPage
