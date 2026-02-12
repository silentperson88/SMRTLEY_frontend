// ** Next Imports
import Head from 'next/head'
import { Router, useRouter } from 'next/router'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

// ** React Imports (polyfill useId for React < 18)
import * as React from 'react'

// ** Loader Import
import NProgress from 'nprogress'

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'
import type { EmotionCache } from '@emotion/cache'

// ** Redux Imports
import { Provider } from 'react-redux'
import store from 'src/store'

// ** Config Imports
import themeConfig from 'src/configs/themeConfig'

// ** Component Imports
import UserLayout from 'src/layouts/UserLayout'
import ThemeComponent from 'src/@core/theme/ThemeComponent'

// ** Contexts
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css'

// ** Global css styles
import '../../styles/globals.css'
import { SnackbarProvider } from 'src/layouts/components/SnackbarContext'
import MarketConnectionManager from './MarketConnectionManager'
import { useTheme } from '@mui/material/styles'

// ** Extend App Props with Emotion
type ExtendedAppProps = AppProps & {
  Component: NextPage
  emotionCache: EmotionCache
}

const clientSideEmotionCache = createEmotionCache()

// React 17 compatibility: MUI may call React.useId in some components
let reactIdCounter = 0
if (!(React as any).useId) {
  ;(React as any).useId = () => `r${++reactIdCounter}`
}

// ** Pace Loader
if (themeConfig.routingLoader) {
  Router.events.on('routeChangeStart', () => {
    NProgress.start()
  })
  Router.events.on('routeChangeError', () => {
    NProgress.done()
  })
  Router.events.on('routeChangeComplete', () => {
    NProgress.done()
  })
}

// ** Configure JSS & ClassName
const App = (props: ExtendedAppProps) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  const theme = useTheme()

  // Variables
  const getLayout = Component.getLayout ?? (page => <UserLayout>{page}</UserLayout>)
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-email',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/logout',
      '/401',
      '/404',
      '/500'
    ]

    const isPublicRoute = (path: string) => {
      return publicRoutes.some(route => path === route || path.startsWith(`${route}/`))
    }

    const checkAuth = (url?: string) => {
      if (typeof window === 'undefined') return

      const path = (url ?? router.asPath).split('?')[0]
      const token = localStorage.getItem('token')

      if (!token && !isPublicRoute(path)) {
        router.replace('/auth/login')

        return
      }

      setAuthReady(true)
    }

    if (!router.isReady) return

    setAuthReady(false)
    checkAuth()

    return () => {
      console.clear()
    }
  }, [router, router.isReady])

  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          background: theme =>
            `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
          {themeConfig.templateName}
        </Typography>
        <CircularProgress size={36} />
        <Typography variant='body2' color='text.secondary'>
          Loading...
        </Typography>
      </Box>
    )
  }

  return (
    <SnackbarProvider>
      <Provider store={store}>
        <CacheProvider value={emotionCache}>
          <MarketConnectionManager />
          <Head>
            <svg
              width={30}
              height={25}
              version='1.1'
              viewBox='0 0 30 23'
              xmlns='http://www.w3.org/2000/svg'
              xmlnsXlink='http://www.w3.org/1999/xlink'
            >
              <g stroke='none' strokeWidth='1' fill='none' fillRule='evenodd'>
                <g id='Artboard' transform='translate(-95.000000, -51.000000)'>
                  <g id='logo' transform='translate(95.000000, 50.000000)'>
                    <path
                      id='Combined-Shape'
                      fill={theme.palette.primary.main}
                      d='M30,21.3918362 C30,21.7535219 29.9019196,22.1084381 29.7162004,22.4188007 C29.1490236,23.366632 27.9208668,23.6752135 26.9730355,23.1080366 L26.9730355,23.1080366 L23.714971,21.1584295 C23.1114106,20.7972624 22.7419355,20.1455972 22.7419355,19.4422291 L22.7419355,19.4422291 L22.741,12.7425689 L15,17.1774194 L7.258,12.7425689 L7.25806452,19.4422291 C7.25806452,20.1455972 6.88858935,20.7972624 6.28502902,21.1584295 L3.0269645,23.1080366 C2.07913318,23.6752135 0.850976404,23.366632 0.283799571,22.4188007 C0.0980803893,22.1084381 2.0190442e-15,21.7535219 0,21.3918362 L0,3.58469444 L0.00548573643,3.43543209 L0.00548573643,3.43543209 L0,3.5715689 C3.0881846e-16,2.4669994 0.8954305,1.5715689 2,1.5715689 C2.36889529,1.5715689 2.73060353,1.67359571 3.04512412,1.86636639 L15,9.19354839 L26.9548759,1.86636639 C27.2693965,1.67359571 27.6311047,1.5715689 28,1.5715689 C29.1045695,1.5715689 30,2.4669994 30,3.5715689 L30,3.5715689 Z'
                    />
                    <polygon
                      id='Rectangle'
                      opacity='0.077704'
                      fill={theme.palette.common.black}
                      points='0 8.58870968 7.25806452 12.7505183 7.25806452 16.8305646'
                    />
                    <polygon
                      id='Rectangle'
                      opacity='0.077704'
                      fill={theme.palette.common.black}
                      points='0 8.58870968 7.25806452 12.6445567 7.25806452 15.1370162'
                    />
                    <polygon
                      id='Rectangle'
                      opacity='0.077704'
                      fill={theme.palette.common.black}
                      points='22.7419355 8.58870968 30 12.7417372 30 16.9537453'
                      transform='translate(26.370968, 12.771227) scale(-1, 1) translate(-26.370968, -12.771227) '
                    />
                    <polygon
                      id='Rectangle'
                      opacity='0.077704'
                      fill={theme.palette.common.black}
                      points='22.7419355 8.58870968 30 12.6409734 30 15.2601969'
                      transform='translate(26.370968, 11.924453) scale(-1, 1) translate(-26.370968, -11.924453) '
                    />
                    <path
                      id='Rectangle'
                      fillOpacity='0.15'
                      fill={theme.palette.common.white}
                      d='M3.04512412,1.86636639 L15,9.19354839 L15,9.19354839 L15,17.1774194 L0,8.58649679 L0,3.5715689 C3.0881846e-16,2.4669994 0.8954305,1.5715689 2,1.5715689 C2.36889529,1.5715689 2.73060353,1.67359571 3.04512412,1.86636639 Z'
                    />
                    <path
                      id='Rectangle'
                      fillOpacity='0.35'
                      fill={theme.palette.common.white}
                      transform='translate(22.500000, 8.588710) scale(-1, 1) translate(-22.500000, -8.588710) '
                      d='M18.0451241,1.86636639 L30,9.19354839 L30,9.19354839 L30,17.1774194 L15,8.58649679 L15,3.5715689 C15,2.4669994 15.8954305,1.5715689 17,1.5715689 C17.3688953,1.5715689 17.7306035,1.67359571 18.0451241,1.86636639 Z'
                    />
                  </g>
                </g>
              </g>
            </svg>
            <Box component='span' sx={{ ml: 1, fontWeight: 600, color: 'text.primary' }} />
            <svg
              width={30}
              height={25}
              version='1.1'
              viewBox='0 0 30 25'
              xmlns='http://www.w3.org/2000/svg'
              xmlnsXlink='http://www.w3.org/1999/xlink'
            >
              <g stroke='none' strokeWidth='1' fill='none' fillRule='evenodd'>
                <g id='Artboard' transform='translate(-95.000000, -51.000000)'>
                  <g id='logo' transform='translate(95.000000, 50.000000)'>
                    <path
                      id='G-Shape'
                      fill={theme.palette.primary.main}
                      d='M15,0 C6.716,0 0,6.716 0,15 C0,23.284 6.716,30 15,30 C23.284,30 30,23.284 30,15 C30,14.447 29.553,14 29,14 H17 C16.447,14 16,14.447 16,15 C16,15.553 16.447,16 17,16 H27 C27,22.627 21.627,28 15,28 C8.373,28 3,22.627 3,16 C3,9.373 8.373,4 15,4 C19.333,4 23.002,6.625 24.667,10 H21 C20.447,10 20,10.447 20,11 C20,11.553 20.447,12 21,12 H27 C27.553,12 28,11.553 28,11 C28,4.925 22.075,0 15,0 Z'
                    />
                    <polygon
                      id='Rectangle'
                      opacity='0.077704'
                      fill={theme.palette.common.black}
                      points='0 8.58870968 7.25806452 12.7505183 7.25806452 16.8305646'
                    />
                    <polygon
                      id='Rectangle'
                      opacity='0.077704'
                      fill={theme.palette.common.black}
                      points='0 8.58870968 7.25806452 12.6445567 7.25806452 15.1370162'
                    />
                    <path
                      id='Rectangle'
                      fillOpacity='0.15'
                      fill={theme.palette.common.white}
                      d='M3.04512412,1.86636639 L15,9.19354839 L15,9.19354839 L15,17.1774194 L0,8.58649679 L0,3.5715689 C3.0881846e-16,2.4669994 0.8954305,1.5715689 2,1.5715689 C2.36889529,1.5715689 2.73060353,1.67359571 3.04512412,1.86636639 Z'
                    />
                  </g>
                </g>
              </g>
            </svg>
            <meta
              name='description'
              content={`${themeConfig.templateName} – Run4Dream dashboard built with MUI v5.`}
            />
            <meta name='keywords' content='Material Design, MUI, Admin Template, React Admin Template' />
            <meta name='viewport' content='initial-scale=1, width=device-width' />
          </Head>

          <SettingsProvider>
            <SettingsConsumer>
              {({ settings }) => {
                return <ThemeComponent settings={settings}>{getLayout(<Component {...pageProps} />)}</ThemeComponent>
              }}
            </SettingsConsumer>
          </SettingsProvider>
        </CacheProvider>
      </Provider>
    </SnackbarProvider>
  )
}

export default App
