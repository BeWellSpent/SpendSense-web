import Container from '@mui/material/Container'
import { BudgetView } from '@/components/budget/BudgetView'
import { BudgetSidebar } from '@/components/layout/BudgetSidebar'

export default async function BudgetPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params
  return (
    <BudgetSidebar budgetId={id}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <BudgetView budgetId={id} />
      </Container>
    </BudgetSidebar>
  )
}
