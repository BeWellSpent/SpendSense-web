'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
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
  const { showError } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<RecurringType>(RecurringType.MONTHLY)
  const [budgetPersonId, setBudgetPersonId] = useState<bigint>(0n)

  const client = useClient(BudgetService)

  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })
  const people = useMemo(() => peopleData?.people ?? [], [peopleData])

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
    }) => client.addSavingsSource({ budgetProfileId, ...vars }),
  })

  async function handleSave() {
    if (!name.trim() || !amount || budgetPersonId === 0n) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    try {
      await mutateAsync({ name, amount: { units: BigInt(units), nanos }, frequency, budgetPersonId })
      logger.info('budget.savings.add', { budgetProfileId, name, amount })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="xs">
      <DialogTitle>Add savings source</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="e.g. Emergency fund"
          />
          <TextField
            label="Amount per occurrence"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Frequency</InputLabel>
            <Select
              label="Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringType)}
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" required>
            <InputLabel>Owner</InputLabel>
            <Select
              label="Owner"
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || !amount || budgetPersonId === 0n || isPending}
        >
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
