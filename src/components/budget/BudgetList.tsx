'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { BudgetProfile } from '@/gen/spendsense/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { formatError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { BudgetSetupFlow } from './BudgetSetupFlow'
import { useRouter } from '@/i18n/navigation'

function DeleteConfirmDialog({
  budget,
  onClose,
  onConfirm,
  isDeleting,
}: {
  budget: BudgetProfile
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  const t = useTranslations('budget.list.deleteDialog')
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('body', { name: budget.name })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isDeleting}>{t('cancel')}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
          {isDeleting ? t('deleting') : t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function BudgetList() {
  const t = useTranslations('budget.list')
  const router = useRouter()
  const { showError, showSuccess } = useSnackbar()
  const [setupOpen, setSetupOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BudgetProfile | null>(null)
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['budgets', 'list'],
    queryFn: () => client.listBudgetProfiles({}),
  })

  const { mutateAsync: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => client.deleteBudgetProfile({ id }),
  })

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await doDelete(deleteTarget.id)
      logger.info('budget.delete', { budgetId: deleteTarget.id, name: deleteTarget.name })
      showSuccess(`"${deleteTarget.name}" deleted.`)
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['budgets', 'list'] })
    } catch (err) {
      showError(err)
    }
  }

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  if (isError) {
    const message = formatError(error)
    logger.error('budget.list.failed', { error: message })
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error" mb={2}>{message}</Typography>
        <Button variant="outlined" onClick={() => refetch()}>{t('retry')}</Button>
      </Box>
    )
  }

  const profiles = data?.profiles ?? []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setSetupOpen(true)}>
          {t('newBudget')}
        </Button>
      </Box>

      {profiles.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="body1" mb={2}>{t('empty')}</Typography>
          <Button variant="outlined" onClick={() => setSetupOpen(true)}>{t('createBudget')}</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {profiles.map((profile) => (
            <Card key={profile.id} variant="outlined">
              <CardActionArea onClick={() => {
                logger.info('budget.open', { budgetId: profile.id })
                router.push(`/budgets/${profile.id}`)
              }}>
                <CardContent>
                  <Typography variant="h6">{profile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('monthly')}</Typography>
                </CardContent>
              </CardActionArea>
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(profile)
                  }}
                  aria-label={`Delete ${profile.name}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <BudgetSetupFlow
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onComplete={() => {
          setSetupOpen(false)
          refetch()
        }}
      />

      {deleteTarget && (
        <DeleteConfirmDialog
          budget={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </Box>
  )
}
