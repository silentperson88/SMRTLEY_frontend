import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/router'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

const LogoutPage = () => {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    router.replace('/auth/login')
  }, [router])

  return (
    <Box className='content-center' sx={{ flexDirection: 'column', gap: 3 }}>
      <CircularProgress />
      <Typography variant='body2' color='text.secondary'>
        Logging out...
      </Typography>
    </Box>
  )
}

LogoutPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

export default LogoutPage
