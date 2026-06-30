import { useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'

type FastRenderJob = {
  id: string
  title?: string
  status: string
  phase?: string
  progress?: number
  estimatedRenderSeconds?: number
  fileName?: string
  videoUrl?: string
  createdAt?: string
  finishedAt?: string | null
  error?: string | null
}

const POLL_MS = 5000

const FastRenderJobsPage: NextPage = () => {
  const router = useRouter()
  const focusJobId = String(router.query?.jobId || '').trim()
  const [jobs, setJobs] = useState<FastRenderJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadJobs = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError('')
      const res = await axiosInstance.get(ENDURL.NEWS_CONTENT_VIDEOS_FAST_GPU_LIST, {
        params: { scope: 'all' }
      })
      const rows = Array.isArray(res?.data?.data) ? res.data.data : []
      setJobs(rows)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch fast render jobs')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs(false)
    const timer = setInterval(() => {
      loadJobs(true)
    }, POLL_MS)
    
return () => clearInterval(timer)
  }, [])

  const inProgressJobs = useMemo(
    () => jobs.filter(job => ['queued', 'preparing', 'rendering', 'encoding'].includes(String(job.status || ''))),
    [jobs]
  )
  const finishedJobs = useMemo(
    () => jobs.filter(job => !['queued', 'preparing', 'rendering', 'encoding'].includes(String(job.status || ''))),
    [jobs]
  )

  const getChipColor = (status: string) => {
    if (status === 'completed') return 'success'
    if (status === 'failed') return 'error'
    if (status === 'queued') return 'warning'
    
return 'primary'
  }

  const openVideo = (fileName?: string) => {
    if (!fileName) return
    const apiBase = String(process.env.NEXT_PUBLIC_API_BASE_URL || '').trim()
    const url = ENDURL.NEWS_CONTENT_VIDEOS_RENDERED.replace(':fileName', fileName)
    const resolved = url.startsWith('http') ? url : `${apiBase}/${url}`
    window.open(resolved, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardContent>
        <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
          <Typography variant='h5'>Fast GPU Render Jobs</Typography>
          <Stack direction='row' spacing={1}>
            <Button variant='outlined' onClick={() => loadJobs(false)}>
              Refresh
            </Button>
            <Button variant='outlined' onClick={() => router.back()}>
              Back
            </Button>
          </Stack>
        </Stack>

        {focusJobId ? (
          <Alert sx={{ mb: 2 }} severity='info'>
            Focus job: {focusJobId}
          </Alert>
        ) : null}
        {error ? <Alert sx={{ mb: 2 }} severity='error'>{error}</Alert> : null}
        {loading ? (
          <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
            <CircularProgress size={18} />
            <Typography variant='body2'>Loading jobs...</Typography>
          </Stack>
        ) : null}

        <Typography variant='h6' sx={{ mb: 1 }}>
          In Progress ({inProgressJobs.length})
        </Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Phase</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inProgressJobs.length ? (
                inProgressJobs.map(job => (
                  <TableRow key={job.id} selected={job.id === focusJobId}>
                    <TableCell>{job.title || '-'}</TableCell>
                    <TableCell>
                      <Chip size='small' label={job.status} color={getChipColor(job.status) as any} />
                    </TableCell>
                    <TableCell>{Math.max(0, Number(job.progress || 0))}%</TableCell>
                    <TableCell>{job.phase || '-'}</TableCell>
                    <TableCell>{job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No jobs in progress.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant='h6' sx={{ mb: 1 }}>
          Recent Jobs
        </Typography>
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Finished</TableCell>
                <TableCell align='right'>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {finishedJobs.length ? (
                finishedJobs.slice(0, 50).map(job => (
                  <TableRow key={job.id} selected={job.id === focusJobId}>
                    <TableCell>{job.title || '-'}</TableCell>
                    <TableCell>
                      <Chip size='small' label={job.status} color={getChipColor(job.status) as any} />
                    </TableCell>
                    <TableCell>{Math.max(0, Number(job.progress || 0))}%</TableCell>
                    <TableCell>{job.finishedAt ? new Date(job.finishedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell align='right'>
                      {job.status === 'completed' && job.fileName ? (
                        <Button size='small' variant='contained' onClick={() => openVideo(job.fileName)}>
                          Download
                        </Button>
                      ) : (
                        <Typography variant='caption' color={job.status === 'failed' ? 'error' : 'text.secondary'}>
                          {job.error || '-'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No finished jobs yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default FastRenderJobsPage
