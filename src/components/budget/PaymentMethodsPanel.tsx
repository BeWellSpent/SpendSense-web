'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { PaymentType } from '@/gen/wellspent/v1/common_pb'
import type { PaymentMethod } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { AddPaymentMethodDialog } from './paymentMethodsPanel/AddPaymentMethodDialog'
import { DeactivateMethodDialog } from './paymentMethodsPanel/DeactivateMethodDialog'
import { EditPaymentMethodDialog } from './paymentMethodsPanel/EditPaymentMethodDialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress'

interface Props {
  budgetProfileId: string
  budgetPeriodId?: string
  canEdit?: boolean
}

export function PaymentMethodsPanel({ budgetProfileId, budgetPeriodId, canEdit = true }: Props) {
  const t = useTranslations('budget.paymentMethods')
  const { showError, showSuccess } = useSnackbar()
  const fullScreen = useIsMobile()

  const [addOpen, setAddOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null)

  const client = useClient(BudgetService)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['paymentMethods', budgetProfileId],
    queryFn: () => client.listPaymentMethods({ budgetProfileId }),
  })

  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions', budgetPeriodId],
    queryFn: () => client.listTransactions({ budgetPeriodId: budgetPeriodId! }),
    enabled: !!budgetPeriodId,
  })

  const { mutateAsync: doCreate, isPending: isCreating } = useMutation({
    mutationFn: (vars: { name: string; type: PaymentType; budgetPersonId: bigint; color: string }) =>
      client.createPaymentMethod(vars),
  })

  const { mutateAsync: doUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (vars: { id: string; name: string; color: string; alias: string }) => client.updatePaymentMethod(vars),
  })

  const { mutateAsync: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: (vars: { id: string; replacementId: string; budgetProfileId: string }) =>
      client.deletePaymentMethod(vars),
  })

  async function handleCreate(name: string, type: PaymentType, personId: bigint, color: string) {
    try {
      await doCreate({ name, type, budgetPersonId: personId, color })
      logger.info('paymentMethod.create', { name, budgetPersonId: personId.toString() })
      showSuccess(`Payment method "${name}" added`)
      setAddOpen(false)
      refetch()
    } catch (err) {
      showError(err)
    }
  }

  async function openDelete(method: PaymentMethod) {
    const hasTransactions = transactions.some((t) => t.paymentMethodId === method.id)
    if (!hasTransactions) {
      const replacement = methods.find((m) => m.id !== method.id)
      if (!replacement) return
      try {
        await doDelete({ id: method.id, replacementId: replacement.id, budgetProfileId })
        logger.info('paymentMethod.deactivate', { id: method.id, replacementId: replacement.id, budgetProfileId })
        showSuccess(`"${method.alias || method.name}" deactivated`)
        refetch()
      } catch (err) {
        showError(err)
      }
      return
    }
    setDeletingMethod(method)
  }

  async function handleDelete(replacementId: string) {
    if (!deletingMethod || !replacementId) return
    try {
      await doDelete({ id: deletingMethod.id, replacementId, budgetProfileId })
      logger.info('paymentMethod.deactivate', { id: deletingMethod.id, replacementId, budgetProfileId })
      showSuccess(`"${deletingMethod.alias || deletingMethod.name}" deactivated`)
      setDeletingMethod(null)
      refetch()
    } catch (err) {
      showError(err)
    }
  }

  async function handleUpdate(name: string, alias: string, color: string) {
    if (!editingMethod) return
    try {
      await doUpdate({ id: editingMethod.id, name, color, alias })
      logger.info('paymentMethod.update', { id: editingMethod.id, name, alias })
      showSuccess(`"${alias || name}" updated`)
      setEditingMethod(null)
      refetch()
    } catch (err) {
      showError(err)
    }
  }

  if (isLoading) return <CircularProgress size={20} />

  const methods = data?.methods ?? []
  const people = peopleData?.people ?? []
  const transactions = transactionsData?.transactions ?? []
  const personMap = new Map(people.map((p) => [p.id.toString(), p.userName]))

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>{t('title')}</Typography>
        {canEdit && (
          <IconButton size="small" onClick={() => setAddOpen(true)}>
            <AddIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {methods.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('empty')}</Typography>
      ) : (
        <List dense disablePadding>
          {methods.map((m) => {
            const personName = m.budgetPersonId !== 0n
              ? personMap.get(m.budgetPersonId.toString())
              : undefined
            return (
              <ListItem
                key={m.id}
                disableGutters
                secondaryAction={
                  canEdit ? (
                    <Box>
                      <Tooltip title={t('editTooltip')}>
                        <IconButton size="small" onClick={() => setEditingMethod(m)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('deactivateTooltip')}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => openDelete(m)}
                            disabled={methods.length <= 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  ) : undefined
                }
              >
                <ListItemText
                  primary={m.alias || m.name}
                  secondary={
                    <>
                      {m.alias && <span style={{ opacity: 0.5 }}>{m.name} · </span>}
                      {personName}
                    </>
                  }
                />
                <Chip
                  label={PaymentType[m.type]}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 4, ...(m.color ? { bgcolor: m.color, color: 'white', borderColor: m.color } : {}) }}
                />
              </ListItem>
            )
          })}
        </List>
      )}

      <AddPaymentMethodDialog
        open={addOpen}
        people={people}
        isCreating={isCreating}
        fullScreen={fullScreen}
        onCancel={() => setAddOpen(false)}
        onConfirm={handleCreate}
      />

      <DeactivateMethodDialog
        method={deletingMethod}
        methods={methods}
        personMap={personMap}
        isDeleting={isDeleting}
        fullScreen={fullScreen}
        onCancel={() => setDeletingMethod(null)}
        onConfirm={handleDelete}
      />

      <EditPaymentMethodDialog
        method={editingMethod}
        isSaving={isUpdating}
        fullScreen={fullScreen}
        onCancel={() => setEditingMethod(null)}
        onConfirm={handleUpdate}
      />
    </Box>
  )
}
