'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Timestamp } from '@bufbuild/protobuf'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { PaymentMethodSelect } from '@/components/budget/PaymentMethodSelect'
import { ScrollNumberPicker } from '@/components/ui/ScrollNumberPicker'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'

interface Props {
  budgetProfileId: string
  budgetPeriodId: string
  open: boolean
  onClose: () => void
  onDone: () => void
}

function todayDay(): number {
  return new Date().getDate()
}

function todayDateString(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function dateToString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function parseUTCDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function addUTCMonths(d: Date, n: number): Date {
  const result = new Date(d)
  result.setUTCMonth(result.getUTCMonth() + n)
  return result
}

function addUTCWeeks(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 7 * 24 * 60 * 60 * 1000)
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth())
}

function weeksBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

type FrequencyUnitUI = 'week' | 'month' | 'year'

const FREQUENCY_COUNT_RANGE: Record<FrequencyUnitUI, { min: number; max: number }> = {
  week: { min: 1, max: 52 },
  month: { min: 1, max: 24 },
  year: { min: 1, max: 10 },
}

const DAY_OF_WEEK_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function frequencyFieldsFor(unit: FrequencyUnitUI, count: number, dayOfWeek: number) {
  if (unit === 'week') {
    return { frequencyUnit: 2, intervalMonths: 1, intervalWeeks: count, dayOfWeek }
  }
  return { frequencyUnit: 1, intervalMonths: unit === 'year' ? count * 12 : count, intervalWeeks: 1, dayOfWeek: 1 }
}

export function AddFixedExpenseModal({ budgetProfileId, budgetPeriodId, open, onClose, onDone }: Props) {
  const t = useTranslations('budget.fixedExpense')
  const { showError } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number>(0)
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState(todayDay)
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [frequencyUnitUI, setFrequencyUnitUI] = useState<FrequencyUnitUI>('month')
  const [frequencyCount, setFrequencyCount] = useState(1)
  const [isFutureStart, setIsFutureStart] = useState(false)
  const [anchorDateStr, setAnchorDateStr] = useState(todayDateString)
  const [endDateStr, setEndDateStr] = useState('')
  const [paymentsInput, setPaymentsInput] = useState('')

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
      frequencyUnit: number
      intervalWeeks: number
      dayOfWeek: number
      anchorDate?: { seconds: bigint; nanos: number }
      endDate?: Timestamp
      totalPayments: number
    }) => client.createFixedExpense({ budgetProfileId, ...vars }),
  })

  function getAnchor(): Date {
    if (isFutureStart && anchorDateStr) return parseUTCDate(anchorDateStr)
    return new Date()
  }

  function handleFrequencyUnitChange(next: FrequencyUnitUI) {
    setFrequencyUnitUI(next)
    setFrequencyCount(1)
    // recalculate end date if payments are set
    if (paymentsInput) handlePaymentsChange(paymentsInput, next, 1)
  }

  function handlePaymentsChange(val: string, unit = frequencyUnitUI, count = frequencyCount) {
    setPaymentsInput(val)
    const n = parseInt(val, 10)
    if (!isNaN(n) && n > 0) {
      const anchor = getAnchor()
      if (unit === 'week') {
        setEndDateStr(dateToString(addUTCWeeks(anchor, (n - 1) * count)))
      } else {
        const intervalMonths = unit === 'year' ? count * 12 : count
        setEndDateStr(dateToString(addUTCMonths(anchor, (n - 1) * intervalMonths)))
      }
    } else if (val === '') {
      setEndDateStr('')
    }
  }

  function handleEndDateChange(val: string) {
    setEndDateStr(val)
    if (val) {
      const anchor = getAnchor()
      const end = parseUTCDate(val)
      let payments: number
      if (frequencyUnitUI === 'week') {
        payments = Math.round(weeksBetween(anchor, end) / frequencyCount) + 1
      } else {
        const intervalMonths = frequencyUnitUI === 'year' ? frequencyCount * 12 : frequencyCount
        payments = Math.round(monthsBetween(anchor, end) / intervalMonths) + 1
      }
      setPaymentsInput(String(Math.max(1, payments)))
    } else {
      setPaymentsInput('')
    }
  }

  const canSave = !!name.trim() && !!amount && (
    isFutureStart
      ? !!anchorDateStr
      : frequencyUnitUI === 'week'
        ? dayOfWeek >= 1 && dayOfWeek <= 7
        : dayOfMonth >= 1 && dayOfMonth <= 31
  )

  async function handleSave() {
    if (!canSave) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    const totalPayments = parseInt(paymentsInput, 10) || 0
    let endDate: Timestamp | undefined
    if (endDateStr) endDate = Timestamp.fromDate(parseUTCDate(endDateStr))
    const [year, month, day] = isFutureStart && anchorDateStr ? anchorDateStr.split('-').map(Number) : []
    const anchorDate = isFutureStart && anchorDateStr
      ? { seconds: BigInt(Math.floor(Date.UTC(year, month - 1, day) / 1000)), nanos: 0 }
      : undefined
    try {
      await mutateAsync({
        name,
        plannedAmount: { units: BigInt(units), nanos },
        categoryId,
        paymentMethodId,
        dayOfMonth,
        ...frequencyFieldsFor(frequencyUnitUI, frequencyCount, dayOfWeek),
        anchorDate,
        endDate,
        totalPayments,
      })
      logger.info('fixedExpense.create', { budgetProfileId, name })
      queryClient.invalidateQueries({ queryKey: ['transactions', budgetPeriodId, 1] })
      setName('')
      setAmount('')
      setCategoryId(0)
      setPaymentMethodId('')
      setDayOfMonth(todayDay())
      setDayOfWeek(1)
      setFrequencyUnitUI('month')
      setFrequencyCount(1)
      setIsFutureStart(false)
      setAnchorDateStr(todayDateString())
      setEndDateStr('')
      setPaymentsInput('')
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{t('addTitle')}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label={t('fields.name')} value={name} onChange={(e) => setName(e.target.value)} fullWidth autoFocus />
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
          ) : frequencyUnitUI === 'week' ? (
            <TextField
              select
              label={t('fields.dayOfWeek')}
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              fullWidth
              helperText={t('fields.dayOfWeekHint')}
            >
              {DAY_OF_WEEK_KEYS.map((key, i) => (
                <MenuItem key={key} value={i + 1}>{t(`days.${key}`)}</MenuItem>
              ))}
            </TextField>
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
          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="flex-start">
            <TextField
              select
              label={t('fields.repeatsEvery')}
              value={frequencyUnitUI}
              onChange={(e) => handleFrequencyUnitChange(e.target.value as FrequencyUnitUI)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="week">{t('fields.unitWeek')}</MenuItem>
              <MenuItem value="month">{t('fields.unitMonth')}</MenuItem>
              <MenuItem value="year">{t('fields.unitYear')}</MenuItem>
            </TextField>
            <Stack spacing={0.5} alignItems="center">
              <ScrollNumberPicker
                value={frequencyCount}
                onChange={(v) => { setFrequencyCount(v); if (paymentsInput) handlePaymentsChange(paymentsInput, frequencyUnitUI, v) }}
                min={FREQUENCY_COUNT_RANGE[frequencyUnitUI].min}
                max={FREQUENCY_COUNT_RANGE[frequencyUnitUI].max}
                aria-label={t('fields.repeatCount')}
              />
              <Typography variant="caption" color="text.secondary">{t('fields.repeatsHint')}</Typography>
            </Stack>
          </Stack>
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
          <Divider />
          <Typography variant="body2" color="text.secondary">{t('paymentPlan.label')}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('paymentPlan.numberOfPayments')}
              type="number"
              value={paymentsInput}
              onChange={(e) => handlePaymentsChange(e.target.value)}
              fullWidth
              inputProps={{ min: 1, step: 1, inputMode: 'numeric' }}
              helperText={t('paymentPlan.numberOfPaymentsHint')}
            />
            <TextField
              label={t('paymentPlan.endDate')}
              type="date"
              value={endDateStr}
              onChange={(e) => handleEndDateChange(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText={t('paymentPlan.endDateHint')}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">{t('cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave || isPending}>
          {isPending ? t('saving') : t('add')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
