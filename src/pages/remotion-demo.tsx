import dynamic from 'next/dynamic'
import type { NextPage } from 'next'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  defaultStockNewsShortProps,
  StockNewsShortComposition
} from 'src/remotion/StockNewsShortComposition'

const Player = dynamic(() => import('@remotion/player').then(mod => mod.Player), {
  ssr: false
})

const RemotionDemoPage: NextPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          Remotion Shorts Demo
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
          Demo video template for generating stock + news shorts automatically.
        </Typography>
      </Grid>

      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Live Preview (9:16)
            </Typography>
            <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black' }}>
              <Player
                component={StockNewsShortComposition}
                durationInFrames={300}
                fps={30}
                compositionWidth={1080}
                compositionHeight={1920}
                style={{ width: '100%', maxWidth: 420, aspectRatio: '9 / 16', margin: '0 auto' }}
                inputProps={defaultStockNewsShortProps}
                controls
                loop
                autoPlay
                acknowledgeRemotionLicense
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h6'>What this setup gives you</Typography>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label='Template-based videos' color='primary' />
              <Chip label='Stock/news input props' />
              <Chip label='CLI rendering ready' />
            </Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant='subtitle2'>Run Remotion Studio</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              npm run remotion:studio
            </Typography>
            <Typography variant='subtitle2' sx={{ mt: 2 }}>
              Render demo MP4
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              npm run remotion:render:demo
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button
                href='https://www.remotion.dev/docs'
                target='_blank'
                rel='noreferrer'
                variant='outlined'
                endIcon={<OpenInNewIcon />}
              >
                Remotion Docs
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default RemotionDemoPage
