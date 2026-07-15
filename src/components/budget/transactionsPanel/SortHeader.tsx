import TableCell from '@mui/material/TableCell'
import TableSortLabel from '@mui/material/TableSortLabel'
import type { SortKey } from './helpers'

export function SortHeader({
  col, sortKey, sortDir, onSort, align, children,
}: {
  col: SortKey
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  align?: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <TableCell align={align} sortDirection={sortKey === col ? sortDir : false}>
      <TableSortLabel
        active={sortKey === col}
        direction={sortKey === col ? sortDir : 'asc'}
        onClick={() => onSort(col)}
      >
        {children}
      </TableSortLabel>
    </TableCell>
  )
}
