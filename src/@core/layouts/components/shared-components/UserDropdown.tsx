// ** React Imports
import { Fragment, SyntheticEvent, useMemo, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// ** Icons Imports
import LogoutVariant from 'mdi-material-ui/LogoutVariant'
import WalletPlusOutline from 'mdi-material-ui/WalletPlusOutline'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'

import { mutate } from 'swr'
import { useMutationSWR, useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { getErrorMessage } from 'src/api/axios/errorhandler'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'
import type { MyPortfolio } from 'src/types/portfolio'

const BadgeContentSpan = styled('span')(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
}))

const MAX_AMOUNT = 1000000

const getInitials = (fullName: string) => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

type StoredUser = {
  name?: string
  full_name?: string
  email?: string
}

const getUserIdentity = () => {
  if (typeof window === 'undefined') return 'User'
  try {
    const storedUserRaw = localStorage.getItem('user')
    if (!storedUserRaw) return 'User'

    const storedUser = JSON.parse(storedUserRaw) as StoredUser
    const name = storedUser?.name || storedUser?.full_name
    if (name && name.trim()) return name
    if (storedUser?.email && storedUser.email.trim()) return storedUser.email
  } catch {
    // ignore and fallback
  }

  return 'User'
}

const UserDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const [isAddFundOpen, setIsAddFundOpen] = useState(false)
  const [addAmount, setAddAmount] = useState<string>('')
  const [addAmountError, setAddAmountError] = useState<string>('')
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState<string>('')
  const [transferAmountError, setTransferAmountError] = useState<string>('')
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('')

  const router = useRouter()
  const { showSnackbar } = useSnackbar()
  const { data: portfolios, isLoading: isPortfoliosLoading } = useSimpleSWR<MyPortfolio[]>(ENDURL.GET_MY_PORTFOLIOS)

  const userFullName = useMemo(() => getUserIdentity(), [])
  const userInitials = useMemo(() => getInitials(userFullName), [userFullName])

  const { trigger: triggerAddFund, isMutating: isAddingFund } = useMutationSWR<{ message?: string }, { amount: number }>(
    ENDURL.LOAD_WALLET_FUND
  )

  const { trigger: triggerTransferFund, isMutating: isTransferringFund } = useMutationSWR<
    { message?: string },
    { amount: number }
  >(selectedPortfolioId ? ENDURL.TRANSFER_WALLET_TO_PORTFOLIO.replace(':portfolioId', selectedPortfolioId) : '')

  const handleDropdownOpen = (event: SyntheticEvent) => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = () => {
    setAnchorEl(null)
  }

  const resetAddFundState = () => {
    setAddAmount('')
    setAddAmountError('')
  }

  const resetTransferState = () => {
    setTransferAmount('')
    setTransferAmountError('')
    setSelectedPortfolioId('')
  }

  const handleOpenAddFund = () => {
    handleDropdownClose()
    resetAddFundState()
    setIsAddFundOpen(true)
  }

  const handleCloseAddFund = () => {
    resetAddFundState()
    setIsAddFundOpen(false)
  }

  const handleOpenTransferFund = () => {
    if (isPortfoliosLoading) {
      handleDropdownClose()
      showSnackbar('Loading portfolios. Please try again.', 'error')
      return
    }

    if (!isPortfoliosLoading && (!portfolios || portfolios.length === 0)) {
      handleDropdownClose()
      showSnackbar('Create portfolio first.', 'error')
      return
    }

    handleDropdownClose()
    resetTransferState()
    setIsTransferOpen(true)
  }

  const handleCloseTransferFund = () => {
    resetTransferState()
    setIsTransferOpen(false)
  }

  const validateAmount = (value: string) => {
    const parsedAmount = Number(value)
    if (!value) return ''
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return 'Enter a valid amount greater than 0.'
    if (parsedAmount > MAX_AMOUNT) return 'You cannot add more than 10,00,000 at once.'

    return ''
  }

  const handleAddFund = async () => {
    const err = validateAmount(addAmount)
    if (err) {
      setAddAmountError(err)
      return
    }

    try {
      await triggerAddFund({ amount: Number(addAmount) })
      showSnackbar('Fund added successfully', 'success')
      handleCloseAddFund()
      mutate(ENDURL.GET_DASHBOARD)
      mutate(ENDURL.GET_OVERVIEW)
      mutate(ENDURL.GET_MY_PORTFOLIOS)
    } catch (error: unknown) {
      showSnackbar(getErrorMessage(error), 'error')
    }
  }

  const handleTransferFund = async () => {
    const err = validateAmount(transferAmount)
    if (err) {
      setTransferAmountError(err)
      return
    }

    if (!selectedPortfolioId) {
      showSnackbar('Please select a portfolio.', 'error')
      return
    }

    try {
      await triggerTransferFund({ amount: Number(transferAmount) })
      showSnackbar('Fund transferred successfully', 'success')
      handleCloseTransferFund()
      mutate(ENDURL.GET_DASHBOARD)
      mutate(ENDURL.GET_OVERVIEW)
      mutate(ENDURL.GET_MY_PORTFOLIOS)
    } catch (error: unknown) {
      showSnackbar(getErrorMessage(error), 'error')
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    router.replace('/auth/login')
    setAnchorEl(null)
  }

  const styles = {
    py: 2,
    px: 4,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    color: 'text.primary',
    textDecoration: 'none',
    '& svg': {
      fontSize: '1.375rem',
      color: 'text.secondary'
    }
  }

  return (
    <Fragment>
      <Badge
        overlap='circular'
        onClick={handleDropdownOpen}
        sx={{ ml: 2, cursor: 'pointer' }}
        badgeContent={<BadgeContentSpan />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Avatar sx={{ width: 40, height: 40 }}>{userInitials}</Avatar>
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleDropdownClose}
        sx={{ '& .MuiMenu-paper': { width: 260, marginTop: 4 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ pt: 2, pb: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              overlap='circular'
              badgeContent={<BadgeContentSpan />}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Avatar sx={{ width: '2.5rem', height: '2.5rem' }}>{userInitials}</Avatar>
            </Badge>
            <Box sx={{ display: 'flex', marginLeft: 3, alignItems: 'flex-start', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 600 }}>{userFullName}</Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mt: 0, mb: 1 }} />
        <MenuItem sx={{ p: 0 }} onClick={handleOpenAddFund}>
          <Box sx={styles}>
            <WalletPlusOutline sx={{ marginRight: 2 }} />
            Add Funds
          </Box>
        </MenuItem>
        <MenuItem sx={{ p: 0 }} onClick={handleOpenTransferFund}>
          <Box sx={styles}>
            <CurrencyUsd sx={{ marginRight: 2 }} />
            Transfer Fund to Portfolio
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem sx={{ py: 2 }} onClick={handleLogout}>
          <LogoutVariant sx={{ marginRight: 2, fontSize: '1.375rem', color: 'text.secondary' }} />
          Logout
        </MenuItem>
      </Menu>

      <Dialog open={isAddFundOpen} onClose={handleCloseAddFund} maxWidth='xs' fullWidth>
        <DialogTitle>Add Funds</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type='number'
            margin='normal'
            label='Amount'
            value={addAmount}
            onChange={e => {
              const value = e.target.value
              setAddAmount(value)
              setAddAmountError(validateAmount(value))
            }}
            error={Boolean(addAmountError)}
            helperText={addAmountError || 'Maximum per request: 10,00,000'}
            inputProps={{ min: 1, max: MAX_AMOUNT }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddFund} color='secondary'>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleAddFund} disabled={Boolean(addAmountError) || !addAmount || isAddingFund}>
            {isAddingFund ? 'Adding...' : 'Add Funds'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isTransferOpen} onClose={handleCloseTransferFund} maxWidth='xs' fullWidth>
        <DialogTitle>Transfer Fund to Portfolio</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            margin='normal'
            label='Portfolio'
            value={selectedPortfolioId}
            onChange={e => setSelectedPortfolioId(e.target.value)}
          >
            {(portfolios || []).map(portfolio => (
              <MenuItem key={portfolio._id} value={portfolio._id}>
                {portfolio.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            type='number'
            margin='normal'
            label='Amount'
            value={transferAmount}
            onChange={e => {
              const value = e.target.value
              setTransferAmount(value)
              setTransferAmountError(validateAmount(value))
            }}
            error={Boolean(transferAmountError)}
            helperText={transferAmountError || 'Maximum per request: 10,00,000'}
            inputProps={{ min: 1, max: MAX_AMOUNT }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransferFund} color='secondary'>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleTransferFund}
            disabled={Boolean(transferAmountError) || !transferAmount || !selectedPortfolioId || isTransferringFund}
          >
            {isTransferringFund ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default UserDropdown
