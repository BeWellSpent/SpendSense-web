'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { Transaction, Category, PaymentMethod, BudgetPerson } from '@/gen/spendsense/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { useViewPreference } from '@/hooks/useViewPreference'
import { logger } from '@/lib/logger'
import { AddTransactionModal } from './modals/AddTransactionModal'
import { EditTransactionModal } from './modals/EditTransactionModal'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableFooter from '@mui/material/TableFooter'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import TabIcon from '@mui/icons-material/Tab'
import type { ViewMode } from '@/hooks/useViewPreference'

interface Props {
  budgetPeriodId: string
  budgetProfileId: string
  isEditable?: boolean
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatDate(ts: { seconds: bigint } | undefined): string {
  if (!ts || ts.seconds === 0n) return '—'
  return new Date(Number(ts.seconds) * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function txAmount(t: Transaction): number {
  return Number(t.amount?.units ?? 0n) + (t.amount?.nanos ?? 0) / 1e9
}

type SortKey = 'name' | 'day' | 'category' | 'method' | 'owner' | 'amount'

function resolveOwner(t: Transaction, methodMap: Map<string, PaymentMethod>, personMap: Map<string, BudgetPerson>): string {
  const method = t.paymentMethodId ? methodMap.get(t.paymentMethodId) : undefined
  const person = method?.budgetPersonId && method.budgetPersonId !== 0n
    ? personMap.get(method.budgetPersonId.toString())
    : undefined
  return person?.userName ?? ''
}

function resolveDay(t: Transaction): number {
  return Number(t.date?.seconds ?? 0n)
}

function compareTransactions(
  a: Transaction,
  b: Transaction,
  key: SortKey,
  dir: 'asc' | 'desc',
  categoryMap: Map<number, Category>,
  methodMap: Map<string, PaymentMethod>,
  personMap: Map<string, BudgetPerson>,
): number {
  const sign = dir === 'asc' ? 1 : -1

  let primary = 0
  switch (key) {
    case 'name':
      primary = a.name.localeCompare(b.name) * sign
      break
    case 'day':
      primary = (resolveDay(a) - resolveDay(b)) * sign
      break
    case 'category': {
      const ca = a.categoryId ? (categoryMap.get(a.categoryId)?.name ?? '') : ''
      const cb = b.categoryId ? (categoryMap.get(b.categoryId)?.name ?? '') : ''
      primary = ca.localeCompare(cb) * sign
      break
    }
    case 'method': {
      const ma = a.paymentMethodId ? (methodMap.get(a.paymentMethodId)?.name ?? '') : ''
      const mb = b.paymentMethodId ? (methodMap.get(b.paymentMethodId)?.name ?? '') : ''
      primary = ma.localeCompare(mb) * sign
      break
    }
    case 'owner':
      primary = resolveOwner(a, methodMap, personMap).localeCompare(resolveOwner(b, methodMap, personMap)) * sign
      break
    case 'amount':
      primary = (txAmount(a) - txAmount(b)) * sign
      break
  }

  if (primary !== 0) return primary

  // Tiebreak: day ASC, then owner ASC
  if (key !== 'day') {
    const dayDiff = resolveDay(a) - resolveDay(b)
    if (dayDiff !== 0) return dayDiff
  }
  if (key !== 'owner') {
    return resolveOwner(a, methodMap, personMap).localeCompare(resolveOwner(b, methodMap, personMap))
  }
  return 0
}

function SortHeader({
  col,
  sortKey,
  sortDir,
  onSort,
  children,
}: {
  col: SortKey
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  children: React.ReactNode
}) {
  return (
    <TableCell sortDirection={sortKey === col ? sortDir : false}>
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

interface TableProps {
  transactions: Transaction[]
  isLoading: boolean
  isEditable: boolean
  label: string
  categoryMap: Map<number, Category>
  methodMap: Map<string, PaymentMethod>
  personMap: Map<string, BudgetPerson>
  onDeleted: () => void
  onEdit: (t: Transaction) => void
}

function TransactionTable({
  transactions,
  isLoading,
  isEditable,
  label,
  categoryMap,
  methodMap,
  personMap,
  onDeleted,
  onEdit,
}: TableProps) {
  const t = useTranslations('budget.transactions')
  const { showError } = useSnackbar()
  const client = useClient(BudgetService)
  const [sortKey, setSortKey] = useState<SortKey>('day')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const { mutateAsync: doDelete } = useMutation({
    mutationFn: (id: string) => client.deleteTransaction({ id }),
  })

  async function handleDelete(id: string) {
    try {
      await doDelete(id)
      logger.info('transaction.delete', { id })
      onDeleted()
    } catch (err) {
      showError(err)
    }
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...transactions].sort((a, b) =>
    compareTransactions(a, b, sortKey, sortDir, categoryMap, methodMap, personMap)
  )

  const total = transactions.reduce((sum, t) => sum + txAmount(t), 0)
  const colSpan = isEditable ? 7 : 6

  if (isLoading) return <CircularProgress size={20} />

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 560 }}>
        <TableHead>
          <TableRow>
            <SortHeader col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>{t('columns.item')}</SortHeader>
            <SortHeader col="day" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>{t('columns.day')}</SortHeader>
            <SortHeader col="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>{t('columns.category')}</SortHeader>
            <SortHeader col="method" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>{t('columns.paymentMethod')}</SortHeader>
            <SortHeader col="owner" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>{t('columns.owner')}</SortHeader>
            <TableCell align="right" sortDirection={sortKey === 'amount' ? sortDir : false}>
              <TableSortLabel
                active={sortKey === 'amount'}
                direction={sortKey === 'amount' ? sortDir : 'asc'}
                onClick={() => handleSort('amount')}
              >
                {t('columns.amount')}
              </TableSortLabel>
            </TableCell>
            {isEditable && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                {t('empty', { label })}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((t) => {
              const category = t.categoryId ? categoryMap.get(t.categoryId) : undefined
              const method = t.paymentMethodId ? methodMap.get(t.paymentMethodId) : undefined
              const person = method?.budgetPersonId && method.budgetPersonId !== 0n
                ? personMap.get(method.budgetPersonId.toString())
                : undefined
              const personName = person?.userName

              return (
                <TableRow key={t.id} hover>
                  <TableCell>{t.name}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(t.date)}</TableCell>
                  <TableCell>
                    {category
                      ? <Chip label={category.name} size="small" sx={category.color ? { bgcolor: category.color, color: 'white' } : {}} />
                      : <Typography variant="body2" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    {method
                      ? <Chip label={method.name} size="small" sx={method.color ? { bgcolor: method.color, color: 'white' } : {}} />
                      : <Typography variant="body2" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    {personName
                      ? <Chip label={personName} size="small" sx={person?.color ? { bgcolor: person.color, color: 'white' } : {}} />
                      : <Typography variant="body2" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {formatMoney(txAmount(t))}
                  </TableCell>
                  {isEditable && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <IconButton size="small" onClick={() => onEdit(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(t.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
        </TableBody>
        {sorted.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell
                colSpan={isEditable ? 5 : 4}
                align="right"
                sx={{ fontWeight: 700, color: 'text.primary', borderTop: 2, borderColor: 'divider' }}
              >
                {t('subtotal', { label })}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, color: 'text.primary', borderTop: 2, borderColor: 'divider', whiteSpace: 'nowrap' }}
              >
                {formatMoney(total)}
              </TableCell>
              {isEditable && <TableCell sx={{ borderTop: 2, borderColor: 'divider' }} />}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </Box>
  )
}

export function TransactionsPanel({ budgetPeriodId, budgetProfileId, isEditable = true }: Props) {
  const t = useTranslations('budget.transactions')
  const queryClient = useQueryClient()
  const client = useClient(BudgetService)
  const [viewMode, setViewMode] = useViewPreference('tabbed')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [tabIndex, setTabIndex] = useState(0)

  const { data: fixedData, isLoading: fixedLoading } = useQuery({
    queryKey: ['transactions', budgetPeriodId, 1],
    queryFn: () => client.listTransactions({ budgetPeriodId, transactionTypeId: 1 }),
  })
  const { data: variableData, isLoading: variableLoading } = useQuery({
    queryKey: ['transactions', budgetPeriodId, 2],
    queryFn: () => client.listTransactions({ budgetPeriodId, transactionTypeId: 2 }),
  })
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => client.listCategories({}),
  })
  const { data: methodsData } = useQuery({
    queryKey: ['paymentMethods', budgetProfileId],
    queryFn: () => client.listPaymentMethods({ budgetProfileId }),
  })
  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })

  const categoryMap = new Map((categoriesData?.categories ?? []).map((c) => [c.id, c]))
  const methodMap = new Map((methodsData?.methods ?? []).map((m) => [m.id, m]))
  const personMap = new Map((peopleData?.people ?? []).map((p) => [p.id.toString(), p]))

  const fixedTxs = fixedData?.transactions ?? []
  const variableTxs = variableData?.transactions ?? []
  const fixedTotal = fixedTxs.reduce((sum, t) => sum + txAmount(t), 0)
  const variableTotal = variableTxs.reduce((sum, t) => sum + txAmount(t), 0)
  const grandTotal = fixedTotal + variableTotal

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['transactions', budgetPeriodId] })

  const sharedTableProps = { isEditable, categoryMap, methodMap, personMap, onDeleted: refresh, onEdit: setEditTarget }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>{t('title')}</Typography>
          {grandTotal > 0 && (
            <Typography variant="subtitle2" color="text.secondary">
              {t('grandTotal', { amount: formatMoney(grandTotal) })}
            </Typography>
          )}
        </Box>
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
          {isEditable && (
            <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setAddOpen(true)}>
              {t('add')}
            </Button>
          )}
        </Box>
      </Box>

      {viewMode === 'tabbed' ? (
        <>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 1 }}>
            <Tab label={fixedTxs.length ? `${t('fixed')} · ${formatMoney(fixedTotal)}` : t('fixed')} />
            <Tab label={variableTxs.length ? `${t('variable')} · ${formatMoney(variableTotal)}` : t('variable')} />
          </Tabs>
          {tabIndex === 0
            ? <TransactionTable {...sharedTableProps} transactions={fixedTxs} isLoading={fixedLoading} label={t('fixed')} />
            : <TransactionTable {...sharedTableProps} transactions={variableTxs} isLoading={variableLoading} label={t('variable')} />
          }
        </>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>{t('fixed').toUpperCase()}</Typography>
            <TransactionTable {...sharedTableProps} transactions={fixedTxs} isLoading={fixedLoading} label={t('fixed')} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>{t('variable').toUpperCase()}</Typography>
            <TransactionTable {...sharedTableProps} transactions={variableTxs} isLoading={variableLoading} label={t('variable')} />
          </Box>
        </Box>
      )}

      {isEditable && (
        <AddTransactionModal
          budgetPeriodId={budgetPeriodId}
          budgetProfileId={budgetProfileId}
          open={addOpen}
          defaultTypeId={viewMode === 'tabbed' ? (tabIndex === 0 ? 1 : 2) : 1}
          onClose={() => setAddOpen(false)}
          onDone={() => { setAddOpen(false); refresh() }}
        />
      )}

      {editTarget && (
        <EditTransactionModal
          budgetProfileId={budgetProfileId}
          transaction={editTarget}
          onClose={() => setEditTarget(null)}
          onDone={() => { setEditTarget(null); refresh() }}
        />
      )}
    </Box>
  )
}
