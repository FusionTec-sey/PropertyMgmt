import { 
  JournalEntry, 
  Payment, 
  Expense, 
  Invoice, 
  Lease,
  PaymentCurrency,
  UserId,
  TenantId,
  PropertyId,
  UnitId
} from '@/types';
import { mapExpenseCategoryToAccount, mapPaymentToAccount } from '@/constants/chartOfAccounts';

export interface CreateJournalEntryParams {
  tenantId: TenantId;
  transactionDate: string;
  description: string;
  accountCode: string;
  entryType: 'debit' | 'credit';
  amount: number;
  currency: PaymentCurrency;
  transactionType: 'payment' | 'expense' | 'invoice' | 'deposit' | 'adjustment';
  referenceId?: string;
  referenceType?: 'payment' | 'expense' | 'invoice' | 'lease' | 'maintenance';
  propertyId?: PropertyId;
  unitId?: UnitId;
  notes?: string;
  createdBy: UserId;
}

export function createJournalEntry(params: CreateJournalEntryParams): JournalEntry {
  return {
    id: `je-${Date.now()}-${Math.random()}`,
    tenant_id: params.tenantId,
    transaction_date: params.transactionDate,
    transaction_type: params.transactionType,
    reference_id: params.referenceId,
    reference_type: params.referenceType,
    description: params.description,
    account_code: params.accountCode,
    entry_type: params.entryType,
    amount: params.amount,
    currency: params.currency,
    property_id: params.propertyId,
    unit_id: params.unitId,
    notes: params.notes,
    created_by: params.createdBy,
    created_at: new Date().toISOString(),
  };
}

export function createPaymentJournalEntries(
  payment: Payment,
  lease: Lease,
  tenantId: TenantId,
  createdBy: UserId
): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const paymentType = payment.payment_type || 'rent';
  const accountCode = payment.account_code || mapPaymentToAccount(paymentType);

  if (payment.status === 'paid') {
    entries.push(
      createJournalEntry({
        tenantId,
        transactionDate: payment.payment_date,
        description: `Payment received - ${paymentType}`,
        accountCode: '1000',
        entryType: 'debit',
        amount: payment.amount,
        currency: payment.currency,
        transactionType: 'payment',
        referenceId: payment.id,
        referenceType: 'payment',
        propertyId: lease.property_id,
        unitId: lease.unit_id,
        createdBy,
      })
    );

    entries.push(
      createJournalEntry({
        tenantId,
        transactionDate: payment.payment_date,
        description: `Payment received - ${paymentType}`,
        accountCode,
        entryType: 'credit',
        amount: payment.amount,
        currency: payment.currency,
        transactionType: 'payment',
        referenceId: payment.id,
        referenceType: 'payment',
        propertyId: lease.property_id,
        unitId: lease.unit_id,
        createdBy,
      })
    );

    if (payment.late_fee && payment.late_fee > 0) {
      entries.push(
        createJournalEntry({
          tenantId,
          transactionDate: payment.payment_date,
          description: 'Late fee received',
          accountCode: '1000',
          entryType: 'debit',
          amount: payment.late_fee,
          currency: payment.currency,
          transactionType: 'payment',
          referenceId: payment.id,
          referenceType: 'payment',
          propertyId: lease.property_id,
          unitId: lease.unit_id,
          createdBy,
        })
      );

      entries.push(
        createJournalEntry({
          tenantId,
          transactionDate: payment.payment_date,
          description: 'Late fee received',
          accountCode: '4100',
          entryType: 'credit',
          amount: payment.late_fee,
          currency: payment.currency,
          transactionType: 'payment',
          referenceId: payment.id,
          referenceType: 'payment',
          propertyId: lease.property_id,
          unitId: lease.unit_id,
          createdBy,
        })
      );
    }
  }

  return entries;
}

export function createExpenseJournalEntries(
  expense: Expense,
  tenantId: TenantId,
  createdBy: UserId
): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const accountCode = expense.account_code || mapExpenseCategoryToAccount(expense.category);

  if (expense.status === 'paid') {
    entries.push(
      createJournalEntry({
        tenantId,
        transactionDate: expense.expense_date,
        description: `Expense - ${expense.description}`,
        accountCode,
        entryType: 'debit',
        amount: expense.amount,
        currency: expense.currency,
        transactionType: 'expense',
        referenceId: expense.id,
        referenceType: 'expense',
        propertyId: expense.property_id,
        unitId: expense.unit_id,
        notes: expense.vendor_name,
        createdBy,
      })
    );

    entries.push(
      createJournalEntry({
        tenantId,
        transactionDate: expense.expense_date,
        description: `Expense - ${expense.description}`,
        accountCode: '1000',
        entryType: 'credit',
        amount: expense.amount,
        currency: expense.currency,
        transactionType: 'expense',
        referenceId: expense.id,
        referenceType: 'expense',
        propertyId: expense.property_id,
        unitId: expense.unit_id,
        notes: expense.vendor_name,
        createdBy,
      })
    );
  } else if (expense.status === 'pending' || expense.status === 'approved') {
    entries.push(
      createJournalEntry({
        tenantId,
        transactionDate: expense.expense_date,
        description: `Expense accrued - ${expense.description}`,
        accountCode,
        entryType: 'debit',
        amount: expense.amount,
        currency: expense.currency,
        transactionType: 'expense',
        referenceId: expense.id,
        referenceType: 'expense',
        propertyId: expense.property_id,
        unitId: expense.unit_id,
        notes: expense.vendor_name,
        createdBy,
      })
    );

    entries.push(
      createJournalEntry({
        tenantId,
        transactionDate: expense.expense_date,
        description: `Expense accrued - ${expense.description}`,
        accountCode: '2000',
        entryType: 'credit',
        amount: expense.amount,
        currency: expense.currency,
        transactionType: 'expense',
        referenceId: expense.id,
        referenceType: 'expense',
        propertyId: expense.property_id,
        unitId: expense.unit_id,
        notes: expense.vendor_name,
        createdBy,
      })
    );
  }

  return entries;
}

export function createInvoiceJournalEntries(
  invoice: Invoice,
  tenantId: TenantId,
  createdBy: UserId
): JournalEntry[] {
  const entries: JournalEntry[] = [];

  if (invoice.status === 'sent' || invoice.status === 'overdue') {
    entries.push(
      createJournalEntry({
        tenantId,
        transactionDate: invoice.invoice_date,
        description: `Invoice ${invoice.invoice_number} - Accounts Receivable`,
        accountCode: '1100',
        entryType: 'debit',
        amount: invoice.total_amount,
        currency: invoice.currency,
        transactionType: 'invoice',
        referenceId: invoice.id,
        referenceType: 'invoice',
        propertyId: invoice.property_id,
        unitId: invoice.unit_id,
        createdBy,
      })
    );

    entries.push(
      createJournalEntry({
        tenantId,
        transactionDate: invoice.invoice_date,
        description: `Invoice ${invoice.invoice_number} - Rental Income`,
        accountCode: '4000',
        entryType: 'credit',
        amount: invoice.total_amount,
        currency: invoice.currency,
        transactionType: 'invoice',
        referenceId: invoice.id,
        referenceType: 'invoice',
        propertyId: invoice.property_id,
        unitId: invoice.unit_id,
        createdBy,
      })
    );
  }

  return entries;
}

export function createDepositJournalEntries(
  lease: Lease,
  tenantId: TenantId,
  createdBy: UserId
): JournalEntry[] {
  const entries: JournalEntry[] = [];

  entries.push(
    createJournalEntry({
      tenantId,
      transactionDate: lease.start_date,
      description: `Security deposit received - Lease ${lease.id}`,
      accountCode: '1200',
      entryType: 'debit',
      amount: lease.deposit_amount,
      currency: 'SCR',
      transactionType: 'deposit',
      referenceId: lease.id,
      referenceType: 'lease',
      propertyId: lease.property_id,
      unitId: lease.unit_id,
      createdBy,
    })
  );

  entries.push(
    createJournalEntry({
      tenantId,
      transactionDate: lease.start_date,
      description: `Security deposit liability - Lease ${lease.id}`,
      accountCode: '2100',
      entryType: 'credit',
      amount: lease.deposit_amount,
      currency: 'SCR',
      transactionType: 'deposit',
      referenceId: lease.id,
      referenceType: 'lease',
      propertyId: lease.property_id,
      unitId: lease.unit_id,
      createdBy,
    })
  );

  return entries;
}

export function assignAccountCodeToExpense(expense: Expense): string {
  if (expense.account_code) {
    return expense.account_code;
  }
  return mapExpenseCategoryToAccount(expense.category);
}

export function assignAccountCodeToPayment(payment: Payment): string {
  if (payment.account_code) {
    return payment.account_code;
  }
  const paymentType = payment.payment_type || 'rent';
  return mapPaymentToAccount(paymentType);
}

export function calculateCashBalance(journalEntries: JournalEntry[]): number {
  return journalEntries
    .filter(entry => entry.account_code === '1000')
    .reduce((balance, entry) => {
      if (entry.entry_type === 'debit') {
        return balance + entry.amount;
      } else {
        return balance - entry.amount;
      }
    }, 0);
}

export function calculateAccountReceivableBalance(journalEntries: JournalEntry[]): number {
  return journalEntries
    .filter(entry => entry.account_code === '1100')
    .reduce((balance, entry) => {
      if (entry.entry_type === 'debit') {
        return balance + entry.amount;
      } else {
        return balance - entry.amount;
      }
    }, 0);
}
