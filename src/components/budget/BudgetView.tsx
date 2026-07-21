'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useBudgetRole } from '@/hooks/useBudgetRole'
import { TransactionsPanel } from './TransactionsPanel'
import { ExpensesPanel } from './ExpensesPanel'
import { ExpenseOverviewPanel } from './ExpenseOverviewPanel'
import { TransactionReviewPanel, transactionReviewCount } from './TransactionReviewPanel'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Fab from '@mui/material/Fab'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Badge from '@mui/material/Badge'
import AddIcon from '@mui/icons-material/Add'
import AssignmentIcon from '@mui/icons-material/Assignment'
import BarChartIcon from '@mui/icons-material/BarChart'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import RuleIcon from '@mui/icons-material/Rule'

type ActiveView = 'expenses' | 'overview' | 'transactions' | 'review'

interface Props {
  budgetId: string
}

export function BudgetView({ budgetId }: Props) {
  const t = useTranslations('budget.view')
  const tFab = useTranslations('budget.fab')
  const client = useClient(BudgetService)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  // Which top-level section (Expense Plan vs Transactions) is stored in the
  // URL, not component state, so a page reload lands back where you were.
  const rawView = searchParams.get('view')
  const activeView: ActiveView = rawView === 'transactions' ? 'transactions' : rawView === 'review' ? 'review' : rawView === 'overview' ? 'overview' : 'expenses'
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)

  function setActiveView(view: ActiveView) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.replace({ pathname, query: Object.fromEntries(params) }, { scroll: false })
  }

  const myRole = useBudgetRole(budgetId)
  const canEdit = myRole === BudgetRole.ADMIN || myRole === BudgetRole.COLLABORATOR

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['budget-profile', budgetId],
    queryFn: () => client.getBudgetProfile({ id: budgetId }),
  })

  const { data: periodsData, isLoading: periodsLoading } = useQuery({
    queryKey: ['budget-periods', budgetId],
    queryFn: () => client.listBudgetPeriods({ budgetProfileId: budgetId }),
    enabled: !!profileData,
  })

  // Derive active period early — needed before the review query hook.
  const periods = periodsData?.periods ?? []
  const activePeriod = [...periods]
    .filter((p) => !p.isArchived)
    .sort((a, b) => Number(b.startDate?.seconds ?? 0n) - Number(a.startDate?.seconds ?? 0n))[0]
    ?? periods[0]

  const { data: reviewData } = useQuery({
    queryKey: ['transaction-reviews', budgetId],
    queryFn: () => client.listTransactionReviews({ budgetProfileId: budgetId }),
    enabled: !!budgetId,
  })
  const pendingReviewCount = reviewData ? transactionReviewCount(reviewData.reviews) : 0

  if (profileLoading || periodsLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
  }
  if (profileError) return <Typography color="error">{t('failedToLoad')}</Typography>

  const profile = profileData?.profile

  function handleFabClick() {
    setActiveView('transactions')
    setAddTransactionOpen(true)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', pb: { xs: 12, sm: 10 } }}>
      {/* Budget name + date — shown on all screen sizes */}
      <Box sx={{ mb: 2 }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>{profile?.name}</Typography>
        {activePeriod?.startDate && activePeriod?.endDate && (
          <Typography variant="body2" color="text.secondary">
            {new Date(Number(activePeriod.startDate.seconds) * 1000).toLocaleDateString()} —{' '}
            {new Date(Number(activePeriod.endDate.seconds) * 1000).toLocaleDateString()}
          </Typography>
        )}
      </Box>

      {/* Desktop tab nav */}
      {!isMobile && (
        <Tabs
          value={activeView}
          onChange={(_, v: ActiveView) => setActiveView(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab value="expenses" label={t('expensePlan')} icon={<AssignmentIcon />} iconPosition="start" />
          <Tab value="overview" label={t('expenseOverview')} icon={<BarChartIcon />} iconPosition="start" />
          <Tab value="transactions" label={t('transactions')} icon={<ReceiptLongIcon />} iconPosition="start" />
          <Tab
            value="review"
            label={
              <Badge badgeContent={pendingReviewCount} color="warning" max={99}>
                {t('toReview')}
              </Badge>
            }
            icon={<RuleIcon />}
            iconPosition="start"
          />
        </Tabs>
      )}

      {/* Active panel */}
      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        {activeView === 'expenses' ? (
          <ExpensesPanel budgetProfileId={budgetId} budgetPeriodId={activePeriod?.id} canEdit={canEdit} />
        ) : activeView === 'overview' ? (
          <ExpenseOverviewPanel budgetProfileId={budgetId} budgetPeriodId={activePeriod?.id} />
        ) : activeView === 'review' ? (
          <TransactionReviewPanel
            budgetProfileId={budgetId}
            budgetPeriodId={activePeriod?.id}
            isEditable={canEdit}
          />
        ) : activePeriod ? (
          <TransactionsPanel
            budgetPeriodId={activePeriod.id}
            budgetProfileId={budgetId}
            addOpen={addTransactionOpen}
            onAddClose={() => setAddTransactionOpen(false)}
            isEditable={canEdit}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">{t('noActivePeriod')}</Typography>
        )}
      </Box>

      {/* FAB — switches to transactions view and opens add dialog */}
      {canEdit && (
        <Fab
          color="primary"
          aria-label={tFab('addTransaction')}
          onClick={handleFabClick}
          sx={{ position: 'fixed', bottom: { xs: 80, sm: 24 }, right: 24 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Mobile bottom navigation — mirrors desktop tabs */}
      {isMobile && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <BottomNavigation
            value={activeView}
            onChange={(_, v: ActiveView) => setActiveView(v)}
          >
            <BottomNavigationAction
              value="expenses"
              label={t('expensePlan')}
              icon={<AssignmentIcon />}
            />
            <BottomNavigationAction
              value="overview"
              label={t('expenseOverview')}
              icon={<BarChartIcon />}
            />
            <BottomNavigationAction
              value="transactions"
              label={t('transactions')}
              icon={<ReceiptLongIcon />}
            />
            <BottomNavigationAction
              value="review"
              label={t('toReview')}
              icon={
                <Badge badgeContent={pendingReviewCount} color="warning" max={99}>
                  <RuleIcon />
                </Badge>
              }
            />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  )
}
