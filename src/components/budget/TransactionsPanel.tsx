'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { useViewPreference } from '@/hooks/useViewPreference'
import { logger } from '@/lib/logger'
import { AddTransactionModal } from './modals/AddTransactionModal'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import TabIcon from '@mui/icons-material/Tab'
import type { ViewMode } from '@/hooks/useViewPreference'

interface Props {
  budgetId: string
}

function formatMoney(units: bigint, nanos: number): string {
  const total = Number(units) + nanos / 1e9
  return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function TransactionTable({ budgetId, typeId, onDeleted }: { budgetId: string; typeId: number; onDeleted: () => void }) {
  const { showError } = useSnackbar()
  const client = useClient(BudgetService)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', budgetId, typeId],
    queryFn: () => client.listTransactions({ budgetId, transactionTypeId: typeId }),
  })

  const { mutateAsync: doDelete } = useMutation({
    mutationFn: (id: string) => client.deleteTransaction({ id, budgetId }),
  })

  async function handleDelete(id: string) {
    try {
      await doDelete(id)
      logger.info('transaction.delete', { budgetId, id })
      onDeleted()
    } catch (err) {
      showError(err)
    }
  }

  if (isLoading) return <CircularProgress size={20} />

  const transactions = data?.transactions ?? []

  if (transactions.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No transactions yet.</Typography>
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell align="right">Amount</TableCell>
          <TableCell align="right">Planned</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id} hover>
            <TableCell>{t.name}</TableCell>
            <TableCell align="right">{formatMoney(t.amount?.units ?? 0n, t.amount?.nanos ?? 0)}</TableCell>
            <TableCell align="right">{formatMoney(t.plannedAmount?.units ?? 0n, t.plannedAmount?.nanos ?? 0)}</TableCell>
            <TableCell align="right">
              <IconButton size="small" onClick={() => handleDelete(t.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function TransactionsPanel({ budgetId }: Props) {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useViewPreference('tabbed')
  const [addOpen, setAddOpen] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['transactions', budgetId] })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>Transactions</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(_, v: ViewMode) => v && setViewMode(v)}
          >
            <ToggleButton value="tabbed"><TabIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="split"><ViewStreamIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setAddOpen(true)}>
            Add
          </Button>
        </Box>
      </Box>

      {viewMode === 'tabbed' ? (
        <>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 1 }}>
            <Tab label="Fixed" />
            <Tab label="Variable" />
          </Tabs>
          <TransactionTable
            key={tabIndex}
            budgetId={budgetId}
            typeId={tabIndex === 0 ? 1 : 2}
            onDeleted={refresh}
          />
        </>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>FIXED</Typography>
            <TransactionTable budgetId={budgetId} typeId={1} onDeleted={refresh} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>VARIABLE</Typography>
            <TransactionTable budgetId={budgetId} typeId={2} onDeleted={refresh} />
          </Box>
        </Box>
      )}

      <AddTransactionModal
        budgetId={budgetId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onDone={() => { setAddOpen(false); refresh() }}
      />
    </Box>
  )
}
