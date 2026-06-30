import { useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import { useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { mutate } from 'swr'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'
import { getErrorMessage } from 'src/api/axios/errorhandler'

type AuditRow = {
  source: string
  exchange: string
  symbol: string
  name: string
  securityCode: string | null
  fileSymbol?: string
  fileName?: string
  fileSecurityCode?: string | null
  status: string
  matched: boolean
  matchedBy: string
  activeStockId: number | null
  activeStockMasterId: number | null
  activeStockSymbol: string | null
  activeStockName: string | null
  activeStockSecurityCode: string | null
  activeSymbol?: string | null
  activeName?: string | null
  activeSecurityCode?: string | null
  token?: string | null
  ltp?: number
  open?: number
  high?: number
  low?: number
  close?: number
}

type AuditResponse = {
  summary: {
    bseActiveMatched: number
    nseActiveMatched: number
    bseDelistedInActive: number
    bseSuspendedInActive: number
    bseMasterOnly: number
    nseMasterOnly: number
    bseMissingInActive: number
    nseMissingInActive: number
    activeStockNotInFiles: number
    totalActiveStocks: number
    nseRows: number
    bseRows: number
    nseFile: string
    bseFile: string
  }
  categories: {
    bseActiveMatched: AuditRow[]
    nseActiveMatched: AuditRow[]
    bseDelistedInActive: AuditRow[]
    bseSuspendedInActive: AuditRow[]
    bseMasterOnly: AuditRow[]
    nseMasterOnly: AuditRow[]
    bseMissingInActive: AuditRow[]
    nseMissingInActive: AuditRow[]
    activeStockNotInFiles: AuditRow[]
    activeStockPriceSummary: Array<AuditRow & { ltp: number; open: number; high: number; low: number; close: number }>
  }
}

const SummaryCard = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant='overline' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='h4' sx={{ color, mt: 1, fontWeight: 700 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
)

const RowsTable = ({
  title,
  rows,
  actionKind,
  compactPriceOnly = false,
  showPrices = false,
}: {
  title: string
  rows: AuditRow[]
  actionKind?: 'inactive' | 'add'
  compactPriceOnly?: boolean
  showPrices?: boolean
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const { showSnackbar } = useSnackbar()
  const BULK_ADD_BATCH_SIZE = 50
  const BULK_INACTIVE_BATCH_SIZE = 100

  const chunkRows = (inputRows: AuditRow[], size: number) => {
    const chunks: AuditRow[][] = []
    for (let i = 0; i < inputRows.length; i += size) {
      chunks.push(inputRows.slice(i, i + size))
    }
    
return chunks
  }

  const handleRowAction = async (row: AuditRow) => {
    try {
      setIsUpdating(true)
      let response
      if (actionKind === 'inactive') {
        if (!row.activeStockId) return
        response = await axiosInstance.post(ENDURL.MARK_STOCK_UNIVERSE_ROW_INACTIVE, {
          activeStockId: row.activeStockId,
        })
      } else if (actionKind === 'add') {
        response = await axiosInstance.post(ENDURL.ADD_STOCK_FROM_AUDIT, {
          source: row.source,
          exchange: row.exchange,
          symbol: row.fileSymbol || row.symbol,
          name: row.fileName || row.name,
          securityCode: row.fileSecurityCode ?? row.securityCode,
        })
      }
      const status = response?.data?.data?.status
      if (actionKind === 'inactive') {
        showSnackbar(
          status === 'already_inactive' ? `${row.symbol} was already inactive` : `Marked ${row.symbol} inactive`,
          'success',
        )
      } else if (actionKind === 'add') {
        showSnackbar(
          status === 'already_active'
            ? `${row.symbol} is already present in active stock`
            : `Added ${row.symbol} to stock master`,
          'success',
        )
      }
      await mutate(ENDURL.GET_STOCK_UNIVERSE_AUDIT)
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkAdd = async () => {
    if (actionKind !== 'add') return

    try {
      setIsBulkUpdating(true)
      const chunks = chunkRows(rows, BULK_ADD_BATCH_SIZE)
      let created = 0
      let alreadyActive = 0
      let failed = 0

      for (const chunk of chunks) {
        const response = await axiosInstance.post(ENDURL.ADD_STOCKS_FROM_AUDIT, {
          rows: chunk,
        })
        const data = response?.data?.data
        created += Number(data?.created || 0)
        alreadyActive += Number(data?.alreadyActive || 0)
        failed += Number(data?.failed || 0)
      }

      showSnackbar(
        `Added ${created} stock(s), ${alreadyActive} already existed, ${failed} failed`,
        failed ? 'warning' : 'success',
      )
      await mutate(ENDURL.GET_STOCK_UNIVERSE_AUDIT)
      setPage(0)
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleBulkInactive = async () => {
    if (actionKind !== 'inactive') return

    const activeStockIds = Array.from(
      new Set(rows.map(row => row.activeStockId).filter((id): id is number => typeof id === 'number' && Number.isFinite(id))),
    )

    if (!activeStockIds.length) return

    const confirmed = window.confirm(
      `Mark all ${activeStockIds.length} matched stock(s) inactive? This will update stock_master only.`,
    )
    if (!confirmed) return

    try {
      setIsBulkUpdating(true)
      const chunks: number[][] = []
      for (let i = 0; i < activeStockIds.length; i += BULK_INACTIVE_BATCH_SIZE) {
        chunks.push(activeStockIds.slice(i, i + BULK_INACTIVE_BATCH_SIZE))
      }

      let updated = 0
      let matched = 0
      for (const chunk of chunks) {
        const response = await axiosInstance.post(ENDURL.MARK_STOCK_UNIVERSE_ROW_INACTIVE, {
          activeStockIds: chunk,
        })
        const data = response?.data?.data
        updated += Number(data?.updated || 0)
        matched += Number(data?.matched || 0)
      }

      showSnackbar(`Marked ${updated || matched} stock(s) inactive`, 'success')
      await mutate(ENDURL.GET_STOCK_UNIVERSE_AUDIT)
      setPage(0)
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const visibleRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Card>
      <CardHeader
        title={title}
        subheader={`${rows.length} row(s)`}
        action={
          actionKind === 'add' ? (
            <Button variant='contained' color='primary' onClick={handleBulkAdd} disabled={!rows.length || isBulkUpdating}>
              {isBulkUpdating ? 'Adding...' : `Add All (${rows.length})`}
            </Button>
          ) : actionKind === 'inactive' ? (
            <Button
              variant='contained'
              color='error'
              onClick={handleBulkInactive}
              disabled={
                !rows.some(row => typeof row.activeStockId === 'number' && Number.isFinite(row.activeStockId)) ||
                isBulkUpdating
              }
            >
              {isBulkUpdating
                ? 'Marking...'
                : `Mark All Inactive (${rows.filter(row => typeof row.activeStockId === 'number' && Number.isFinite(row.activeStockId)).length})`}
            </Button>
          ) : null
        }
      />
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table stickyHeader size='small'>
        <TableHead>
          <TableRow>
            {compactPriceOnly ? (
              <>
                <TableCell>Symbol</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Exchange</TableCell>
                <TableCell>Token</TableCell>
                <TableCell align='right'>LTP</TableCell>
                <TableCell align='right'>Open</TableCell>
                <TableCell align='right'>High</TableCell>
                <TableCell align='right'>Low</TableCell>
                <TableCell align='right'>Close</TableCell>
              </>
            ) : (
              <>
                <TableCell>Source</TableCell>
                <TableCell>Exchange</TableCell>
                <TableCell>File Symbol</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell>File Security Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Matched By</TableCell>
                <TableCell>Matched Symbol</TableCell>
                <TableCell>Matched Name</TableCell>
                <TableCell>Matched Security Code</TableCell>
                {showPrices ? (
                  <>
                    <TableCell align='right'>LTP</TableCell>
                    <TableCell align='right'>Open</TableCell>
                    <TableCell align='right'>High</TableCell>
                    <TableCell align='right'>Low</TableCell>
                    <TableCell align='right'>Close</TableCell>
                  </>
                ) : null}
              </>
            )}
            {actionKind ? <TableCell>Action</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.length ? (
            visibleRows.map((row, index) => (
              <TableRow key={`${row.source}-${row.exchange}-${row.symbol}-${index}`} hover>
                {compactPriceOnly ? (
                  <>
                    <TableCell>{row.activeSymbol || row.activeStockSymbol || row.symbol || '-'}</TableCell>
                    <TableCell>{row.activeName || row.activeStockName || row.name || '-'}</TableCell>
                    <TableCell>{row.exchange || '-'}</TableCell>
                    <TableCell>{row.activeSecurityCode || row.activeStockSecurityCode || row.securityCode || '-'}</TableCell>
                    <TableCell align='right'>{row.ltp ?? 0}</TableCell>
                    <TableCell align='right'>{row.open ?? 0}</TableCell>
                    <TableCell align='right'>{row.high ?? 0}</TableCell>
                    <TableCell align='right'>{row.low ?? 0}</TableCell>
                    <TableCell align='right'>{row.close ?? 0}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.exchange}</TableCell>
                    <TableCell>{row.fileSymbol || row.symbol || '-'}</TableCell>
                    <TableCell>{row.fileName || row.name || '-'}</TableCell>
                    <TableCell>{row.fileSecurityCode || row.securityCode || '-'}</TableCell>
                    <TableCell>
                      <Chip size='small' label={row.status} color={row.status === 'Delisted' ? 'error' : row.status === 'Suspended' ? 'warning' : 'success'} />
                    </TableCell>
                    <TableCell>{row.matchedBy || '-'}</TableCell>
                    <TableCell>{row.activeSymbol || row.activeStockSymbol || '-'}</TableCell>
                    <TableCell>{row.activeName || row.activeStockName || '-'}</TableCell>
                    <TableCell>{row.activeSecurityCode || row.activeStockSecurityCode || '-'}</TableCell>
                    {showPrices ? (
                      <>
                        <TableCell align='right'>{row.ltp ?? 0}</TableCell>
                        <TableCell align='right'>{row.open ?? 0}</TableCell>
                        <TableCell align='right'>{row.high ?? 0}</TableCell>
                        <TableCell align='right'>{row.low ?? 0}</TableCell>
                        <TableCell align='right'>{row.close ?? 0}</TableCell>
                      </>
                    ) : null}
                  </>
                )}
                {actionKind ? (
                  <TableCell>
                    <Button
                      size='small'
                      variant='contained'
                      color={actionKind === 'inactive' ? 'error' : 'primary'}
                      onClick={() => handleRowAction(row)}
                      disabled={isUpdating || (actionKind === 'inactive' && !row.activeStockId)}
                    >
                      {actionKind === 'inactive' ? 'Mark Inactive' : 'Add Stock'}
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={
                  compactPriceOnly
                    ? (actionKind ? 10 : 9)
                    : showPrices
                      ? (actionKind ? 16 : 15)
                      : (actionKind ? 11 : 10)
                }
                align='center'
              >
                No rows
              </TableCell>
            </TableRow>
          )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component='div'
        rowsPerPageOptions={[10, 25, 50]}
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={event => {
          setRowsPerPage(Number(event.target.value))
          setPage(0)
        }}
      />
    </Card>
  )
}

const PriceTable = ({
  title,
  rows,
}: {
  title: string
  rows: Array<AuditRow & { ltp: number; open: number; high: number; low: number; close: number }>
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCheckingPrice, setIsCheckingPrice] = useState(false)
  const [selectedRow, setSelectedRow] = useState<AuditRow | null>(null)
  const [checkedPrice, setCheckedPrice] = useState<any>(null)
  const [editForm, setEditForm] = useState({ exchange: 'NSE', token: '' })
  const [draftOnlySamePrice, setDraftOnlySamePrice] = useState(false)
  const [draftLtpThreshold, setDraftLtpThreshold] = useState('')
  const [draftSymbolPattern, setDraftSymbolPattern] = useState('any')
  const [protectedIds, setProtectedIds] = useState<number[]>([])
  const [draftMinValues, setDraftMinValues] = useState({
    ltp: '',
    open: '',
    high: '',
    low: '',
    close: ''
  })
  const [appliedMinValues, setAppliedMinValues] = useState({
    ltp: '',
    open: '',
    high: '',
    low: '',
    close: ''
  })
  const [appliedOnlySamePrice, setAppliedOnlySamePrice] = useState(false)
  const [appliedLtpThreshold, setAppliedLtpThreshold] = useState('')
  const [appliedSymbolPattern, setAppliedSymbolPattern] = useState('any')
  const { showSnackbar } = useSnackbar()
  const normalizeId = (value: unknown) => {
    const num = Number(value)
    
return Number.isFinite(num) && num > 0 ? num : null
  }

  const symbolMatchesPattern = (symbol: string, pattern: string) => {
    const raw = String(symbol || '').trim().toUpperCase()
    const key = String(pattern || '').trim().toLowerCase()
    if (!key || key === 'any') return true

    const endsWith = (...suffixes: string[]) => suffixes.some(suffix => raw.endsWith(suffix))

    switch (key) {
      case 'suffix-be':
        return endsWith('-BE', ' BE')
      case 'suffix-bl':
        return endsWith('-BL', ' BL')
      case 'suffix-il':
        return endsWith('-IL', ' IL')
      case 'suffix-iq':
        return endsWith('-IQ', ' IQ')
      case 'suffix-iv':
        return endsWith('-IV', ' IV')
      case 'suffix-gr':
        return endsWith('GR', '-GR', ' GR')
      case 'prefix-sgb':
        return raw.startsWith('SGB')
      case 'suffix-gb':
        return endsWith('GB', '-GB', ' GB')
      case 'suffix-n1n2':
        return endsWith('N1', 'N2', '-N1', '-N2', ' N1', ' N2')
      case 'suffix-pp':
        return endsWith('PP', '-PP', ' PP')
      case 'suffix-rs':
        return endsWith('RS', '-RS', ' RS')
      case 'suffix-sm':
        return endsWith('SM', '-SM', ' SM')
      case 'contains-niftysensex':
        return raw.includes('NIFTY') || raw.includes('SENSEX')
      default:
        return true
    }
  }

  const filteredRows = rows.filter(row => {
    const checks: Array<[keyof typeof appliedMinValues, number]> = [
      ['ltp', row.ltp],
      ['open', row.open],
      ['high', row.high],
      ['low', row.low],
      ['close', row.close]
    ]

    return checks.every(([key, value]) => {
      const threshold = Number(appliedMinValues[key])
      if (!Number.isFinite(threshold) || appliedMinValues[key] === '') return true
      
return Number(value) === threshold
    })
  })
  const samePriceFilteredRows = filteredRows.filter(row => {
    if (!appliedOnlySamePrice) return true
    const values = [row.ltp, row.open, row.high, row.low, row.close].map(value => Number(value ?? 0))
    
return values.every(value => Number.isFinite(value)) && values.every(value => value === values[0])
  })
  const ltpThresholdValue = Number(appliedLtpThreshold)
  const thresholdFilteredRows = samePriceFilteredRows.filter(row => {
    if (!appliedLtpThreshold.trim() || !Number.isFinite(ltpThresholdValue)) return true
    
return Number(row.ltp ?? 0) >= ltpThresholdValue
  })
  const patternFilteredRows = thresholdFilteredRows.filter(row => {
    if (!appliedSymbolPattern || appliedSymbolPattern === 'any') return true
    
return symbolMatchesPattern(String(row.symbol || row.activeSymbol || ''), appliedSymbolPattern)
  })
  const actionableRows = patternFilteredRows.filter(row => {
    const activeId = normalizeId(row.activeStockId)
    if (!activeId) return false
    
return !protectedIds.includes(activeId)
  })
  const hasAppliedFilters =
    Object.values(appliedMinValues).some(value => String(value).trim() !== '') ||
    appliedOnlySamePrice ||
    String(appliedLtpThreshold).trim() !== '' ||
    (appliedSymbolPattern && appliedSymbolPattern !== 'any')

  const visibleRows = patternFilteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const openEditDialog = (row: AuditRow) => {
    setSelectedRow(row)
    setEditForm({
      exchange: String(row.exchange || 'NSE').toUpperCase(),
      token: String(row.token || row.activeSecurityCode || row.activeStockSecurityCode || '').trim(),
    })
    setCheckedPrice(null)
    setIsEditing(true)
  }

  const closeEditDialog = () => {
    setIsEditing(false)
    setSelectedRow(null)
    setCheckedPrice(null)
    setIsCheckingPrice(false)
  }

  const handleCheckPrice = async () => {
    if (!editForm.token || !editForm.exchange) return
    try {
      setIsCheckingPrice(true)
      const response = await axiosInstance.post(ENDURL.POST_RAW_STOCK_PRICE, {
        mode: 'FULL',
        tokenIds: [editForm.token],
        exchange: editForm.exchange,
      })
      const payload = response?.data?.data?.data || response?.data?.data || {}
      const fetched = Array.isArray(payload?.fetched) ? payload.fetched[0] : null
      setCheckedPrice(fetched || null)
      showSnackbar(fetched ? 'Price fetched successfully' : 'No price returned for this token', fetched ? 'success' : 'warning')
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    } finally {
      setIsCheckingPrice(false)
    }
  }

  const handleUpdateTokenExchange = async () => {
    if (!selectedRow?.activeStockMasterId || !editForm.token || !editForm.exchange) return
    try {
      setIsEditing(true)
      await axiosInstance.patch(
        ENDURL.UPDATE_MASTER_TOKEN_EXCHANGE.replace(':id', String(selectedRow.activeStockMasterId)),
        {
          token: editForm.token,
          exchange: editForm.exchange,
        },
      )
      showSnackbar(`Updated ${selectedRow.symbol} token/exchange`, 'success')
      await mutate(ENDURL.GET_STOCK_UNIVERSE_AUDIT)
      closeEditDialog()
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    }
  }

  const handleMarkInactiveFromDialog = async () => {
    if (!selectedRow?.activeStockMasterId) return
    const confirmed = window.confirm(`Mark ${selectedRow.symbol} inactive?`)
    if (!confirmed) return
    try {
      setIsEditing(true)
      await axiosInstance.patch(
        ENDURL.MARK_MASTER_STOCK_INACTIVE.replace(':id', String(selectedRow.activeStockMasterId)),
      )
      showSnackbar(`Marked ${selectedRow.symbol} inactive`, 'success')
      await mutate(ENDURL.GET_STOCK_UNIVERSE_AUDIT)
      closeEditDialog()
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    }
  }

  const handleMarkInactive = async () => {
    if (!actionableRows.length) return

    const confirmed = window.confirm(
      `Mark ${actionableRows.length} selected stock(s) inactive? Checked rows will be kept.`,
    )
    if (!confirmed) return

    try {
      setIsDeleting(true)
      await axiosInstance.post(ENDURL.MARK_STOCK_UNIVERSE_ROW_INACTIVE, {
        activeStockIds: actionableRows
          .map(row => normalizeId(row.activeStockId))
          .filter((id): id is number => id !== null),
      })
      showSnackbar(`Marked ${actionableRows.length} stock(s) inactive`, 'success')
      await mutate(ENDURL.GET_STOCK_UNIVERSE_AUDIT)
      setPage(0)
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader title={title} subheader={`Filtered: ${patternFilteredRows.length} / ${rows.length} row(s)`} />
      <Box sx={{ px: 2, pb: 2 }}>
        <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
          <TextField
            size='small'
            select
            label='Symbol pattern'
            value={draftSymbolPattern}
            onChange={event => setDraftSymbolPattern(event.target.value)}
            sx={{ width: 170 }}
          >
            <MenuItem value='any'>Any</MenuItem>
            <MenuItem value='suffix-be'>Ends with -BE</MenuItem>
            <MenuItem value='suffix-bl'>Ends with -BL</MenuItem>
            <MenuItem value='suffix-il'>Ends with -IL</MenuItem>
            <MenuItem value='suffix-iq'>Ends with -IQ</MenuItem>
            <MenuItem value='suffix-iv'>Ends with -IV</MenuItem>
            <MenuItem value='suffix-gr'>Ends with GR</MenuItem>
            <MenuItem value='prefix-sgb'>Starts with SGB</MenuItem>
            <MenuItem value='suffix-gb'>Ends with GB</MenuItem>
            <MenuItem value='suffix-n1n2'>Ends with N1/N2</MenuItem>
            <MenuItem value='suffix-pp'>Ends with PP</MenuItem>
            <MenuItem value='suffix-rs'>Ends with RS</MenuItem>
            <MenuItem value='suffix-sm'>Ends with SM</MenuItem>
            <MenuItem value='contains-niftysensex'>Contains NIFTY/SENSEX</MenuItem>
          </TextField>
          <TextField
            size='small'
            select
            label='LTP above'
            value={draftLtpThreshold}
            onChange={event => setDraftLtpThreshold(event.target.value)}
            sx={{ width: 150 }}
          >
            <MenuItem value=''>Any</MenuItem>
            <MenuItem value='100000'>1 Lakh</MenuItem>
            <MenuItem value='500000'>5 Lakh</MenuItem>
            <MenuItem value='1000000'>10 Lakh</MenuItem>
            <MenuItem value='5000000'>50 Lakh</MenuItem>
            <MenuItem value='10000000'>1 Crore</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={draftOnlySamePrice}
                onChange={event => setDraftOnlySamePrice(event.target.checked)}
              />
            }
            label='Only same-price rows'
          />
          {(['ltp', 'open', 'high', 'low', 'close'] as const).map(metric => (
            <TextField
              key={metric}
              size='small'
              type='number'
              label={`${metric.toUpperCase()} min`}
              value={draftMinValues[metric]}
              onChange={event => {
                setDraftMinValues(prev => ({ ...prev, [metric]: event.target.value }))
              }}
              sx={{ width: 130 }}
            />
          ))}
          <Button
            size='small'
            variant='contained'
            onClick={() => {
              setAppliedMinValues(draftMinValues)
              setAppliedOnlySamePrice(draftOnlySamePrice)
              setAppliedLtpThreshold(draftLtpThreshold)
              setAppliedSymbolPattern(draftSymbolPattern)
              setPage(0)
            }}
          >
            Apply Filters
          </Button>
          <Button
            size='small'
            variant='contained'
            color='error'
            disabled={!actionableRows.length || !hasAppliedFilters || isDeleting}
            onClick={handleMarkInactive}
          >
            {isDeleting ? 'Marking Inactive...' : `Mark Inactive (${actionableRows.length})`}
          </Button>
          <Button
            size='small'
            variant='text'
            onClick={() => {
              const empty = { ltp: '', open: '', high: '', low: '', close: '' }
              setDraftMinValues(empty)
              setAppliedMinValues(empty)
              setDraftLtpThreshold('')
              setAppliedLtpThreshold('')
              setDraftSymbolPattern('any')
              setAppliedSymbolPattern('any')
              setDraftOnlySamePrice(false)
              setAppliedOnlySamePrice(false)
              setPage(0)
            }}
          >
            Clear Filters
          </Button>
        </Stack>
        <Box sx={{ mt: 1 }}>
          <Typography variant='caption' color='text.secondary'>
            Same-price filter shows rows where LTP, Open, High, Low, and Close are all equal.
          </Typography>
        </Box>
      </Box>
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table stickyHeader size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Keep</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Exchange</TableCell>
              <TableCell>Token</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align='right'>LTP</TableCell>
              <TableCell align='right'>Open</TableCell>
              <TableCell align='right'>High</TableCell>
              <TableCell align='right'>Low</TableCell>
              <TableCell align='right'>Close</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length ? (
              visibleRows.map((row, index) => (
              <TableRow key={`${row.symbol}-${index}`} hover>
                <TableCell>
                  <Checkbox
                    checked={normalizeId(row.activeStockId) ? protectedIds.includes(normalizeId(row.activeStockId) as number) : false}
                    onChange={event => {
                      const activeId = normalizeId(row.activeStockId)
                      if (!activeId) return
                      setProtectedIds(prev =>
                        event.target.checked
                          ? Array.from(new Set([...prev, activeId]))
                          : prev.filter(id => id !== activeId),
                      )
                    }}
                    disabled={!normalizeId(row.activeStockId)}
                  />
                </TableCell>
                <TableCell>{row.symbol}</TableCell>
                <TableCell>{row.exchange || '-'}</TableCell>
                <TableCell>{row.token || '-'}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align='right'>{row.ltp ?? 0}</TableCell>
                <TableCell align='right'>{row.open ?? 0}</TableCell>
                <TableCell align='right'>{row.high ?? 0}</TableCell>
                <TableCell align='right'>{row.low ?? 0}</TableCell>
                  <TableCell align='right'>{row.close ?? 0}</TableCell>
                  <TableCell>
                    <Button size='small' variant='outlined' onClick={() => openEditDialog(row)}>
                      Update Token
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align='center'>
                  No rows
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={isEditing} onClose={closeEditDialog} fullWidth maxWidth='sm'>
        <DialogTitle>Update Token and Exchange</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              select
              label='Exchange'
              value={editForm.exchange}
              onChange={event => setEditForm(prev => ({ ...prev, exchange: event.target.value }))}
            >
              <MenuItem value='NSE'>NSE</MenuItem>
              <MenuItem value='BSE'>BSE</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label='Token'
              value={editForm.token}
              onChange={event => setEditForm(prev => ({ ...prev, token: event.target.value }))}
            />
            {checkedPrice && (
              <Alert severity='info'>
                Price check: LTP {checkedPrice.ltp ?? '-'}, Open {checkedPrice.open ?? '-'}, High {checkedPrice.high ?? '-'}, Low {checkedPrice.low ?? '-'}, Close {checkedPrice.close ?? '-'}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button onClick={handleCheckPrice} disabled={isCheckingPrice || !editForm.token} variant='outlined'>
            {isCheckingPrice ? 'Checking...' : 'Check Price'}
          </Button>
          <Button onClick={handleMarkInactiveFromDialog} color='error' variant='outlined'>
            Mark Inactive
          </Button>
          <Button onClick={handleUpdateTokenExchange} disabled={!editForm.token || !editForm.exchange} variant='contained'>
            Update
          </Button>
        </DialogActions>
      </Dialog>
      <TablePagination
        component='div'
        rowsPerPageOptions={[10, 25, 50]}
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={event => {
          setRowsPerPage(Number(event.target.value))
          setPage(0)
        }}
      />
    </Card>
  )
}

const StockUniverseAuditPage = () => {
  const { data, isLoading, error } = useSimpleSWR<AuditResponse>(ENDURL.GET_STOCK_UNIVERSE_AUDIT)

  const summary = data?.summary
  const categories = data?.categories

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ mb: 1 }}>
          Stock Universe Audit
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Compares your local BSE/NSE CSV lists with the stock master to help you separate matched, delisted,
          suspended, master-only, and truly missing stocks.
        </Typography>
      </Grid>

      {isLoading && (
        <Grid item xs={12}>
          <LinearProgress />
        </Grid>
      )}

      {error && (
        <Grid item xs={12}>
          <Alert severity='error'>Failed to load audit data.</Alert>
        </Grid>
      )}

      {summary && (
        <>
          <Grid item xs={12} md={2}>
            <SummaryCard label='BSE Master Match' value={summary.bseActiveMatched} color='#2e7d32' />
          </Grid>
          <Grid item xs={12} md={2}>
            <SummaryCard label='NSE Master Match' value={summary.nseActiveMatched} color='#2e7d32' />
          </Grid>
          <Grid item xs={12} md={2}>
            <SummaryCard label='BSE Delisted' value={summary.bseDelistedInActive} color='#d32f2f' />
          </Grid>
          <Grid item xs={12} md={2}>
            <SummaryCard label='BSE Suspended' value={summary.bseSuspendedInActive} color='#ed6c02' />
          </Grid>
          <Grid item xs={12} md={2}>
            <SummaryCard label='BSE In Master' value={summary.bseMasterOnly} color='#0277bd' />
          </Grid>
          <Grid item xs={12} md={2}>
            <SummaryCard label='NSE In Master' value={summary.nseMasterOnly} color='#0277bd' />
          </Grid>
          <Grid item xs={12} md={2}>
            <SummaryCard label='BSE Missing' value={summary.bseMissingInActive} color='#6d4c41' />
          </Grid>
          <Grid item xs={12} md={2}>
            <SummaryCard label='NSE Missing' value={summary.nseMissingInActive} color='#6d4c41' />
          </Grid>

          <Grid item xs={12} md={3}>
            <SummaryCard label='Master/Active Not in Files' value={summary.activeStockNotInFiles} color='#1976d2' />
          </Grid>
          <Grid item xs={12} md={3}>
            <SummaryCard label='Active Table Size' value={summary.totalActiveStocks} color='#1b5e20' />
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader title='Source Files' />
              <CardContent>
                <Typography variant='body2'>NSE: {summary.nseFile}</Typography>
                <Typography variant='body2'>BSE: {summary.bseFile}</Typography>
                <Typography variant='body2'>NSE rows: {summary.nseRows}</Typography>
                <Typography variant='body2'>BSE rows: {summary.bseRows}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}

      {categories && (
        <>
          <Grid item xs={12}>
            <RowsTable title='BSE rows matched in Stock Master' rows={categories.bseActiveMatched} />
          </Grid>
          <Grid item xs={12}>
            <RowsTable title='NSE rows matched in Stock Master' rows={categories.nseActiveMatched} />
          </Grid>
          <Grid item xs={12}>
            <RowsTable
              title='Stock Master rows that are Delisted in BSE file'
              rows={categories.bseDelistedInActive}
              actionKind='inactive'
              compactPriceOnly
            />
          </Grid>
          <Grid item xs={12}>
            <RowsTable
              title='Stock Master rows that are Suspended in BSE file'
              rows={categories.bseSuspendedInActive}
              actionKind='inactive'
              compactPriceOnly
            />
          </Grid>
          <Grid item xs={12}>
            <RowsTable title='BSE rows missing in Stock Master' rows={categories.bseMissingInActive} actionKind='add' showPrices />
          </Grid>
          <Grid item xs={12}>
            <RowsTable title='NSE rows missing in Stock Master' rows={categories.nseMissingInActive} actionKind='add' showPrices />
          </Grid>
          <Grid item xs={12}>
            <RowsTable title='BSE rows already in Stock Master but not Active' rows={categories.bseMasterOnly} />
          </Grid>
          <Grid item xs={12}>
            <RowsTable title='NSE rows already in Stock Master but not Active' rows={categories.nseMasterOnly} />
          </Grid>
          <Grid item xs={12}>
            <RowsTable title='Stock entries missing from Excel files' rows={categories.activeStockNotInFiles} />
          </Grid>
          <Grid item xs={12}>
            <PriceTable title='Master Stocks with LTP / Open / High / Low / Close' rows={categories.activeStockPriceSummary} />
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default StockUniverseAuditPage
