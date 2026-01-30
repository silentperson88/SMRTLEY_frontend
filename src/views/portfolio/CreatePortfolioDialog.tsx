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
import { getRiskColor, PortfolioType } from 'src/pages/portfolio-stocks'

interface Props {
  open: boolean
  onClose: () => void
  portfolioTypes: PortfolioType[]
  selectedId: string | null
}

const CreatePortfolioDialog = ({ open, onClose, portfolioTypes, selectedId }: Props) => {
  const [portfolioName, setPortfolioName] = useState('')
  const [selectedType, setSelectedType] = useState<PortfolioType | null>(null)
  const [initialFund, setInitialFund] = useState<number | ''>('')
  const [accepted, setAccepted] = useState(false)

  const handleCreate = () => {
    if (!portfolioName || !selectedType || !accepted) return

    const payload = {
      name: portfolioName,
      portfolio_type_id: selectedType._id,
      initial_fund: initialFund || 0
    }

    console.log('CREATE PORTFOLIO PAYLOAD', payload)

    // TODO: replace with API call
    onClose()
  }

  const handleSelectType = (id: string) => {
    const type = portfolioTypes.find(type => type._id === id)
    if (!type) return

    setSelectedType(type)
    setInitialFund(type.fund || 0)
  }

  useEffect(() => {
    if (selectedId) {
      const type = portfolioTypes.find(type => type._id === selectedId)
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
          value={selectedType?._id || ''}
          onChange={e => handleSelectType(e.target.value)}
        >
          {portfolioTypes.map(type => (
            <MenuItem key={type._id} value={type._id}>
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

        {/* Initial Fund */}
        <TextField
          fullWidth
          type='number'
          label='Initial Fund (Dummy Money)'
          margin='normal'
          value={initialFund}
          onChange={e => setInitialFund(Number(e.target.value))}
        />

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
        <Button variant='contained' onClick={handleCreate} disabled={!portfolioName || !selectedType || !accepted}>
          Create Portfolio
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreatePortfolioDialog
