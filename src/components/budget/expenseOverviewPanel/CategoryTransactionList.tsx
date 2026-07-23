'use client'

import { Fragment, useMemo } from 'react'
import type { Transaction, Category, PaymentMethod, BudgetPerson } from '@/gen/wellspent/v1/budget_pb'
import { groupTransactionsByDay } from '../transactionsPanel/helpers'
import { TxRow } from '../transactionsPanel/TxRow'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

interface Props {
  transactions: Transaction[]
  isMobile: boolean
  categoryMap: Map<number, Category>
  methodMap: Map<string, PaymentMethod>
  personMap: Map<string, BudgetPerson>
}

// Desktop column count: name + category + method + person + amount = 5
// Mobile column count: name+details + amount = 2
const DESKTOP_COL_SPAN = 5
const MOBILE_COL_SPAN = 2

export function CategoryTransactionList({ transactions, isMobile, categoryMap, methodMap, personMap }: Props) {
  const groups = useMemo(
    () => groupTransactionsByDay(transactions, 'day', 'desc', categoryMap, methodMap, personMap),
    [transactions, categoryMap, methodMap, personMap],
  )

  if (transactions.length === 0) return null

  const colSpan = isMobile ? MOBILE_COL_SPAN : DESKTOP_COL_SPAN

  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
      <Table size="small">
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.day}>
              <TableRow>
                <TableCell colSpan={colSpan} sx={{ py: 0.25, bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary">{group.label}</Typography>
                </TableCell>
              </TableRow>
              {group.transactions.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  isFixed={false}
                  isMobile={isMobile}
                  linkedVariableTxs={[]}
                  categoryMap={categoryMap}
                  methodMap={methodMap}
                  personMap={personMap}
                  colSpan={colSpan}
                  actions={undefined}
                />
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
