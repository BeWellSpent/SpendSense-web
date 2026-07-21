'use client'

import { useTranslations } from 'next-intl'
import type { Category, BudgetPerson, ExpenseAllocation } from '@/gen/wellspent/v1/budget_pb'
import { parseMoney } from '../expensesPanel/helpers'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

interface Props {
  cat: Category
  people: BudgetPerson[]
  actual: number
  planned: number
  txnActualByPersonCat: Map<string, number>
  allocMap: Map<string, ExpenseAllocation>
  savingsByPerson: Map<string, number>
  isSavings: boolean
  isExpanded: boolean
  onToggle: () => void
  formatMoney: (v: number) => string
}

export function CategoryOverviewCard({
  cat, people, actual, planned, txnActualByPersonCat, allocMap, savingsByPerson,
  isSavings, isExpanded, onToggle, formatMoney,
}: Props) {
  const t = useTranslations('budget.overview')
  const isOver = planned > 0 && actual > planned
  const actualColor = actual > 0 ? (isOver ? 'error.main' : 'success.main') : 'text.disabled'
  const hasPeople = people.length > 1

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, cursor: hasPeople ? 'pointer' : 'default' }}
        onClick={hasPeople ? onToggle : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
          {cat.color && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
          )}
          <Typography variant="body2" fontWeight={600} noWrap>{cat.name}</Typography>
          {cat.isSystem && (
            <Chip label={t('global')} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" display="block">{t('actual')}</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: actualColor }}>
              {actual > 0 ? formatMoney(actual) : '—'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" display="block">{t('planned')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {planned > 0 ? formatMoney(planned) : '—'}
            </Typography>
          </Box>
          {isOver && (
            <Chip
              label={`+${formatMoney(actual - planned)}`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 18 }}
            />
          )}
          {hasPeople && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggle() }}>
              {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          )}
        </Box>
      </Box>

      {hasPeople && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {people.map((p) => {
              const personActual = txnActualByPersonCat.get(`${cat.id}:${p.id}`) ?? 0
              let personPlanned = 0
              if (isSavings) {
                personPlanned = savingsByPerson.get(p.id.toString()) ?? 0
              } else {
                const alloc = allocMap.get(`${cat.id}:${p.id}`)
                personPlanned = alloc
                  ? parseMoney(alloc.plannedAmount?.units ?? 0n, alloc.plannedAmount?.nanos ?? 0)
                  : 0
              }
              if (personActual === 0 && personPlanned === 0) return null
              const isPersonOver = personPlanned > 0 && personActual > personPlanned
              return (
                <Box key={p.id.toString()} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {p.color && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
                  )}
                  <Typography variant="body2" sx={{ flex: 1, color: p.color || 'text.primary' }} noWrap>
                    {p.userName}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ minWidth: 64, textAlign: 'right', color: isPersonOver ? 'error.main' : (personActual > 0 ? 'success.main' : 'text.disabled') }}
                  >
                    {personActual > 0 ? formatMoney(personActual) : '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 64, textAlign: 'right' }}>
                    {personPlanned > 0 ? formatMoney(personPlanned) : '—'}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Collapse>
      )}
    </Paper>
  )
}
