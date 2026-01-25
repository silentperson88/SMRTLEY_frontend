import * as React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Paper, { PaperProps } from '@mui/material/Paper'
import Draggable from 'react-draggable'
import { reviewModal } from 'src/pages/raw-stocks'
import { TextField } from '@mui/material'

function PaperComponent(props: PaperProps) {
  return (
    <Draggable handle='#draggable-dialog-title' cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  )
}

interface modalProps {
  handleClose: () => void
  handleUpdateStatus: (status: string, screenerUrl?: string) => void
  liveStock: reviewModal
  isLoading: boolean
}

export default function ReviewRawStock({ handleClose, handleUpdateStatus, liveStock, isLoading }: modalProps) {
  const [screenerUrl, setScreenerUrl] = React.useState<string>('')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScreenerUrl(event.target.value)
  }

  return (
    <React.Fragment>
      <Dialog
        open={liveStock.open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby='draggable-dialog-title'
      >
        {liveStock.data.length === 0 ? (
          <div style={{ margin: '0 250px 0 0px' }}>
            <DialogTitle style={{ cursor: 'move' }} id='draggable-dialog-title'>
              {liveStock.name}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>{liveStock.error}</DialogContentText>
            </DialogContent>
          </div>
        ) : (
          <div style={{ margin: '0 250px 0 0px' }}>
            <DialogTitle style={{ cursor: 'move' }} id='draggable-dialog-title'>
              {`${liveStock.data[0].tradingSymbol} (${liveStock.data[0].exchange})`}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>LTP: {liveStock.data[0].ltp}</DialogContentText>
              <DialogContentText>Open: {liveStock.data[0].open}</DialogContentText>
              <DialogContentText>High: {liveStock.data[0].high}</DialogContentText>
              <DialogContentText>Low: {liveStock.data[0].low}</DialogContentText>
              <DialogContentText>Close: {liveStock.data[0].close}</DialogContentText>
            </DialogContent>
          </div>
        )}

        {/* Input Field for adding screener url */}
        {liveStock.data.length !== 0 && (
          <DialogContent>
            <TextField
              autoFocus
              margin='dense'
              id='name'
              label='Screener URL'
              type='text'
              fullWidth
              variant='standard'
              value={screenerUrl}
              onChange={handleChange}
            />
          </DialogContent>
        )}

        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          {liveStock.data.length === 0 ? (
            <Button color='error' onClick={() => handleUpdateStatus('rejected')}>
              {isLoading ? 'Rejecting...' : 'Reject'}
            </Button>
          ) : (
            <>
              <Button color='error' onClick={() => handleUpdateStatus('rejected')}>
                {isLoading ? 'Rejecting...' : 'Reject'}
              </Button>
              <Button color='success' onClick={() => handleUpdateStatus('approved', screenerUrl)}>
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}
