// ** MUI Imports
import { alpha, Theme } from '@mui/material/styles'

const Switch = (theme: Theme) => {
  return {
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            backgroundColor: alpha(theme.palette.customColors.main, 1)
          }
        }
      }
    }
  }
}

export default Switch
