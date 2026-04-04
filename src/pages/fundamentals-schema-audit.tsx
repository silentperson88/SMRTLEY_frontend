import { useEffect, useMemo, useState } from 'react'
import type { NextPage } from 'next'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { ENDURL } from 'src/utils/constants/endurl.utils'

type AuditExample = {
  master_id?: string | null
  company?: string | null
  section?: string | null
  source_label?: string | null
  row_type?: string | null
  [key: string]: any
}

type AuditColumn = {
  key: string
  label: string
  aliases?: string[]
  source_aliases?: string[]
  count?: number
  stock_count?: number
  source_labels?: string[]
  examples?: AuditExample[]
  kind?: string
}

type AuditBucket = {
  key: string
  label: string
  table: string
  kind: string
  planned_columns: AuditColumn[]
  matched_columns: Record<string, AuditColumn>
  unmatched_rows: Record<string, AuditColumn & { source_labels?: string[] }>
  observed_child_rows?: Record<string, AuditColumn & { parent_label?: string | null; matched?: boolean }>
  matched_count?: number
  unmatched_count?: number
  total_rows_seen?: number
}

type SchemaAudit = {
  generated_at: string | null
  updated_at: string | null
  totals: {
    snapshots_scanned: number
    matched_rows: number
    unmatched_rows: number
  }
  tables: Record<string, AuditBucket>
}

const STORAGE_KEY = 'run4dream-fundamentals-schema-audit-selection'

const emptySelection = (audit?: SchemaAudit | null) => {
  const out: Record<string, Record<string, boolean>> = {}
  if (!audit?.tables) return out
  Object.entries(audit.tables).forEach(([tableKey, bucket]) => {
    out[tableKey] = {}
    bucket.planned_columns?.forEach(column => {
      out[tableKey][column.key] = Boolean(bucket.matched_columns?.[column.key])
    })
  })
  return out
}

const FundamentalsSchemaAuditPage: NextPage = () => {
  const [audit, setAudit] = useState<SchemaAudit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState<Record<string, Record<string, boolean>>>({})
  const [savedJson, setSavedJson] = useState('')
  const [savedSql, setSavedSql] = useState('')
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [finalizeError, setFinalizeError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get(ENDURL.FUNDAMENTAL_SCHEMA_AUDIT)
        const payload = (response?.data?.data?.data || response?.data?.data) as SchemaAudit | undefined
        if (!payload) {
          throw new Error('Audit payload not found')
        }
        setAudit(payload)
        setSelection(prev => {
          const defaults = emptySelection(payload)
          if (!Object.keys(prev).length) return defaults
          const merged: Record<string, Record<string, boolean>> = { ...defaults }
          Object.entries(prev).forEach(([tableKey, tableSelection]) => {
            merged[tableKey] = {
              ...(merged[tableKey] || {}),
              ...tableSelection
            }
          })
          return merged
        })
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load schema audit')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!selection || !Object.keys(selection).length) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
    } catch {
      // ignore storage issues
    }
  }, [selection])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      setSelection(prev => ({ ...parsed, ...prev }))
    } catch {
      // ignore broken cache
    }
  }, [])

  const tableEntries = useMemo(() => Object.entries(audit?.tables || {}), [audit])

  const toggleColumn = (tableKey: string, columnKey: string) => {
    setSelection(prev => ({
      ...prev,
      [tableKey]: {
        ...(prev[tableKey] || {}),
        [columnKey]: !Boolean(prev[tableKey]?.[columnKey])
      }
    }))
  }

  const handleFinalize = async () => {
    if (!audit) return
    const payload = {
      selected_tables: Object.fromEntries(
        Object.entries(selection).map(([tableKey, cols]) => [
          tableKey,
          Object.entries(cols)
            .filter(([, selected]) => selected)
            .map(([columnKey]) => columnKey)
        ])
      )
    }

    try {
      setFinalizeLoading(true)
      setFinalizeError('')
      const response = await axiosInstance.post(ENDURL.FUNDAMENTAL_SCHEMA_AUDIT_FINALIZE, payload)
      const finalized = response?.data?.data?.data || response?.data?.data
      const sqlText = response?.data?.data?.sql || response?.data?.sql || ''
      setSavedJson(JSON.stringify(finalized, null, 2))
      setSavedSql(sqlText)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
      } catch {
        // ignore
      }
    } catch (err: any) {
      setFinalizeError(err?.response?.data?.message || err?.message || 'Failed to finalize selection')
    } finally {
      setFinalizeLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h4'>Fundamentals Schema Audit</Typography>
              <Typography variant='body2' color='text.secondary'>
                Review which columns should become structured database fields. Unmatched rows are tracked separately so we can decide
                what to ignore or model later.
              </Typography>
              {loading ? <CircularProgress size={22} /> : null}
              {error ? <Alert severity='error'>{error}</Alert> : null}
              {finalizeError ? <Alert severity='error'>{finalizeError}</Alert> : null}
              {audit ? (
                <Stack direction='row' spacing={2} flexWrap='wrap'>
                  <Chip label={`Snapshots: ${audit.totals.snapshots_scanned}`} color='primary' />
                  <Chip label={`Matched: ${audit.totals.matched_rows}`} color='success' />
                  <Chip label={`Unmatched: ${audit.totals.unmatched_rows}`} color='warning' />
                  <Chip label={`Generated: ${audit.generated_at || '-'}`} variant='outlined' />
                </Stack>
              ) : null}
              <Stack direction='row' spacing={2}>
                <Button variant='contained' onClick={handleFinalize} disabled={!audit || finalizeLoading}>
                  {finalizeLoading ? 'Finalizing...' : 'Finalize Selection'}
                </Button>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      setSelection(emptySelection(audit))
                      setSavedJson('')
                      setSavedSql('')
                    }}
                    disabled={!audit}
                  >
                    Reset To Matched
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {tableEntries.map(([tableKey, bucket]) => {
        const tableSelection = selection[tableKey] || {}
        const selectedCount = Object.values(tableSelection).filter(Boolean).length
        const plannedCount = bucket.planned_columns?.length || 0
        return (
          <Grid key={tableKey} item xs={12}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap'>
                    <Typography variant='h5'>{bucket.label}</Typography>
                    <Chip label={bucket.table} size='small' />
                    <Chip label={`Planned: ${plannedCount}`} size='small' color='primary' />
                    <Chip label={`Selected: ${selectedCount}`} size='small' color='success' />
                    <Chip label={`Matched rows: ${bucket.matched_count || 0}`} size='small' color='info' />
                    <Chip label={`Unmatched rows: ${bucket.unmatched_count || 0}`} size='small' color='warning' />
                  </Stack>

                  <Divider />

                  <Typography variant='subtitle1'>Columns</Typography>
                  <Grid container spacing={2}>
                    {bucket.planned_columns?.map(column => {
                      const matched = Boolean(bucket.matched_columns?.[column.key])
                      const checked = Boolean(tableSelection[column.key])
                      const matchedColumn = bucket.matched_columns?.[column.key]
                      return (
                        <Grid key={column.key} item xs={12} md={6} lg={4}>
                          <Card variant='outlined' sx={{ height: '100%' }}>
                            <CardContent>
                              <Stack spacing={1}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={checked}
                                      onChange={() => toggleColumn(tableKey, column.key)}
                                    />
                                  }
                                  label={
                                    <Stack>
                                      <Typography variant='subtitle2'>{column.label}</Typography>
                                      <Typography variant='caption' color='text.secondary'>
                                        {column.key}
                                      </Typography>
                                    </Stack>
                                  }
                                />
                                <Stack direction='row' spacing={1} flexWrap='wrap'>
                                  <Chip label={matched ? 'Matched' : 'Not matched'} color={matched ? 'success' : 'default'} size='small' />
                                  {matchedColumn?.source_labels?.length ? (
                                    <Chip label={`Sources: ${matchedColumn.source_labels.join(', ')}`} size='small' variant='outlined' />
                                  ) : null}
                                </Stack>
                                {matchedColumn?.examples?.length ? (
                                  <Typography variant='caption' color='text.secondary'>
                                    Example: {matchedColumn.examples[0]?.company || '-'} /{' '}
                                    {matchedColumn.examples[0]?.source_label || '-'}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      )
                    })}
                  </Grid>

                  {Object.keys(bucket.unmatched_rows || {}).length ? (
                    <>
                      <Divider />
                      <Typography variant='subtitle1'>Unmatched Rows</Typography>
                      <Stack spacing={1}>
                        {Object.values(bucket.unmatched_rows || {}).map((row, index) => (
                          <Card key={`${tableKey}-unmatched-${index}`} variant='outlined'>
                            <CardContent sx={{ py: 2 }}>
                              <Stack spacing={1}>
                                <Typography variant='body2'>{row.label || '-'}</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Examples: {(row.examples || []).map(example => example.source_label).filter(Boolean).join(', ') || '-'}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </>
                  ) : null}

                  {tableKey === 'shareholdings' && Object.keys(bucket.observed_child_rows || {}).length ? (
                    <>
                      <Divider />
                      <Typography variant='subtitle1'>Observed Shareholding Children</Typography>
                      <Stack spacing={1}>
                        {Object.values(bucket.observed_child_rows || {}).map((child, index) => (
                          <Card key={`${tableKey}-child-${index}`} variant='outlined'>
                            <CardContent sx={{ py: 2 }}>
                              <Stack spacing={1}>
                                <Typography variant='body2'>{child.label || '-'}</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Parent: {child.parent_label || '-'}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )
      })}

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h5'>Finalized Selection Preview</Typography>
              <Typography variant='body2' color='text.secondary'>
                This is the local selection snapshot for the next migration step.
              </Typography>
              <Card variant='outlined'>
                <CardContent>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {savedJson || 'Click "Finalize Selection" to save the current choices here.'}
                  </pre>
                </CardContent>
              </Card>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h5'>Generated SQL</Typography>
              <Typography variant='body2' color='text.secondary'>
                This SQL file is generated from the selected columns and excludes unmatched rows.
              </Typography>
              <Card variant='outlined'>
                <CardContent>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {savedSql || 'Finalize selection to generate the SQL preview here.'}
                  </pre>
                </CardContent>
              </Card>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default FundamentalsSchemaAuditPage
