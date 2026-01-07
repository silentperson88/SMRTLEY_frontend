import * as React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Paper, { PaperProps } from '@mui/material/Paper'
import Draggable from 'react-draggable'

function PaperComponent(props: PaperProps) {
  return (
    <Draggable handle='#draggable-dialog-title' cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  )
}

interface stock {
  exchange: string
  tradingSymbol: string
  symbolToken: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
}

interface liveStock {
  open: boolean
  name: string
  data: Array<stock>
}

interface modalProps {
  handleClose: () => void
  handleUpdateStatus: (status: string) => void
  liveStock: liveStock
}

export default function ShowStockOHCL({ handleClose, handleUpdateStatus, liveStock }: modalProps) {
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
              <DialogContentText>No Data Found </DialogContentText>
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

        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          {liveStock.data.length === 0 ? (
            <Button color='error' onClick={() => handleUpdateStatus('rejected')}>
              Reject
            </Button>
          ) : (
            <Button color='success' onClick={() => handleUpdateStatus('approved')}>
              Add
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}
