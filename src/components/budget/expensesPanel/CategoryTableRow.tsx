'use client'

import { useTranslations } from 'next-intl'
import type { Category, BudgetPerson, ExpenseAllocation, FixedExpense } from '@/gen/wellspent/v1/budget_pb'
import { parseMoney, type CategoryRowData } from './helpers'
import { EditCell } from './EditCell'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ClearIcon from '@mui/icons-material/Clear'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

interface Props {
  cat: Category
  people: BudgetPerson[]
  rowData: CategoryRowData
  allocMap: Map<string, ExpenseAllocation>
  fixedPlannedByPersonCat: Map<string, number>
  savingsByPerson: Map<string, number>
  canEdit: boolean
  currency: string
  locale: string
  formatMoney: (amount: number) => string
  onRemoveCategory: (categoryId: number) => void
  onUpsert: (categoryId: number, budgetPersonId: bigint, amount: number | null, existing: ExpenseAllocation | undefined) => void
  onEditFixedExpense: (fe: FixedExpense) => void
}

export function CategoryTableRow({
  cat, people, rowData, allocMap, fixedPlannedByPersonCat, savingsByPerson,
  canEdit, currency, locale, formatMoney, onRemoveCategory, onUpsert, onEditFixedExpense,
}: Props) {
  const t = useTranslations('budget.expenses')
  const { isSavings, notDueInfo, isNotDue, isFixedOnly, plannedTotal } = rowData

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {cat.color && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
          )}
          {cat.name}
          {cat.isSystem && (
            <Chip label={t('global')} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />
          )}
          {isNotDue && notDueInfo && (
            <Tooltip title={t('notDueTooltip', { date: notDueInfo.nextDue ? notDueInfo.nextDue.toLocaleDateString() : '' })}>
              <IconButton size="small" onClick={() => canEdit && onEditFixedExpense(notDueInfo.fixedExpense)}>
                <ErrorOutlineIcon sx={{ fontSize: 16 }} color="warning" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
      {people.map((p) => {
        if (isSavings) {
          const sv = savingsByPerson.get(p.id.toString())
          return (
            <TableCell key={p.id.toString()} align="right">
              {sv != null && sv > 0
                ? formatMoney(sv)
                : <Typography component="span" variant="body2" color="text.disabled">—</Typography>}
            </TableCell>
          )
        }
        const alloc = allocMap.get(`${cat.id}:${p.id}`)
        const fixedPersonAmt = fixedPlannedByPersonCat.get(`${cat.id}:${p.id}`)
        const val = alloc
          ? parseMoney(alloc.plannedAmount?.units ?? 0n, alloc.plannedAmount?.nanos ?? 0)
          : undefined
        return (
          <TableCell key={p.id.toString()} align="right">
            {isFixedOnly ? (
              fixedPersonAmt != null
                ? <Typography variant="body2" color="text.secondary">{formatMoney(fixedPersonAmt)}</Typography>
                : <Typography component="span" variant="body2" color="text.disabled">—</Typography>
            ) : alloc ? (
              canEdit ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  <EditCell value={val} onSave={(amount) => onUpsert(cat.id, p.id, amount, alloc)} currency={currency} locale={locale} />
                  <IconButton size="small" onClick={() => onUpsert(cat.id, p.id, null, alloc)}>
                    <ClearIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ textAlign: 'right' }}>
                  {val != null ? formatMoney(val) : '—'}
                </Typography>
              )
            ) : fixedPersonAmt != null ? (
              <Typography variant="body2" color="text.secondary">{formatMoney(fixedPersonAmt)}</Typography>
            ) : canEdit ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                <EditCell value={undefined} onSave={(amount) => onUpsert(cat.id, p.id, amount, undefined)} currency={currency} locale={locale} />
              </Box>
            ) : (
              <Typography component="span" variant="body2" color="text.disabled">—</Typography>
            )}
          </TableCell>
        )
      })}
      <TableCell align="right">
        {plannedTotal > 0
          ? <Typography component="span" variant="body2" color={isNotDue ? 'text.disabled' : undefined}>{formatMoney(plannedTotal)}</Typography>
          : <Typography component="span" variant="body2" color="text.disabled">—</Typography>}
      </TableCell>
      <TableCell align="right">
        {canEdit && !isSavings && !isFixedOnly && (
          <Tooltip title={t('removeRow')} placement="left">
            <IconButton
              size="small"
              onClick={() => onRemoveCategory(cat.id)}
              sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  )
}
