import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { BudgetList } from '@/components/budget/BudgetList'

export default function BudgetsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <BudgetList />
      </Box>
    </Container>
  )
}
