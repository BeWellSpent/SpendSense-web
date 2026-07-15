import { PaymentType } from '@/gen/wellspent/v1/common_pb'

export const PAYMENT_TYPE_KEYS: { value: PaymentType; key: string }[] = [
  { value: PaymentType.CASH, key: 'cash' },
  { value: PaymentType.CREDIT, key: 'credit' },
  { value: PaymentType.DEBIT, key: 'debit' },
  { value: PaymentType.DIGITAL_WALLET, key: 'digitalWallet' },
  { value: PaymentType.BANK_TRANSFER, key: 'bankTransfer' },
  { value: PaymentType.CRYPTO, key: 'crypto' },
  { value: PaymentType.INVESTMENT, key: 'investment' },
]
