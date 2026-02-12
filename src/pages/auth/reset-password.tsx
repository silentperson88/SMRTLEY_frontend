// ** React Imports
import { useState, ChangeEvent, FormEvent, MouseEvent, ReactNode } from 'react'

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
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import { FormHelperText } from '@mui/material'

// ** Icons Imports
import EyeOutline from 'mdi-material-ui/EyeOutline'
import EyeOffOutline from 'mdi-material-ui/EyeOffOutline'

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
  newPassword: string
  confirmPassword: string
  showPassword: boolean
}

// ** Styled Components
const Card = styled(MuiCard)<CardProps>(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '28rem' }
}))

const ResetPasswordPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const snackBar = useSnackbar()
  const [values, setValues] = useState<State>({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  })
  const [errors, setErrors] = useState<State>({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  })

  const { trigger: resetPassword, isMutating } = useMutationSWR<
    { message: string },
    { email: string; otp: string; new_password: string }
  >(ENDURL.RESET_PASSWORD)

  const handleChange = (prop: keyof State) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value })
  }

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword })
  }

  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const validate = () => {
    const errorState = {
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
      showPassword: false
    }

    if (!values.email.trim()) errorState.email = 'Email is required'
    if (!values.otp.trim()) errorState.otp = 'OTP is required'
    if (!values.newPassword) errorState.newPassword = 'New password is required'
    if (!values.confirmPassword) errorState.confirmPassword = 'Confirm password is required'
    if (values.newPassword && values.confirmPassword && values.newPassword !== values.confirmPassword) {
      errorState.confirmPassword = 'Passwords do not match'
    }

    setErrors(errorState)
    return Object.values(errorState).every(x => x === '' || x === false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return

    const res = await resetPassword({
      email: values.email,
      otp: values.otp,
      new_password: values.newPassword
    })

    if (res) {
      snackBar.showSnackbar('Password reset successfully. Please login.', 'success')
      router.push('/auth/login')
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
              Reset Password
            </Typography>
            <Typography variant='body2'>Enter email, OTP and new password</Typography>
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
            <FormControl fullWidth sx={{ marginBottom: 4 }}>
              <InputLabel htmlFor='auth-reset-password'>New Password</InputLabel>
              <OutlinedInput
                label='New Password'
                value={values.newPassword}
                id='auth-reset-password'
                onChange={handleChange('newPassword')}
                type={values.showPassword ? 'text' : 'password'}
                error={Boolean(errors.newPassword)}
                endAdornment={
                  <InputAdornment position='end'>
                    <IconButton
                      edge='end'
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      aria-label='toggle password visibility'
                    >
                      {values.showPassword ? <EyeOutline fontSize='small' /> : <EyeOffOutline fontSize='small' />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              <FormHelperText sx={{ color: 'error.main' }}>{errors.newPassword}</FormHelperText>
            </FormControl>
            <FormControl fullWidth sx={{ marginBottom: 4 }}>
              <InputLabel htmlFor='auth-reset-confirm'>Confirm Password</InputLabel>
              <OutlinedInput
                label='Confirm Password'
                value={values.confirmPassword}
                id='auth-reset-confirm'
                onChange={handleChange('confirmPassword')}
                type={values.showPassword ? 'text' : 'password'}
                error={Boolean(errors.confirmPassword)}
                endAdornment={
                  <InputAdornment position='end'>
                    <IconButton
                      edge='end'
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      aria-label='toggle password visibility'
                    >
                      {values.showPassword ? <EyeOutline fontSize='small' /> : <EyeOffOutline fontSize='small' />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              <FormHelperText sx={{ color: 'error.main' }}>{errors.confirmPassword}</FormHelperText>
            </FormControl>
            <Button fullWidth size='large' type='submit' variant='contained' disabled={isMutating}>
              {isMutating ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

ResetPasswordPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

export default ResetPasswordPage
