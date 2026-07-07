'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { Transaction } from '@/gen/spendsense/v1/budget_pb'
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
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

interface Props {
  budgetProfileId: string
  transaction: Transaction
  onClose: () => void
  onDone: () => void
}

function moneyToString(units: bigint, nanos: number): string {
  return (Number(units) + nanos / 1e9).toFixed(2)
}

function timestampToDayOfMonth(ts: { seconds: bigint } | undefined): number {
  if (!ts || ts.seconds === 0n) return new Date().getUTCDate()
  return new Date(Number(ts.seconds) * 1000).getUTCDate()
}

export function EditFixedExpenseModal({ budgetProfileId, transaction, onClose, onDone }: Props) {
  const t = useTranslations('budget.fixedExpense')
  const { showError } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const client = useClient(BudgetService)

  const [name, setName] = useState(transaction.name)
  const [amount, setAmount] = useState(() =>
    moneyToString(transaction.plannedAmount?.units ?? 0n, transaction.plannedAmount?.nanos ?? 0)
  )
  const [categoryId, setCategoryId] = useState(transaction.categoryId)
  const [paymentMethodId, setPaymentMethodId] = useState(transaction.paymentMethodId)
  const [dayOfMonth, setDayOfMonth] = useState(() => timestampToDayOfMonth(transaction.date))

  useEffect(() => {
    setName(transaction.name)
    setAmount(moneyToString(transaction.plannedAmount?.units ?? 0n, transaction.plannedAmount?.nanos ?? 0))
    setCategoryId(transaction.categoryId)
    setPaymentMethodId(transaction.paymentMethodId)
    setDayOfMonth(timestampToDayOfMonth(transaction.date))
  }, [transaction])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => client.listCategories({}),
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: {
      name: string
      plannedAmount: { units: bigint; nanos: number }
      categoryId: number
      paymentMethodId: string
      dayOfMonth: number
    }) => client.updateFixedExpense({ id: transaction.fixedExpenseId, budgetProfileId, ...vars }),
  })

  const canSave = !!name.trim() && !!amount && dayOfMonth >= 1 && dayOfMonth <= 31

  async function handleSave() {
    if (!canSave) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    try {
      await mutateAsync({ name, plannedAmount: { units: BigInt(units), nanos }, categoryId, paymentMethodId, dayOfMonth })
      logger.info('fixedExpense.update', { budgetProfileId, id: transaction.fixedExpenseId, name })
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
          <TextField
            label={t('fields.dayOfMonth')}
            type="number"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
            fullWidth
            inputProps={{ min: 1, max: 31, inputMode: 'decimal' }}
            helperText={t('fields.dayOfMonthHint')}
          />
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
