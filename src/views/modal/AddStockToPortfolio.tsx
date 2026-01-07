import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import DialogTitle from '@mui/material/DialogTitle'
import Paper, { PaperProps } from '@mui/material/Paper'
import Draggable from 'react-draggable'
import Grid from '@mui/material/Grid'
import { FormControl, FormHelperText, InputLabel, MenuItem, TextField } from '@mui/material'

// import { DatePicker } from '@mui/lab'

function PaperComponent(props: PaperProps) {
  return (
    <Draggable handle='#draggable-dialog-title' cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  )
}

interface portFolioForm {
  liveStock: string
  atPrice: number
  quantity: number
  purchasedDate: Date | null | undefined
  type: string
}

interface portfolio {
  open: boolean
  data: portFolioForm
  error: any
}

interface modalProps {
  handleClose: () => void
  handleAdd: () => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleTypeChange: (e: SelectChangeEvent) => void
  portfolioStock: portfolio
}

export default function DraggableDialog({
  handleClose,
  handleAdd,
  handleChange,
  handleTypeChange,
  portfolioStock
}: modalProps) {
  console.log(portfolioStock)

  //   const [date, setDate] = useState<Date | null | undefined>(null)

  //   const CustomInput = forwardRef((props, ref) => {
  //     return <TextField fullWidth {...props} inputRef={ref} label='Birth Date' autoComplete='off' />
  //   })

  return (
    <React.Fragment>
      <Dialog
        open={portfolioStock.open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby='draggable-dialog-title'
      >
        <div style={{ margin: '0 0px 0 0px' }}>
          <DialogTitle style={{ cursor: 'move', padding: '10px' }} id='draggable-dialog-title'>
            Add to Portfolio
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={5} sx={{ marginTop: '10px', paddingTop: '0px' }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Buy/Sell Price'
                  name='atPrice'
                  type='number'
                  placeholder='0'
                  value={portfolioStock.data.atPrice}
                  onChange={handleChange}
                  error={Boolean(portfolioStock.error.atPrice)}
                  helperText={portfolioStock.error.atPrice}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Quantity'
                  name='quantity'
                  type='number'
                  value={portfolioStock.data.quantity}
                  placeholder='Carter'
                  onChange={handleChange}
                  error={Boolean(portfolioStock.error.quantity)}
                  helperText={portfolioStock.error.quantity}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id='form-layouts-separator-select-label'>Type</InputLabel>
                  <Select
                    label='Country'
                    defaultValue=''
                    id='form-layouts-separator-select'
                    labelId='form-layouts-separator-select-label'
                    name='type'
                    value={portfolioStock.data.type}
                    onChange={handleTypeChange}
                    error={Boolean(portfolioStock.error.type)}
                  >
                    <MenuItem value='buy'>Buy</MenuItem>
                    <MenuItem value='sell'>Sell</MenuItem>
                  </Select>
                  {portfolioStock.error.type && (
                    <FormHelperText error sx={{ color: 'error' }}>
                      {portfolioStock.error.type}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                {/* <DatePicker
                  selected={date}
                  showYearDropdown
                  showMonthDropdown
                  placeholderText='MM-DD-YYYY'
                  customInput={<CustomInput />}
                  id='form-layouts-separator-date'
                  onChange={(date: Date | null | undefined) => setDate(date)}
                /> */}
                <TextField
                  fullWidth
                  label='Date of Buy | Sell'
                  name='purchasedDate'
                  type='date'
                  value={portfolioStock.data.purchasedDate}
                  onChange={handleChange}
                  error={Boolean(portfolioStock.error.purchasedDate)}
                  helperText={portfolioStock.error.purchasedDate}
                />
              </Grid>
            </Grid>
          </DialogContent>
        </div>

        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}
