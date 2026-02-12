// ** React Imports
import { useState, ChangeEvent, FormEvent, ReactNode } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import MuiCard, { CardProps } from '@mui/material/Card'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Hooks
import { useMutationSWR } from 'src/hooks/swr/swrhooks'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { useSnackbar } from 'src/layouts/components/SnackbarContext'

interface State {
  email: string
}

// ** Styled Components
const Card = styled(MuiCard)<CardProps>(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '28rem' }
}))

const ForgotPasswordPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const snackBar = useSnackbar()
  const [values, setValues] = useState<State>({ email: '' })
  const [error, setError] = useState<string>('')

  const { trigger: forgotPassword, isMutating } = useMutationSWR<{ message: string }, { email: string }>(
    ENDURL.FORGOT_PASSWORD
  )

  const handleChange = (prop: keyof State) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!values.email.trim()) {
      setError('Email is required')
      return
    }

    const res = await forgotPassword({ email: values.email })
    if (res) {
      snackBar.showSnackbar('OTP sent to your email', 'success')
      router.push('/auth/reset-password')
    }
  }

  return (
    <Box className='content-center'>
      <Card sx={{ zIndex: 1 }}>
        <CardContent sx={{ padding: theme => `${theme.spacing(12, 9, 7)} !important` }}>
          <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              variant='h6'
              sx={{
                lineHeight: 1,
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '1.5rem !important'
              }}
            >
              {themeConfig.templateName}
            </Typography>
          </Box>

          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant='h5' sx={{ fontWeight: 600, marginBottom: 1.5 }}>
              Forgot Password
            </Typography>
            <Typography variant='body2'>Enter your email to receive OTP</Typography>
          </Box>

          <form noValidate autoComplete='off' onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label='Email'
              sx={{ marginBottom: 4 }}
              value={values.email}
              onChange={handleChange('email')}
              error={Boolean(error)}
              helperText={error}
            />
            <Button fullWidth size='large' type='submit' variant='contained' disabled={isMutating}>
              {isMutating ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

ForgotPasswordPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

export default ForgotPasswordPage
