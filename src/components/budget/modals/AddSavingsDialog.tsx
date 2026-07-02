'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { RecurringType } from '@/gen/spendsense/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

interface Props {
  budgetProfileId: string
  onClose: () => void
  onDone: () => void
}

const FREQUENCY_OPTIONS = [
  { value: RecurringType.WEEKLY, label: 'Weekly' },
  { value: RecurringType.BI_WEEKLY, label: 'Bi-weekly' },
  { value: RecurringType.MONTHLY, label: 'Monthly' },
]

export function AddSavingsDialog({ budgetProfileId, onClose, onDone }: Props) {
  const t = useTranslations('budget.savings.addDialog')
  const { showError } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<RecurringType>(RecurringType.MONTHLY)
  const [budgetPersonId, setBudgetPersonId] = useState<bigint>(0n)
  const [paymentMethodId, setPaymentMethodId] = useState('')

  const client = useClient(BudgetService)

  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })
  const people = useMemo(() => peopleData?.people ?? [], [peopleData])

  const { data: pmData } = useQuery({
    queryKey: ['payment-methods', budgetProfileId],
    queryFn: () => client.listPaymentMethods({ budgetProfileId }),
  })
  const paymentMethods = useMemo(() => pmData?.methods ?? [], [pmData])

  useEffect(() => {
    if (people.length > 0 && budgetPersonId === 0n) {
      setBudgetPersonId(people[0].id)
    }
  }, [people, budgetPersonId])

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: {
      name: string
      amount: { units: bigint; nanos: number }
      frequency: RecurringType
      budgetPersonId: bigint
      paymentMethodId: string
    }) => client.addSavingsSource({ budgetProfileId, ...vars }),
  })

  async function handleSave() {
    if (!name.trim() || !amount || budgetPersonId === 0n || !paymentMethodId) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    try {
      await mutateAsync({ name, amount: { units: BigInt(units), nanos }, frequency, budgetPersonId, paymentMethodId })
      logger.info('budget.savings.add', { budgetProfileId, name, amount })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  const isValid = name.trim() !== '' && amount !== '' && budgetPersonId !== 0n && paymentMethodId !== ''

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="xs">
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t('name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder={t('namePlaceholder')}
          />
          <TextField
            label={t('amount')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>{t('frequency')}</InputLabel>
            <Select
              label={t('frequency')}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringType)}
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" required>
            <InputLabel>{t('owner')}</InputLabel>
            <Select
              label={t('owner')}
              value={budgetPersonId.toString()}
              onChange={(e) => setBudgetPersonId(BigInt(e.target.value))}
            >
              {people.map((p) => (
                <MenuItem key={p.id.toString()} value={p.id.toString()}>
                  {p.userName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" required>
            <InputLabel>{t('paymentMethod')}</InputLabel>
            <Select
              label={t('paymentMethod')}
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
            >
              {paymentMethods.map((pm) => (
                <MenuItem key={pm.id} value={pm.id}>
                  {pm.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">{t('cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isValid || isPending}
        >
          {isPending ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
