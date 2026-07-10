'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { FixedExpense } from '@/gen/spendsense/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { PaymentMethodSelect } from '@/components/budget/PaymentMethodSelect'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

interface Props {
  budgetProfileId: string
  fixedExpense: FixedExpense
  onClose: () => void
  onDone: () => void
}

const INTERVAL_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1)

function moneyToString(units: bigint, nanos: number): string {
  return (Number(units) + nanos / 1e9).toFixed(2)
}

function timestampToDateString(ts: { seconds: bigint } | undefined): string {
  const d = ts && ts.seconds !== 0n ? new Date(Number(ts.seconds) * 1000) : new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function dateStringToTimestamp(str: string): { seconds: bigint; nanos: number } {
  const [year, month, day] = str.split('-').map(Number)
  return { seconds: BigInt(Math.floor(Date.UTC(year, month - 1, day) / 1000)), nanos: 0 }
}

function intervalLabel(t: (key: string, values?: Record<string, string | number | Date>) => string, n: number): string {
  if (n === 1) return t('fields.intervalMonthly')
  if (n === 12) return t('fields.intervalYearly')
  return t('fields.intervalEvery', { n })
}

export function EditFixedExpenseModal({ budgetProfileId, fixedExpense, onClose, onDone }: Props) {
  const t = useTranslations('budget.fixedExpense')
  const { showError } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const client = useClient(BudgetService)

  const [name, setName] = useState(fixedExpense.name)
  const [amount, setAmount] = useState(() =>
    moneyToString(fixedExpense.plannedAmount?.units ?? 0n, fixedExpense.plannedAmount?.nanos ?? 0)
  )
  const [categoryId, setCategoryId] = useState(fixedExpense.categoryId)
  const [paymentMethodId, setPaymentMethodId] = useState(fixedExpense.paymentMethodId)
  const [dayOfMonth, setDayOfMonth] = useState(fixedExpense.dayOfMonth)
  const [intervalMonths, setIntervalMonths] = useState(fixedExpense.intervalMonths || 1)
  const [isFutureStart, setIsFutureStart] = useState(!!fixedExpense.anchorDate?.seconds)
  const [anchorDateStr, setAnchorDateStr] = useState(() => timestampToDateString(fixedExpense.anchorDate))

  useEffect(() => {
    setName(fixedExpense.name)
    setAmount(moneyToString(fixedExpense.plannedAmount?.units ?? 0n, fixedExpense.plannedAmount?.nanos ?? 0))
    setCategoryId(fixedExpense.categoryId)
    setPaymentMethodId(fixedExpense.paymentMethodId)
    setDayOfMonth(fixedExpense.dayOfMonth)
    setIntervalMonths(fixedExpense.intervalMonths || 1)
    setIsFutureStart(!!fixedExpense.anchorDate?.seconds)
    setAnchorDateStr(timestampToDateString(fixedExpense.anchorDate))
  }, [fixedExpense])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', budgetProfileId],
    queryFn: () => client.listCategories({ budgetProfileId }),
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: {
      name: string
      plannedAmount: { units: bigint; nanos: number }
      categoryId: number
      paymentMethodId: string
      dayOfMonth: number
      intervalMonths: number
      anchorDate?: { seconds: bigint; nanos: number }
    }) => client.updateFixedExpense({ id: fixedExpense.id, budgetProfileId, ...vars }),
  })

  const canSave = !!name.trim() && !!amount && (isFutureStart ? !!anchorDateStr : dayOfMonth >= 1 && dayOfMonth <= 31)

  async function handleSave() {
    if (!canSave) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    try {
      await mutateAsync({
        name,
        plannedAmount: { units: BigInt(units), nanos },
        categoryId,
        paymentMethodId,
        dayOfMonth,
        intervalMonths,
        ...(isFutureStart ? { anchorDate: dateStringToTimestamp(anchorDateStr) } : {}),
      })
      logger.info('fixedExpense.update', { budgetProfileId, id: fixedExpense.id, name })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{t('editTitle')}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label={t('fields.name')} value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField
            label={t('fields.amount')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: '0.01', inputMode: 'decimal' }}
          />
          {isFutureStart ? (
            <TextField
              label={t('fields.anchorDate')}
              type="date"
              value={anchorDateStr}
              onChange={(e) => setAnchorDateStr(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              helperText={t('fields.anchorDateHint')}
            />
          ) : (
            <TextField
              label={t('fields.dayOfMonth')}
              type="number"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
              fullWidth
              inputProps={{ min: 1, max: 31, inputMode: 'decimal' }}
              helperText={t('fields.dayOfMonthHint')}
            />
          )}
          <FormControlLabel
            control={<Checkbox checked={isFutureStart} onChange={(e) => setIsFutureStart(e.target.checked)} />}
            label={t('fields.startsInFuture')}
          />
          <TextField
            select
            label={t('fields.intervalMonths')}
            value={intervalMonths}
            onChange={(e) => setIntervalMonths(Number(e.target.value))}
            fullWidth
            helperText={t('fields.intervalMonthsHint')}
          >
            {INTERVAL_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>{intervalLabel(t, n)}</MenuItem>
            ))}
          </TextField>
          <TextField select label={t('fields.category')} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} fullWidth>
            <MenuItem value={0}>{t('fields.noCategory')}</MenuItem>
            {(categoriesData?.categories ?? []).map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <PaymentMethodSelect
            budgetProfileId={budgetProfileId}
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            label={t('fields.paymentMethod')}
            size="medium"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">{t('cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave || isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
