import { RecurringCharge, Transaction } from './types';

export const sampleTransactions: Transaction[] = [
  {
    id: 'income-sg-jan',
    account: 'SG',
    type: 'INCOME',
    amount: 2200,
    date: '2024-01-05',
  },
  {
    id: 'expense-sg-jan-deferred',
    account: 'SG',
    type: 'EXPENSE',
    amount: 120,
    date: '2024-01-10',
    isDeferred: true,
    deferredTo: '2024-02',
  },
];

export const sampleRecurringCharges: RecurringCharge[] = [
  {
    id: 'sg-rent',
    account: 'SG',
    amount: 850,
    startMonth: '2024-01',
    endMonth: '2024-12',
  },
  {
    id: 'floa-credit',
    account: 'FLOA',
    amount: 300,
    startMonth: '2024-01',
    endMonth: '2024-12',
  },
];
