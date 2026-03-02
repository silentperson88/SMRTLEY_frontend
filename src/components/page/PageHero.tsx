import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

interface PageHeroProps {
  title: string
  subtitle: string
  primaryInfoLabel?: string
  primaryInfoValue?: string
  actionLabel?: string
  onAction?: () => void
  panelTitle: string
  panelSubtitle: string
  panelLeftLabel: string
  panelLeftValue: string
  panelRightLabel: string
  panelRightValue: string
  panelRightValueColor?: string
}

const PageHero = ({
  title,
  subtitle,
  primaryInfoLabel,
  primaryInfoValue,
  actionLabel,
  onAction,
  panelTitle,
  panelSubtitle,
  panelLeftLabel,
  panelLeftValue,
  panelRightLabel,
  panelRightValue,
  panelRightValueColor = 'success.main'
}: PageHeroProps) => {
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: theme => `1px solid ${theme.palette.divider}`,
        background: theme =>
          `radial-gradient(circle at 85% 10%, ${alpha(theme.palette.primary.main, 0.35)} 0%, transparent 42%),
           linear-gradient(135deg, #171336 0%, #1b2146 48%, #22305b 100%)`
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 42%, rgba(255, 255, 255, 0.04) 100%)',
          pointerEvents: 'none'
        }}
      />
      <CardContent sx={{ px: { xs: 4, md: 6 }, py: { xs: 5, md: 6 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems='center'>
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5}>
              <Typography variant='h4' sx={{ color: 'common.white', fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.72)', maxWidth: 560 }}>
                {subtitle}
              </Typography>
              {primaryInfoLabel && primaryInfoValue ? (
                <Typography variant='body1' sx={{ color: 'common.white', fontWeight: 600 }}>
                  {primaryInfoLabel}: {primaryInfoValue}
                </Typography>
              ) : null}
              {actionLabel ? (
                <Box>
                  <Button
                    size='small'
                    variant='contained'
                    onClick={onAction}
                    sx={{
                      px: 4,
                      py: 1.2,
                      borderRadius: 2,
                      background: 'linear-gradient(90deg, #7e5bff 0%, #5f4bda 100%)'
                    }}
                  >
                    {actionLabel}
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                borderRadius: 2,
                backgroundColor: 'rgba(25, 24, 56, 0.65)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant='body2' sx={{ color: 'common.white', fontWeight: 600, mb: 0.5 }}>
                  {panelTitle}
                </Typography>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.68)' }}>
                  {panelSubtitle}
                </Typography>
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Box
                    component='svg'
                    viewBox='0 0 300 90'
                    sx={{ width: '100%', height: 90 }}
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M4 66C22 56 34 48 52 52C70 56 80 72 98 70C116 68 126 44 144 42C162 40 170 56 188 58C206 60 214 50 232 42C250 34 266 38 296 12'
                      stroke='#66B9FF'
                      strokeWidth='4'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </Box>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.68)' }}>
                      {panelLeftLabel}
                    </Typography>
                    <Typography variant='subtitle1' sx={{ color: 'common.white', fontWeight: 700 }}>
                      {panelLeftValue}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.68)' }}>
                      {panelRightLabel}
                    </Typography>
                    <Typography variant='subtitle1' sx={{ color: panelRightValueColor, fontWeight: 700 }}>
                      {panelRightValue}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PageHero
