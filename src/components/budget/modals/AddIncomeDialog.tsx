'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
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
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

interface Props {
  budgetId: string
  onClose: () => void
  onDone: () => void
}

export function AddIncomeDialog({ budgetId, onClose, onDone }: Props) {
  const { showError } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [recurring, setRecurring] = useState(true)

  const client = useClient(BudgetService)
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: { name: string; amount: { units: bigint; nanos: number }; recurring: boolean }) =>
      client.addIncomeEntry({ budgetId, ...vars }),
  })

  async function handleSave() {
    if (!name.trim() || !amount) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    try {
      await mutateAsync({ name, amount: { units: BigInt(units), nanos }, recurring })
      logger.info('budget.income.add', { budgetId, name, amount })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="xs">
      <DialogTitle>Add income source</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Source name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="e.g. Salary"
          />
          <TextField
            label="Monthly amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          <FormControlLabel
            control={<Checkbox checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />}
            label="Recurring monthly"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || !amount || isPending}
        >
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
