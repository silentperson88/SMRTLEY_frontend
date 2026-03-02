import { useMemo, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableContainer from '@mui/material/TableContainer'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'

// ** Types Imports

type CellValue = string | number

export interface TableDataRow {
  id: string
  label: string
  cells: CellValue[]
  level: number
  parentId?: string
  hasChildren?: boolean
}

export interface TableData {
  columns: string[]
  rows: TableDataRow[]
}

// Styled TableCell for the sticky column header
const StickyHeaderCell = styled(TableCell)(({ theme }) => ({
  position: 'sticky',
  left: 0,
  zIndex: 10, // Ensure header is above body cells when scrolling
  backgroundColor: theme.palette.background.paper // Match card background
}))

// Styled TableCell for the sticky column body cells
const StickyBodyCell = styled(TableCell)(({ theme }) => ({
  position: 'sticky',
  left: 0,
  zIndex: 5, // Ensure body cells are above other scrolling body cells
  backgroundColor: theme.palette.background.paper, // Match card background
  whiteSpace: 'nowrap'
}))

const FundamentalTable = (props: { data: TableData }) => {
  const { columns, rows } = props?.data
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const visibleRows = useMemo(
    () =>
      rows.filter(row => {
        if (!row.parentId) return true

        let currentParentId = row.parentId
        while (currentParentId) {
          if (!expandedIds[currentParentId]) return false
          const parent = rows.find(r => r.id === currentParentId)
          if (!parent || !parent.parentId) break
          currentParentId = parent.parentId
        }

        return true
      }),
    [rows, expandedIds]
  )

  const toggleRow = (rowId: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }))
  }

  return (
    <Card>
      {/* Set max height and overflowX to auto to enable scrolling */}
      <TableContainer sx={{ maxHeight: 440, overflowX: 'auto' }}>
        {/* Set a minimum width greater than the container width to force scrollability */}
        <Table sx={{ minWidth: 900 }} aria-label='table in dashboard' stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column, index: number) =>
                index === 0 ? (
                  <StickyHeaderCell key={index}>{column}</StickyHeaderCell>
                ) : (
                  <TableCell key={index}>{column}</TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map(row => (
              <TableRow hover key={row.id} sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                <StickyBodyCell sx={{ py: theme => `${theme.spacing(0.5)} !important` }}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: '0.875rem !important' }}>
                    <span style={{ display: 'inline-block', width: `${row.level * 14}px` }} />
                    {row.hasChildren ? (
                      <IconButton size='small' onClick={() => toggleRow(row.id)} sx={{ mr: 1 }}>
                        {expandedIds[row.id] ? '-' : '+'}
                      </IconButton>
                    ) : (
                      <span style={{ display: 'inline-block', width: '28px', marginRight: '8px' }} />
                    )}
                    {row.label}
                  </Typography>
                </StickyBodyCell>
                {row.cells.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell ?? '-'}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default FundamentalTable
