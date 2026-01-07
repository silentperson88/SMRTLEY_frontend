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
import useSWR, { mutate } from 'swr'
import { axiosService, getService } from 'src/@core/utils/api-service'
import { useEffect, useState } from 'react'

interface Props {
  hidden: boolean
  settings: Settings
  toggleNavVisibility: () => void
  saveSettings: (values: Settings) => void
}

interface serverStatus {
  isOnline: boolean
}

const AppBarContent = (props: Props) => {
  const [totp, setTotp] = useState<string>("")
  const [refresh, setRefresh] = useState<boolean>(false)

  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  // ** Hook
  const hiddenSm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  const { data, error, isLoading } = useSWR<serverStatus>(
    '/tokens/on', // Always fetch on first render
    getService,
    {
      refreshInterval: 600000, // Refresh every 10 minutes
      revalidateOnFocus: false // Optional: Prevent revalidation on window focus
    }
  )

  useEffect(() => {
    console.log(data, error, isLoading)
  }, [data, error, isLoading])

  useEffect(() => {
    if (refresh) {
      mutate('/tokens/on')
    }
  }, [refresh])

  const handleAngelLogin = async () => {
    console.log('here')
    const res: any = await axiosService.post('/tokens', { totp }).catch(err => err.response)
    if (res.status === 200) setRefresh(true)
    else console.log(res)
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
              placeholder=''
              size='small'
              value={totp}
              onChange={e => setTotp(e.target.value)}
            />
            <Button variant='contained' sx={{ marginRight: 3.5 }} onClick={handleAngelLogin}>
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
