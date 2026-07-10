jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/gen/spendsense/v1/budget_connect', () => ({ BudgetService: {} }))

import {
  resolveCategoryName,
  resolveMethodName,
  resolveOwnerName,
  matchesSearch,
  compareTransactions,
} from '../TransactionsPanel'
import type { Transaction, Category, PaymentMethod, BudgetPerson } from '@/gen/spendsense/v1/budget_pb'

function money(units: bigint): { units: bigint; nanos: number } {
  return { units, nanos: 0 }
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    name: 'Groceries',
    amount: money(0n),
    plannedAmount: money(100n),
    date: { seconds: 0n, nanos: 0 },
    renewalDate: { seconds: 0n, nanos: 0 },
    recurring: false,
    budgetPeriodId: 'period-1',
    categoryId: 1,
    paymentMethodId: 'pm-1',
    transactionFrequencyId: 1,
    transactionTypeId: 2,
    isPaid: false,
    paidAt: { seconds: 0n, nanos: 0 },
    fixedExpenseId: '',
    ...overrides,
  } as Transaction
}

const category: Category = { id: 1, name: 'Food', typeId: 1, isSystem: false, color: '' }
const method: PaymentMethod = { id: 'pm-1', name: 'Chase Visa', type: 2, budgetPersonId: 5n, color: '' }
const person: BudgetPerson = { id: 5n, userName: 'Alex', color: '' }

const categoryMap = new Map([[category.id, category]])
const methodMap = new Map([[method.id, method]])
const personMap = new Map([[person.id.toString(), person]])

describe('resolveCategoryName', () => {
  it('returns the category name when set', () => {
    expect(resolveCategoryName(1, categoryMap)).toBe('Food')
  })

  it('returns empty string when categoryId is 0 (unset)', () => {
    expect(resolveCategoryName(0, categoryMap)).toBe('')
  })

  it('returns empty string when the category is not found', () => {
    expect(resolveCategoryName(99, categoryMap)).toBe('')
  })
})

describe('resolveMethodName', () => {
  it('returns the payment method name when set', () => {
    expect(resolveMethodName('pm-1', methodMap)).toBe('Chase Visa')
  })

  it('returns empty string when paymentMethodId is empty', () => {
    expect(resolveMethodName('', methodMap)).toBe('')
  })
})

describe('resolveOwnerName', () => {
  it("returns the payment method's attributed person name", () => {
    expect(resolveOwnerName('pm-1', methodMap, personMap)).toBe('Alex')
  })

  it('returns empty string when the payment method has no attributed person (budgetPersonId 0)', () => {
    const unattributed: PaymentMethod = { id: 'pm-2', name: 'Cash', type: 1, budgetPersonId: 0n, color: '' }
    const map = new Map([[unattributed.id, unattributed]])
    expect(resolveOwnerName('pm-2', map, personMap)).toBe('')
  })

  it('returns empty string when paymentMethodId is empty', () => {
    expect(resolveOwnerName('', methodMap, personMap)).toBe('')
  })
})

describe('matchesSearch', () => {
  it('matches on name (case-insensitive)', () => {
    expect(matchesSearch('Groceries', 1, 'pm-1', 'grocer', categoryMap, methodMap, personMap)).toBe(true)
  })

  it('matches on category name', () => {
    expect(matchesSearch('Anything', 1, 'pm-1', 'food', categoryMap, methodMap, personMap)).toBe(true)
  })

  it('matches on owner name', () => {
    expect(matchesSearch('Anything', 1, 'pm-1', 'alex', categoryMap, methodMap, personMap)).toBe(true)
  })

  it('returns false when nothing matches', () => {
    expect(matchesSearch('Groceries', 1, 'pm-1', 'zzz', categoryMap, methodMap, personMap)).toBe(false)
  })

  it('returns true for an empty query', () => {
    expect(matchesSearch('Groceries', 1, 'pm-1', '', categoryMap, methodMap, personMap)).toBe(true)
  })
})

describe('compareTransactions', () => {
  it('sorts by name ascending', () => {
    const a = makeTransaction({ id: 'a', name: 'Zebra' })
    const b = makeTransaction({ id: 'b', name: 'Apple' })
    expect(compareTransactions(a, b, 'name', 'asc', categoryMap, methodMap, personMap)).toBeGreaterThan(0)
  })

  it('sorts by name descending', () => {
    const a = makeTransaction({ id: 'a', name: 'Zebra' })
    const b = makeTransaction({ id: 'b', name: 'Apple' })
    expect(compareTransactions(a, b, 'name', 'desc', categoryMap, methodMap, personMap)).toBeLessThan(0)
  })

  it('sorts by amount', () => {
    const a = makeTransaction({ id: 'a', plannedAmount: money(50n) })
    const b = makeTransaction({ id: 'b', plannedAmount: money(200n) })
    expect(compareTransactions(a, b, 'amount', 'asc', categoryMap, methodMap, personMap)).toBeLessThan(0)
  })

  it('sorts by resolved category name', () => {
    const foodCat: Category = { id: 1, name: 'Food', typeId: 1, isSystem: false, color: '' }
    const autoCat: Category = { id: 2, name: 'Auto', typeId: 1, isSystem: false, color: '' }
    const map = new Map([[foodCat.id, foodCat], [autoCat.id, autoCat]])
    const a = makeTransaction({ id: 'a', categoryId: 1 })
    const b = makeTransaction({ id: 'b', categoryId: 2 })
    // "Auto" < "Food" alphabetically, so b should sort before a ascending
    expect(compareTransactions(a, b, 'category', 'asc', map, methodMap, personMap)).toBeGreaterThan(0)
  })

  it('sorts by resolved owner name', () => {
    const a = makeTransaction({ id: 'a', paymentMethodId: 'pm-1' })
    const otherPerson: BudgetPerson = { id: 6n, userName: 'Blair', color: '' }
    const otherMethod: PaymentMethod = { id: 'pm-2', name: 'Debit', type: 3, budgetPersonId: 6n, color: '' }
    const map = new Map([[method.id, method], [otherMethod.id, otherMethod]])
    const pMap = new Map([[person.id.toString(), person], [otherPerson.id.toString(), otherPerson]])
    const b = makeTransaction({ id: 'b', paymentMethodId: 'pm-2' })
    // "Alex" < "Blair" alphabetically
    expect(compareTransactions(a, b, 'owner', 'asc', categoryMap, map, pMap)).toBeLessThan(0)
  })

  it('falls back to id when the primary key is equal', () => {
    const a = makeTransaction({ id: 'a', name: 'Same' })
    const b = makeTransaction({ id: 'b', name: 'Same' })
    expect(compareTransactions(a, b, 'name', 'asc', categoryMap, methodMap, personMap)).toBeLessThan(0)
  })
})
