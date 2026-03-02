// ** MUI Imports
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import { Theme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

const FooterContent = () => {
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ mr: 2 }} color='text.secondary'>
        {`Copyright ${new Date().getFullYear()} Run4Dream. All rights reserved.`}
      </Typography>
      {hidden ? null : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', '& :not(:last-child)': { mr: 4 } }}>
          <Link target='_blank' rel='noreferrer' href='https://www.youtube.com/@Run4Dream'>
            YouTube
          </Link>
          <Link target='_blank' rel='noreferrer' href='https://www.instagram.com/run4dream'>
            Instagram
          </Link>
          <Link target='_blank' rel='noreferrer' href='https://www.facebook.com/Run4Dream'>
            Facebook
          </Link>
        </Box>
      )}
    </Box>
  )
}

export default FooterContent
