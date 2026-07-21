'use client'

import { useTranslations } from 'next-intl'
import type { Category, BudgetPerson, ExpenseAllocation, FixedExpense } from '@/gen/wellspent/v1/budget_pb'
import { parseMoney, type CategoryRowData } from './helpers'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

interface Props {
  cat: Category
  people: BudgetPerson[]
  rowData: CategoryRowData
  allocMap: Map<string, ExpenseAllocation>
  fixedPlannedByPersonCat: Map<string, number>
  savingsByPerson: Map<string, number>
  canEdit: boolean
  formatMoney: (amount: number) => string
  onRemoveCategory: (categoryId: number) => void
  onOpenEditDialog: (cat: Category, personId: bigint, personName: string, currentValue: number | undefined, existing: ExpenseAllocation | undefined) => void
  onEditFixedExpense: (fe: FixedExpense) => void
}

export function CategoryCardMobile({
  cat, people, rowData, allocMap, fixedPlannedByPersonCat, savingsByPerson,
  canEdit, formatMoney, onRemoveCategory, onOpenEditDialog, onEditFixedExpense,
}: Props) {
  const t = useTranslations('budget.expenses')
  const { isSavings, notDueInfo, isNotDue, isFixedOnly, plannedTotal } = rowData

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      {/* Card header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          {cat.color && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
          )}
          <Typography variant="body2" fontWeight={600} noWrap>{cat.name}</Typography>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" display="block">{t('plannedAmount')}</Typography>
            <Typography variant="body2" fontWeight={600} color={isNotDue ? 'text.disabled' : undefined}>
              {plannedTotal > 0 ? formatMoney(plannedTotal) : '—'}
            </Typography>
          </Box>
          {canEdit && !isSavings && !isFixedOnly && (
            <IconButton size="small" onClick={() => onRemoveCategory(cat.id)}>
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>
      {isNotDue && notDueInfo && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.25 }}>
          {t('notDueTooltip', { date: notDueInfo.nextDue ? notDueInfo.nextDue.toLocaleDateString() : '' })}
        </Typography>
      )}
      {/* Person rows */}
      {people.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {people.map((p) => {
              let val: number | undefined
              if (isSavings) {
                const sv = savingsByPerson.get(p.id.toString())
                val = sv !== undefined ? sv : undefined
              } else {
                const alloc = allocMap.get(`${cat.id}:${p.id}`)
                val = alloc
                  ? parseMoney(alloc.plannedAmount?.units ?? 0n, alloc.plannedAmount?.nanos ?? 0)
                  : undefined
              }
              const alloc = isSavings ? undefined : allocMap.get(`${cat.id}:${p.id}`)
              const fixedPersonAmt = !isSavings ? fixedPlannedByPersonCat.get(`${cat.id}:${p.id}`) : undefined
              const displayVal = val ?? fixedPersonAmt
              return (
                <Box key={p.id.toString()} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {p.color && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ flex: 1, color: p.color || 'text.primary', minWidth: 0 }}
                    noWrap
                  >
                    {p.userName}
                  </Typography>
                  <Typography variant="body2" sx={{ minWidth: 64, textAlign: 'right', color: 'text.secondary' }}>
                    {displayVal != null ? formatMoney(displayVal) : '—'}
                  </Typography>
                  {canEdit && !isSavings && !isFixedOnly && (
                    <IconButton size="small" onClick={() => onOpenEditDialog(cat, p.id, p.userName, val, alloc)}>
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  )}
                </Box>
              )
            })}
          </Box>
        </>
      )}
    </Paper>
  )
}
