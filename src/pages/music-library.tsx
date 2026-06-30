import { useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import OutlinedInput from '@mui/material/OutlinedInput'
import FormHelperText from '@mui/material/FormHelperText'
import { useRouter } from 'next/router'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'

const LONG_TIMEOUT_MS = 8 * 60 * 1000

type MusicCategory = {
  id: number
  category_name: string
}

type MusicTrack = {
  id: number
  title: string
  media_type?: string
  file_name: string
  original_file_name?: string
  file_url: string
  mime_type?: string
  duration_seconds?: number
  created_at?: string
  updated_at?: string
  categories?: Array<{ id: number; categoryName: string }>
}

const MusicLibraryPage: NextPage = () => {
  const router = useRouter()
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [categories, setCategories] = useState<MusicCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [defaultTitle, setDefaultTitle] = useState('')
  const [mediaType, setMediaType] = useState<'music' | 'song'>('music')
  const selectedCategories = useMemo(
    () => categories.filter(category => selectedCategoryIds.includes(category.id)),
    [categories, selectedCategoryIds],
  )
  const selectedCategoryIdSet = useMemo(() => new Set(selectedCategoryIds.map(id => Number(id))), [selectedCategoryIds])

  const apiBase = useMemo(
    () => String(process.env.NEXT_PUBLIC_API_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, ''),
    [],
  )

  const toAbsoluteUrl = (url?: string | null) => {
    const value = String(url || '').trim()
    if (!value) return ''
    if (/^https?:\/\//i.test(value)) return value
    
return `${apiBase}/${value.replace(/^\/+/, '')}`
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [trackRes, categoryRes] = await Promise.all([
        axiosInstance.get(ENDURL.NEWS_CONTENT_MUSIC_LIBRARY_TRACKS, {
          timeout: LONG_TIMEOUT_MS,
          params: {
            ...(search ? { search } : {}),
            ...(categoryId ? { categoryId } : {}),
          },
        }),
        axiosInstance.get(ENDURL.NEWS_CONTENT_MUSIC_LIBRARY_CATEGORIES, { timeout: LONG_TIMEOUT_MS }),
      ])
      setTracks(Array.isArray(trackRes?.data?.data) ? trackRes.data.data : [])
      setCategories(Array.isArray(categoryRes?.data?.data) ? categoryRes.data.data : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load music library')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const createCategory = async () => {
    try {
      if (!newCategoryName.trim()) return
      setError('')
      setUploading(true)
      await axiosInstance.post(
        ENDURL.NEWS_CONTENT_MUSIC_LIBRARY_CATEGORIES,
        { categoryName: newCategoryName.trim() },
        { timeout: LONG_TIMEOUT_MS },
      )
      setSuccess('Category created.')
      setNewCategoryName('')
      await loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create category')
    } finally {
      setUploading(false)
    }
  }

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
      reader.readAsDataURL(file)
    })

  const handleUpload = async () => {
    try {
      if (!pendingFiles.length) {
        setError('Select one or more audio files first.')
        
return
      }
      setError('')
      setSuccess('')
      setUploading(true)
      for (const file of pendingFiles) {
        const dataUrl = await readFileAsDataUrl(file)
        await axiosInstance.post(
          ENDURL.NEWS_CONTENT_MUSIC_LIBRARY_UPLOAD,
          {
            title: defaultTitle.trim() || file.name.replace(/\.[^.]+$/, ''),
            fileName: file.name,
            dataUrl,
            mediaType,
            categoryIds: selectedCategoryIds,
          },
          { timeout: LONG_TIMEOUT_MS },
        )
      }
      setSuccess(`${pendingFiles.length} music file(s) uploaded.`)
      setPendingFiles([])
      setDefaultTitle('')
      setSelectedCategoryIds([])
      setMediaType('music')
      setNewCategoryName('')
      await loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to upload music')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            Music Library
          </Typography>
          <Button variant='outlined' onClick={() => router.push('/news-content')}>
            Back to News Content
          </Button>
        </Stack>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                Upload Manual Music
              </Typography>
              <Alert severity='info'>Only manually uploaded music is stored here. Generated music stays elsewhere.</Alert>
              <TextField
                label='Default Title Prefix'
                value={defaultTitle}
                onChange={e => setDefaultTitle(e.target.value)}
                helperText='Optional. File name will be used if blank.'
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id='music-upload-media-type-label'>Type</InputLabel>
                <Select
                  labelId='music-upload-media-type-label'
                  label='Type'
                  value={mediaType}
                  onChange={e => setMediaType((e.target.value as 'music' | 'song') || 'music')}
                >
                  <MenuItem value='music'>Music</MenuItem>
                  <MenuItem value='song'>Song</MenuItem>
                </Select>
                <FormHelperText>Default is music. Choose song when the upload should be treated as a song file.</FormHelperText>
              </FormControl>
              <TextField
                label='Add New Category'
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                fullWidth
              />
              <Stack direction='row' spacing={2}>
                <Button variant='outlined' onClick={createCategory} disabled={uploading}>
                  Add Category
                </Button>
                <Button variant='outlined' component='label'>
                  Choose Audio Files
                  <input
                    hidden
                    type='file'
                    accept='audio/*'
                    multiple
                    onChange={e => setPendingFiles(Array.from(e.target.files || []))}
                  />
                </Button>
              </Stack>
              <Typography variant='body2' color='text.secondary'>
                Selected files: {pendingFiles.length ? pendingFiles.map(file => file.name).join(', ') : 'None'}
              </Typography>
              <FormControl fullWidth>
                <InputLabel id='music-upload-categories-label'>Categories</InputLabel>
                <Select
                  labelId='music-upload-categories-label'
                  multiple
                  value={selectedCategoryIds.map(String)}
                  onChange={e => {
                    const nextValue = Array.from(
                      new Set(
                        (Array.isArray(e.target.value)
                          ? e.target.value
                          : typeof e.target.value === 'string'
                            ? e.target.value.split(',')
                            : []
                        )
                          .map(item => Number(item))
                          .filter(Number.isFinite),
                      ),
                    )
                    setSelectedCategoryIds(nextValue)
                  }}
                  input={<OutlinedInput label='Categories' />}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 320,
                        width: 360,
                      },
                    },
                  }}
                  displayEmpty
                  renderValue={selected => (
                    <Stack direction='row' spacing={0.75} useFlexGap flexWrap='wrap' sx={{ minHeight: 24 }}>
                      {(selected as Array<string | number>).map(item => {
                        const id = Number(item)
                        const category = categories.find(categoryItem => Number(categoryItem.id) === id)
                        
return <Chip key={id} size='small' label={category?.category_name || String(id)} />
                      })}
                      {!selected.length ? (
                        <Typography variant='body2' color='text.secondary'>
                          Select categories
                        </Typography>
                      ) : null}
                    </Stack>
                  )}
                >
                  {categories.map(category => (
                    <MenuItem
                      key={category.id}
                      value={String(category.id)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <Checkbox checked={selectedCategoryIdSet.has(Number(category.id))} color='primary' />
                      <ListItemText primary={category.category_name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedCategories.length ? (
                <Stack direction='row' spacing={0.75} useFlexGap flexWrap='wrap'>
                  {selectedCategories.map(category => (
                    <Chip key={category.id} size='small' color='primary' label={category.category_name} />
                  ))}
                </Stack>
              ) : null}
              <Button variant='contained' onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Music'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
                <TextField
                  label='Search tracks'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  fullWidth
                />
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel id='music-library-filter-label'>Filter Category</InputLabel>
                  <Select
                    labelId='music-library-filter-label'
                    label='Filter Category'
                    value={categoryId === '' ? '' : String(categoryId)}
                    onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 320,
                          width: 300,
                        },
                      },
                    }}
                  >
                    <MenuItem value=''>All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.category_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant='outlined' onClick={loadData}>
                  Refresh
                </Button>
              </Stack>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Categories</TableCell>
                    <TableCell>Preview</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tracks.map(track => (
                    <TableRow key={track.id} hover>
                      <TableCell>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {track.title}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {track.original_file_name || track.file_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size='small' color={track.media_type === 'song' ? 'secondary' : 'primary'} label={track.media_type || 'music'} />
                      </TableCell>
                      <TableCell>
                        <Stack direction='row' spacing={0.5} useFlexGap flexWrap='wrap'>
                          {(track.categories || []).map(category => (
                            <Chip key={`${track.id}-${category.id}`} size='small' label={category.categoryName} />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 280 }}>
                        {track.file_url ? (
                          <audio controls preload='none' src={toAbsoluteUrl(track.file_url)} style={{ width: '100%' }} />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{track.created_at ? new Date(track.created_at).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {!tracks.length ? (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>
                        {loading ? 'Loading...' : 'No music tracks yet.'}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
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

export default MusicLibraryPage
