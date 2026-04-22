import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useAsOfDate } from 'src/contexts/AsOfDateContext'

type Props = {
  compact?: boolean
  dark?: boolean
}

const AsOfDateField = ({ compact = false, dark = false }: Props) => {
  const { asOfDate, setAsOfDate } = useAsOfDate()

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      {!compact ? (
        <Typography
          variant='body2'
          sx={{
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: dark ? 'rgba(255,255,255,0.8)' : 'text.secondary'
          }}
        >
          As Of Date
        </Typography>
      ) : null}
      <TextField
        size='small'
        type='date'
        value={asOfDate}
        onChange={event => setAsOfDate(event.target.value)}
        inputProps={{ max: '2099-12-31' }}
        sx={{
          minWidth: compact ? 150 : 170,
          '& .MuiInputBase-root': dark
            ? {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.06)',
                borderRadius: 1.5
              }
            : undefined,
          '& .MuiOutlinedInput-notchedOutline': dark
            ? {
                borderColor: 'rgba(255,255,255,0.2)'
              }
            : undefined
        }}
      />
    </Box>
  )
}

export default AsOfDateField
