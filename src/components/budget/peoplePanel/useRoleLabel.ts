import { useTranslations } from 'next-intl'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'

export function useRoleLabel() {
  const t = useTranslations('budget.invites.roles')
  return (role: BudgetRole) => {
    switch (role) {
      case BudgetRole.ADMIN: return t('admin')
      case BudgetRole.COLLABORATOR: return t('collaborator')
      case BudgetRole.VIEWER: return t('viewer')
      default: return t('unspecified')
    }
  }
}
