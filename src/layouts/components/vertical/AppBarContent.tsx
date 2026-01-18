// ** MUI Imports
import Box from '@mui/material/Box'
import { Theme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import InputAdornment from '@mui/material/InputAdornment'

// ** Icons Imports
import Menu from 'mdi-material-ui/Menu'
import Magnify from 'mdi-material-ui/Magnify'
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction'

// ** Type Import
import { Settings } from 'src/@core/context/settingsContext'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import { Button } from '@mui/material'
import { mutate } from 'swr'
import { useState } from 'react'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useMutationSWR, useSimpleSWR } from 'src/hooks/swr/swrhooks'
import { getErrorMessage } from 'src/api/axios/errorhandler'
import { useSnackbar } from '../SnackbarContext'

interface Props {
  hidden: boolean
  settings: Settings
  toggleNavVisibility: () => void
  saveSettings: (values: Settings) => void
}

interface serverStatus {
  isOnline: boolean
}

interface LoginResponse {
  status: number
}

const AppBarContent = (props: Props) => {
  const [totp, setTotp] = useState<string>('')
  const { showSnackbar } = useSnackbar()

  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  // ** Hook
  const hiddenSm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  const { data } = useSimpleSWR<serverStatus>(ENDURL.GET_SERVER_STATUS)

  const { trigger, isMutating } = useMutationSWR<LoginResponse, { data: string }>(ENDURL.POST_SMART_LOGIN)

  const handleAngelLogin = async () => {
    try {
      await trigger({ data: totp })

      showSnackbar('Login successful', 'success')

      // Manually revalidate GET only on success
      mutate(ENDURL.GET_SERVER_STATUS)
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error')
    }
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {hidden ? (
          <IconButton
            color='inherit'
            onClick={toggleNavVisibility}
            sx={{ ml: -2.75, ...(hiddenSm ? {} : { mr: 3.5 }) }}
          >
            <Menu />
          </IconButton>
        ) : null}
        <TextField
          size='small'
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Magnify fontSize='small' />
              </InputAdornment>
            )
          }}
        />
      </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        {/* {hiddenSm ? null : (
          <Box
            component='a'
            target='_blank'
            rel='noreferrer'
            sx={{ mr: 4, display: 'flex' }}
            href='https://github.com/themeselection/materio-mui-react-nextjs-admin-template-free'
          >
            <img
              height={24}
              alt='github stars'
              src='https://img.shields.io/github/stars/themeselection/materio-mui-react-nextjs-admin-template-free?style=social'
            />
          </Box>
        )} */}
        {data && !data.isOnline ? (
          <>
            <TextField
              fullWidth
              label='TOTP'
              placeholder='TOTP-9:15-15:30'
              size='small'
              value={totp}
              onChange={e => setTotp(e.target.value)}
            />
            <Button variant='contained' sx={{ marginRight: 3.5 }} onClick={handleAngelLogin} disabled={isMutating}>
              Start
            </Button>
          </>
        ) : (
          <OnlinePredictionIcon color='primary' />
        )}
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        <NotificationDropdown />
        <UserDropdown />
      </Box>
    </Box>
  )
}

export default AppBarContent
