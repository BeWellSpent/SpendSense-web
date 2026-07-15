'use client'

import { useTranslations } from 'next-intl'
import { FullScreenDrawer } from '@/components/ui/FullScreenDrawer'
import { PeoplePanel } from '@/components/budget/PeoplePanel'
import { InvitePanel } from '@/components/budget/InvitePanel'
import { CategoriesPanel } from '@/components/budget/CategoriesPanel'
import { IncomePanel } from '@/components/budget/IncomePanel'
import { SavingsPanel } from '@/components/budget/SavingsPanel'
import { PaymentMethodsPanel } from '@/components/budget/PaymentMethodsPanel'

interface OpenState {
  categories: boolean
  people: boolean
  invites: boolean
  income: boolean
  savings: boolean
  paymentMethods: boolean
}

interface Props {
  open: OpenState
  onClose: { [K in keyof OpenState]: () => void }
  budgetId: string
  canEdit: boolean
  canManageUsers: boolean
  showBeforeTax: boolean
  activePeriodStart: Date | undefined
  activePeriodId: string | undefined
}

export function ManagementDrawers({ open, onClose, budgetId, canEdit, canManageUsers, showBeforeTax, activePeriodStart, activePeriodId }: Props) {
  const t = useTranslations('budget.sidebar')

  return (
    <>
      <FullScreenDrawer open={open.categories} onClose={onClose.categories} title={t('categories')}>
        <CategoriesPanel canEdit={canEdit} />
      </FullScreenDrawer>

      <FullScreenDrawer open={open.people} onClose={onClose.people} title={t('people')}>
        <PeoplePanel budgetProfileId={budgetId} canManageUsers={canManageUsers} />
      </FullScreenDrawer>

      <FullScreenDrawer open={open.invites} onClose={onClose.invites} title={t('invitations')}>
        <InvitePanel budgetProfileId={budgetId} canManageUsers={canManageUsers} />
      </FullScreenDrawer>

      <FullScreenDrawer open={open.income} onClose={onClose.income} title={t('income')}>
        <IncomePanel budgetProfileId={budgetId} showBeforeTax={showBeforeTax} canEdit={canEdit} />
      </FullScreenDrawer>

      <FullScreenDrawer open={open.savings} onClose={onClose.savings} title={t('savings')}>
        <SavingsPanel budgetProfileId={budgetId} activePeriodStart={activePeriodStart} canEdit={canEdit} />
      </FullScreenDrawer>

      <FullScreenDrawer open={open.paymentMethods} onClose={onClose.paymentMethods} title={t('paymentMethods')}>
        <PaymentMethodsPanel budgetProfileId={budgetId} budgetPeriodId={activePeriodId} canEdit={canEdit} />
      </FullScreenDrawer>
    </>
  )
}
