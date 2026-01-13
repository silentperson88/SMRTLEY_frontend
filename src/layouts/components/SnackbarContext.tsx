import React, { createContext, useContext, useState } from 'react'
import { Snackbar, Alert } from '@mui/material'

type SnackbarSeverity = 'error' | 'success' | 'warning' | 'info'

interface SnackbarState {
  open: boolean
  message: string
  severity: SnackbarSeverity
}

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void
}

const SnackbarContext = createContext<SnackbarContextType | null>(null)

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'error'
  })

  const showSnackbar = (message: string, severity: SnackbarSeverity = 'error') => {
    setState({ open: true, message, severity })
  }

  const handleClose = () => {
    setState(prev => ({ ...prev, open: false }))
  }

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={state.severity} variant='filled'>
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

export const useSnackbar = () => {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar must be used inside SnackbarProvider')

  return ctx
}
