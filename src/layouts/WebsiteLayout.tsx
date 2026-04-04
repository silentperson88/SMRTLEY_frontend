// ** React Imports
import { ChangeEvent, ReactNode, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Magnify from 'mdi-material-ui/Magnify'

// ** Component Import
import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'

// ** Hook Import
import VerticalNavItems from 'src/navigation/vertical'
import { NavLink } from 'src/@core/layouts/types'
import themeConfig from 'src/configs/themeConfig'
import { usePaginatedSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'

interface SearchList {
  id: string
  name: string
  symbol: string
}

interface Props {
  children: ReactNode
}

const WebsiteLayout = ({ children }: Props) => {
  const router = useRouter()
  const inputWrapperRef = useRef<HTMLDivElement | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navItems = useMemo(
    () =>
      VerticalNavItems().filter((item): item is NavLink => {
        if (!('title' in item) || !item.path) return false
        if (item.openInNewTab) return false
        return !['/auth/login', '/auth/register', '/pages/error'].includes(item.path)
      }),
    []
  )

  const { data: searchList, isLoading } = usePaginatedSWR<SearchList[]>(ENDURL.GET_MASTER_STOCKS, {
    page: 0,
    limit: 6,
    search: searchValue.length > 1 ? searchValue : ''
  })

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
    setSearchOpen(value.length > 1)
  }

  return (
    <>
      <CssBaseline />
      <AppBar
        elevation={0}
        position='sticky'
        sx={{
          bgcolor: '#1d1a34',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(6px)'
        }}
      >
        <Container maxWidth='xl'>
          <Toolbar sx={{ minHeight: '64px !important', px: '0 !important', gap: 2 }}>
            <Stack direction='row' alignItems='center' spacing={1.1} sx={{ mr: 1 }}>
              <Box
                component='img'
                src='/images/favicon.png'
                alt='logo'
                sx={{ width: 22, height: 22, borderRadius: 0.75, objectFit: 'cover' }}
                onClick={() => router.push('/')}
              />
              <Typography
                variant='h6'
                sx={{ color: 'rgba(255,255,255,0.98)', fontWeight: 800, letterSpacing: 0.35, whiteSpace: 'nowrap', cursor: 'pointer' }}
                onClick={() => router.push('/')}
              >
                {themeConfig.templateName}
              </Typography>
            </Stack>

            <Stack direction='row' spacing={0.6} sx={{ ml: 1, flex: 1, overflowX: 'auto', py: 0.5 }}>
              {navItems.map(item => {
                const isActive = Boolean(item.path) && router.pathname === item.path

                return (
                  <Button
                    key={item.title}
                    size='small'
                    onClick={() => item.path && router.push(item.path)}
                    sx={{
                      borderRadius: 1.5,
                      px: 1.6,
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.78)',
                      bgcolor: isActive ? 'rgba(123,97,255,0.2)' : 'transparent',
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(123,97,255,0.26)' : 'rgba(255,255,255,0.09)'
                      },
                      whiteSpace: 'nowrap',
                      textTransform: 'none',
                      minWidth: 'fit-content',
                      fontSize: '0.84rem',
                      fontWeight: 600
                    }}
                  >
                    {item.title}
                  </Button>
                )
              })}
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', color: 'rgba(255,255,255,0.9)' }}>
              <Box ref={inputWrapperRef} sx={{ position: 'relative', minWidth: { xs: 150, sm: 230 }, mr: 1.2 }}>
                <TextField
                  size='small'
                  value={searchValue}
                  onChange={handleSearch}
                  placeholder='Search stocks'
                  autoComplete='off'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Magnify fontSize='small' />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      bgcolor: 'rgba(255,255,255,0.06)',
                      borderRadius: 1.5
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.2)'
                    },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.75)' }
                  }}
                />
                {searchOpen && (
                  <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
                    <Paper sx={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 20, maxHeight: 280, overflowY: 'auto' }}>
                      <List dense>
                        {isLoading && (
                          <ListItemButton disabled>
                            <ListItemText primary='Searching...' />
                          </ListItemButton>
                        )}
                        {!isLoading && searchList?.length === 0 && (
                          <ListItemButton disabled>
                            <ListItemText primary='No results' />
                          </ListItemButton>
                        )}
                        {searchList?.map(item => (
                          <ListItemButton
                            key={item.id}
                            onClick={() => {
                              setSearchValue(item.name || item.symbol || '')
                              setSearchOpen(false)
                              router.push(`/stock-fundamental/${encodeURIComponent(item.symbol || item.name || '')}`)
                            }}
                          >
                            <ListItemText primary={item.name} secondary={item.symbol} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  </ClickAwayListener>
                )}
              </Box>
              <NotificationDropdown />
              <UserDropdown />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth='xl'>
        <Box component='main' sx={{ py: 4 }}>
          {children}
        </Box>
      </Container>
    </>
  )
}

export default WebsiteLayout
