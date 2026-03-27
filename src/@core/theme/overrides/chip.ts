// ** MUI Imports
import { alpha, Theme } from '@mui/material/styles'

const Chip = (theme: Theme) => {
  return {
    MuiChip: {
      styleOverrides: {
        outlined: {
          '&.MuiChip-colorDefault': {
            borderColor: alpha(theme.palette.customColors.main, 0.22)
          }
        },
        deleteIcon: {
          width: 18,
          height: 18
        }
      }
    }
  }
}

export default Chip
