import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  Box,
  Divider
} from '@mui/material'
import Chip from '@mui/material/Chip'
import { useEffect, useState } from 'react'
import { getErrorMessage } from 'src/api/axios/errorhandler'
import { useMutationSWR } from 'src/hooks/swr/swrhooks'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'
import { getRiskColor } from 'src/pages/portfolio-stocks'
import type { PortfolioType } from 'src/types/portfolio'
import { ENDURL } from 'src/utils/constants/endurl.utils'

interface Props {
  open: boolean
  onClose: () => void
  portfolioTypes: PortfolioType[]
  selectedId: string | null
}

interface portfolioPayload {
  name: string
  portfolio_type_id: string
  initial_fund: number
  meta?: {
    mode?: 'BACKTEST'
    as_of_date?: string
    query?: string
    watchlist_master_ids?: number[]
  }
}

const CreatePortfolioDialog = ({ open, onClose, portfolioTypes, selectedId }: Props) => {
  const [portfolioName, setPortfolioName] = useState('')
  const [selectedType, setSelectedType] = useState<PortfolioType | null>(null)
  const [initialFund, setInitialFund] = useState<number | ''>('')
  const [backtestDate, setBacktestDate] = useState('')
  const [backtestQuery, setBacktestQuery] = useState('')
  const [accepted, setAccepted] = useState(false)
  const { showSnackbar } = useSnackbar()

  const { trigger } = useMutationSWR<{ message: string }, portfolioPayload>(ENDURL.GET_MY_PORTFOLIOS)
  const [fundError, setFundError] = useState<string>('')
  const isBacktesting = selectedType?.code === 'BACKTESTING'

  const handleCreate = async () => {
    if (!portfolioName || !selectedType || !accepted) return
    setFundError('')

    try {
      const payload: portfolioPayload = {
        name: portfolioName,
        portfolio_type_id: selectedType.id,
        initial_fund: initialFund || 0,
        meta: isBacktesting
          ? {
              mode: 'BACKTEST',
              as_of_date: backtestDate,
              query: backtestQuery.trim(),
              watchlist_master_ids: []
            }
          : {
              watchlist_master_ids: []
            }
      }

      if (isBacktesting && !backtestDate) {
        setFundError('Backtesting portfolio requires an as of date.')
        
return
      }

      console.log('CREATE PORTFOLIO PAYLOAD', payload)
      const res = await trigger(payload)

      showSnackbar('Portfolio created', 'success')

      console.log('CREATE PORTFOLIO RESPONSE', res)
      if (!res) return

      // TODO: replace with API call
      onClose()
    } catch (error: unknown) {
      const backendMessage = getErrorMessage(error)
      const isInsufficientFunds = /insufficient|not\s+enough\s+fund/i.test(backendMessage)
      const message = isInsufficientFunds
        ? 'You do not have enough funds to create a new portfolio. First, add funds to your account.'
        : backendMessage || 'Unable to create portfolio'

      setFundError(message)
      showSnackbar(message, 'error')
    }
  }

  const handleSelectType = (id: string) => {
    const type = portfolioTypes.find(type => type.id === id)
    if (!type) return

    setSelectedType(type)
    setInitialFund(type.fund || 0)
    if (type.code !== 'BACKTESTING') {
      setBacktestDate('')
      setBacktestQuery('')
    }
  }

  useEffect(() => {
    if (selectedId) {
      const type = portfolioTypes.find(type => type.id === selectedId)
      if (!type) return
      setSelectedType(type)
      setInitialFund(type.fund || 0)
    }
  }, [selectedId, portfolioTypes])

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Create New Portfolio</DialogTitle>

      <DialogContent>
        {/* Portfolio Name */}
        <TextField
          fullWidth
          label='Portfolio Name'
          placeholder='e.g. Long Term Wealth, IPO Practice'
          margin='normal'
          value={portfolioName}
          onChange={e => setPortfolioName(e.target.value)}
        />

        {/* Portfolio Type */}
        <TextField
          fullWidth
          select
          label='Portfolio Type'
          margin='normal'
          value={selectedType?.id || ''}
          onChange={e => handleSelectType(e.target.value)}
        >
          {portfolioTypes.map(type => (
            <MenuItem key={type.id} value={type.id}>
              <Box display='flex' justifyContent='space-between' alignItems='center' mb={2} width='100%'>
                <Typography variant='h6'>{type.display_name}</Typography>
                <Chip label={type.risk_level} size='small' color={getRiskColor(type.risk_level)} />
              </Box>
            </MenuItem>
          ))}
        </TextField>

        {/* Description */}
        {selectedType && (
          <Alert severity='info' sx={{ mt: 2 }}>
            {selectedType.description}
          </Alert>
        )}

        {isBacktesting && (
          <>
            <TextField
              fullWidth
              type='date'
              label='As Of Date'
              margin='normal'
              value={backtestDate}
              onChange={e => setBacktestDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label='Saved Query'
              margin='normal'
              placeholder='Paste the historical screener query you want to keep with this portfolio.'
              value={backtestQuery}
              onChange={e => setBacktestQuery(e.target.value)}
            />
          </>
        )}

        {/* Initial Fund */}
        <TextField
          fullWidth
          type='number'
          label='Initial Fund (Dummy Money)'
          margin='normal'
          value={initialFund}
          onChange={e => setInitialFund(Number(e.target.value))}
        />
        {fundError && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {fundError || "You don't have enough funds to add in this portfolio."}
          </Alert>
        )}

        {/* Important Notes */}
        {selectedType?.important_notes?.length ? (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant='subtitle1' gutterBottom>
              Important Notes
            </Typography>

            <Box sx={{ pl: 1 }}>
              {selectedType.important_notes.map((note, index) => (
                <Typography key={index} variant='body2' color='text.secondary'>
                  • {note}
                </Typography>
              ))}
            </Box>
          </>
        ) : null}

        {/* Disclaimer */}
        <Divider sx={{ my: 3 }} />

        <FormControlLabel
          control={<Checkbox checked={accepted} onChange={e => setAccepted(e.target.checked)} />}
          label={
            <Typography variant='body2'>
              I understand the rules, risks, and that this is a paper trading / educational platform.
            </Typography>
          }
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color='secondary'>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleCreate}
          disabled={!portfolioName || !selectedType || !accepted || (isBacktesting && !backtestDate)}
        >
          Create Portfolio
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreatePortfolioDialog


