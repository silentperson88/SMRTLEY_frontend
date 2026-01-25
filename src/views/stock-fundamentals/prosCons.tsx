// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { styled, useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import MuiDivider, { DividerProps } from '@mui/material/Divider'

// ** Icons Imports (Requires @mui/icons-material package)
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'

// Assuming this Fundamental type is defined elsewhere
import { Fundamental } from 'src/pages/stock-fundamental/[symbol]'

// Styled Divider component
const Divider = styled(MuiDivider)<DividerProps>(({ theme }) => ({
  margin: theme.spacing(5, 0),
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('md')]: {
    borderRight: 'none',
    margin: theme.spacing(0, 5),
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}))

const ProsCons = (props: { fundamentals: Fundamental }) => {
  const { pros, cons } = props?.fundamentals
  const theme = useTheme()

  const ListItem = ({ item, isPro }: { item: string; isPro: boolean }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start', // Align items to the top for better text wrap alignment
        mb: 4 // Increased spacing between items
      }}
    >
      <Box
        sx={{
          minWidth: 32,
          display: 'flex',
          justifyContent: 'center',
          mt: 0.5 // slight margin top to align icon with first line of text
        }}
      >
        {isPro ? (
          <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
        ) : (
          <HighlightOffIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
        )}
      </Box>
      <Box sx={{ ml: 4, width: '100%' }}>
        <Typography variant='body2' sx={{ color: theme.palette.text.primary }}>
          {item}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Card sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: ['column', 'column', 'row'] }}>
      {/* Pros Section */}
      <Box sx={{ width: '100%' }}>
        <CardHeader
          title='Pros'
          titleTypographyProps={{
            variant: 'h5', // Larger, bolder heading
            color: theme.palette.success.dark // Green color for Pros heading
          }}
          sx={{ pb: 5 }} // Adjust padding to allow custom spacing below
        />
        <CardContent sx={{ pt: 3, pb: theme => `${theme.spacing(5.5)} !important` }}>
          {pros?.map((item: string, index: number) => (
            <ListItem key={index} item={item} isPro={true} />
          ))}
        </CardContent>
      </Box>

      <Divider flexItem />

      {/* Cons Section */}
      <Box sx={{ width: '100%' }}>
        <CardHeader
          title='Cons'
          titleTypographyProps={{
            variant: 'h5', // Larger, bolder heading
            color: theme.palette.error.dark // Red color for Cons heading
          }}
          sx={{ pb: 5 }}
        />
        <CardContent sx={{ pt: 3, pb: theme => `${theme.spacing(5.5)} !important` }}>
          {cons?.map((item: string, index: number) => (
            <ListItem key={index} item={item} isPro={false} />
          ))}
        </CardContent>
      </Box>
    </Card>
  )
}

export default ProsCons
