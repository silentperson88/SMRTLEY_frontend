// ** React Imports
import { useState, ChangeEvent, FormEvent, ReactNode, useEffect } from 'react'

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
  otp: string
}

interface VerifyBody {
  email: string
  otp: string
}

// ** Styled Components
const Card = styled(MuiCard)<CardProps>(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '28rem' }
}))

const VerifyEmailPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const snackBar = useSnackbar()
  const [values, setValues] = useState<State>({ email: '', otp: '' })
  const [errors, setErrors] = useState<State>({ email: '', otp: '' })
  const [generalError, setGeneralError] = useState<string>('')
  const [cooldown, setCooldown] = useState<number>(60)
  const [canResend, setCanResend] = useState<boolean>(false)

  const { trigger: verifyEmail, error, isMutating } = useMutationSWR<{ isEmailVerified: boolean }, VerifyBody>(
    ENDURL.VERIFY_EMAIL
  )
  const { trigger: resendOtp, isMutating: isResending } = useMutationSWR<{ message: string }, { email: string }>(
    ENDURL.RESEND_OTP
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const emailFromSession = sessionStorage.getItem('verify_email')
    sessionStorage.removeItem('verify_email')

    if (!emailFromSession) {
      router.replace('/auth/register')
      return
    }

    setValues(prev => ({ ...prev, email: emailFromSession }))
  }, [router])

  useEffect(() => {
    if (error) {
      setGeneralError(error?.response?.data?.message || 'Unable to verify email')
    }
  }, [error])

  useEffect(() => {
    if (canResend) return

    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [canResend])

  const handleChange = (prop: keyof State) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value })
  }

  const validate = () => {
    const errorState = { email: '', otp: '' }

    if (!values.email.trim()) errorState.email = 'Email is required'
    if (!values.otp.trim()) errorState.otp = 'OTP is required'

    setErrors(errorState)

    return Object.values(errorState).every(x => x === '')
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGeneralError('')
    if (!validate()) return

    const res = await verifyEmail({ email: values.email, otp: values.otp })
    if (res) {
      snackBar.showSnackbar('Email verified successfully. Please login.', 'success')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }
  }

  const handleResend = async () => {
    if (!canResend || !values.email) return
    setGeneralError('')
    const res = await resendOtp({ email: values.email })
    if (res) {
      snackBar.showSnackbar('OTP sent to your email', 'success')
      setCanResend(false)
      setCooldown(60)
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
              Verify your email
            </Typography>
            <Typography variant='body2'>Enter the OTP sent to your email</Typography>
            {generalError && (
              <Typography variant='body2' color='error' sx={{ mt: 2 }}>
                {generalError}
              </Typography>
            )}
          </Box>

          <form noValidate autoComplete='off' onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label='Email'
              sx={{ marginBottom: 4 }}
              value={values.email}
              onChange={handleChange('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
            <TextField
              fullWidth
              label='OTP'
              sx={{ marginBottom: 4 }}
              value={values.otp}
              onChange={handleChange('otp')}
              error={Boolean(errors.otp)}
              helperText={errors.otp}
            />
            <Button fullWidth size='large' type='submit' variant='contained' disabled={isMutating}>
              {isMutating ? 'Verifying...' : 'Verify Email'}
            </Button>
            <Button
              fullWidth
              size='large'
              variant='outlined'
              sx={{ mt: 3 }}
              disabled={!canResend || isResending}
              onClick={handleResend}
            >
              {isResending ? 'Sending OTP...' : canResend ? 'Resend OTP' : `Resend OTP in ${cooldown}s`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

VerifyEmailPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

export default VerifyEmailPage
