import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { TrendingUp, DollarSign, PieChart, FileText, Building2, X, Receipt } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { 
  generateIncomeStatement, 
  generateBalanceSheet, 
  generateCashFlowStatement,
  generatePropertyPerformance,
  formatCurrency
} from '@/utils/financeReports';
import { getAccountsByType, DEFAULT_CHART_OF_ACCOUNTS } from '@/constants/chartOfAccounts';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';

type ReportType = 'income' | 'balance' | 'cashflow' | 'property' | 'accounts' | 'ledger';
type PeriodType = 'month' | 'quarter' | 'year' | 'custom';

export default function FinanceScreen() {
  const { payments, expenses, leases, properties, units, journalEntries } = useApp();
  const params = useLocalSearchParams<{ propertyId?: string }>();
  
  const [activeReport, setActiveReport] = useState<ReportType>('income');
  const [selectedAccountCode, setSelectedAccountCode] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (params.propertyId) {
      setSelectedPropertyId(params.propertyId);
    }
  }, [params.propertyId]);

  const dateRange = useMemo(() => {
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]) - 1;

    let start: Date;
    let end: Date;

    switch (selectedPeriod) {
      case 'month':
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(month / 3);
        start = new Date(year, quarter * 3, 1);
        end = new Date(year, (quarter + 1) * 3, 0);
        break;
      case 'year':
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
        break;
      default:
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label: selectedPeriod === 'year' 
        ? `${year}` 
        : selectedPeriod === 'quarter'
        ? `Q${Math.floor(month / 3) + 1} ${year}`
        : start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [selectedMonth, selectedPeriod]);

  const filteredPayments = useMemo(() => {
    if (!selectedPropertyId) return payments;
    const propertyLeases = leases.filter(l => l.property_id === selectedPropertyId);
    return payments.filter(p => propertyLeases.some(l => l.id === p.lease_id));
  }, [payments, leases, selectedPropertyId]);

  const filteredExpenses = useMemo(() => {
    if (!selectedPropertyId) return expenses;
    return expenses.filter(e => e.property_id === selectedPropertyId);
  }, [expenses, selectedPropertyId]);

  const incomeStatement = useMemo(() => 
    generateIncomeStatement(filteredPayments, filteredExpenses, dateRange.start, dateRange.end),
    [filteredPayments, filteredExpenses, dateRange]
  );

  const balanceSheet = useMemo(() => 
    generateBalanceSheet(filteredPayments, filteredExpenses, leases, dateRange.end),
    [filteredPayments, filteredExpenses, leases, dateRange]
  );

  const cashFlow = useMemo(() => 
    generateCashFlowStatement(filteredPayments, filteredExpenses, dateRange.start, dateRange.end),
    [filteredPayments, filteredExpenses, dateRange]
  );

  const propertyPerformance = useMemo(() => {
    const propertiesToShow = selectedPropertyId 
      ? properties.filter(p => p.id === selectedPropertyId)
      : properties;
    return propertiesToShow.map(p => 
      generatePropertyPerformance(
        p.id,
        p.name,
        payments,
        expenses,
        units,
        leases,
        dateRange.start,
        dateRange.end
      )
    );
  }, [properties, payments, expenses, units, leases, dateRange, selectedPropertyId]);

  const selectedProperty = useMemo(() => 
    selectedPropertyId ? properties.find(p => p.id === selectedPropertyId) : null,
    [selectedPropertyId, properties]
  );

  const accountBalances = useMemo(() => {
    const balances = new Map<string, { balance: number; entryCount: number }>();
    
    journalEntries.forEach(entry => {
      const current = balances.get(entry.account_code) || { balance: 0, entryCount: 0 };
      const account = DEFAULT_CHART_OF_ACCOUNTS.find(a => a.code === entry.account_code);
      
      if (account) {
        const isDebitNormal = account.type === 'asset' || account.type === 'expense';
        const change = entry.entry_type === 'debit' 
          ? (isDebitNormal ? entry.amount : -entry.amount)
          : (isDebitNormal ? -entry.amount : entry.amount);
        
        balances.set(entry.account_code, {
          balance: current.balance + change,
          entryCount: current.entryCount + 1,
        });
      }
    });
    
    return balances;
  }, [journalEntries]);



  const renderIncomeStatement = () => (
    <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
      <Card style={styles.reportCard}>
        <Text style={styles.reportTitle}>Income Statement</Text>
        <Text style={styles.reportSubtitle}>{dateRange.label}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REVENUE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Rental Income</Text>
            <Text style={styles.value}>{formatCurrency(incomeStatement.revenue.rentalIncome)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Late Fees</Text>
            <Text style={styles.value}>{formatCurrency(incomeStatement.revenue.lateFees)}</Text>
          </View>
          {incomeStatement.revenue.otherIncome > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Other Income</Text>
              <Text style={styles.value}>{formatCurrency(incomeStatement.revenue.otherIncome)}</Text>
            </View>
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Revenue</Text>
            <Text style={styles.totalValue}>{formatCurrency(incomeStatement.revenue.totalRevenue)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPENSES</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Maintenance & Repairs</Text>
            <Text style={styles.value}>{formatCurrency(incomeStatement.expenses.maintenance)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Utilities</Text>
            <Text style={styles.value}>{formatCurrency(incomeStatement.expenses.utilities)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Insurance</Text>
            <Text style={styles.value}>{formatCurrency(incomeStatement.expenses.insurance)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Property Taxes</Text>
            <Text style={styles.value}>{formatCurrency(incomeStatement.expenses.taxes)}</Text>
          </View>
          {incomeStatement.expenses.management > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Management Fees</Text>
              <Text style={styles.value}>{formatCurrency(incomeStatement.expenses.management)}</Text>
            </View>
          )}
          {incomeStatement.expenses.other > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Other Expenses</Text>
              <Text style={styles.value}>{formatCurrency(incomeStatement.expenses.other)}</Text>
            </View>
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Expenses</Text>
            <Text style={styles.totalValue}>{formatCurrency(incomeStatement.expenses.totalExpenses)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.row, styles.netIncomeRow]}>
            <View>
              <Text style={styles.netIncomeLabel}>Net Income</Text>
              <Text style={styles.profitMargin}>
                Profit Margin: {incomeStatement.profitMargin.toFixed(1)}%
              </Text>
            </View>
            <Text style={[
              styles.netIncomeValue,
              incomeStatement.netIncome < 0 && { color: '#FF3B30' }
            ]}>
              {formatCurrency(incomeStatement.netIncome)}
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderBalanceSheet = () => (
    <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
      <Card style={styles.reportCard}>
        <Text style={styles.reportTitle}>Balance Sheet</Text>
        <Text style={styles.reportSubtitle}>As of {new Date(dateRange.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ASSETS</Text>
          <Text style={styles.subsectionTitle}>Current Assets</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cash and Cash Equivalents</Text>
            <Text style={styles.value}>{formatCurrency(balanceSheet.assets.currentAssets.cash)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Accounts Receivable</Text>
            <Text style={styles.value}>{formatCurrency(balanceSheet.assets.currentAssets.accountsReceivable)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Security Deposits Held</Text>
            <Text style={styles.value}>{formatCurrency(balanceSheet.assets.currentAssets.securityDeposits)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Assets</Text>
            <Text style={styles.totalValue}>{formatCurrency(balanceSheet.assets.totalAssets)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIABILITIES</Text>
          <Text style={styles.subsectionTitle}>Current Liabilities</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Accounts Payable</Text>
            <Text style={styles.value}>{formatCurrency(balanceSheet.liabilities.currentLiabilities.accountsPayable)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Security Deposits Payable</Text>
            <Text style={styles.value}>{formatCurrency(balanceSheet.liabilities.currentLiabilities.securityDepositsPayable)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Prepaid Rent</Text>
            <Text style={styles.value}>{formatCurrency(balanceSheet.liabilities.currentLiabilities.prepaidRent)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Liabilities</Text>
            <Text style={styles.totalValue}>{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EQUITY</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Owner&apos;s Equity</Text>
            <Text style={styles.value}>{formatCurrency(balanceSheet.equity.ownersEquity)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Retained Earnings</Text>
            <Text style={[
              styles.value,
              balanceSheet.equity.retainedEarnings < 0 && { color: '#FF3B30' }
            ]}>
              {formatCurrency(balanceSheet.equity.retainedEarnings)}
            </Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Equity</Text>
            <Text style={[
              styles.totalValue,
              balanceSheet.equity.totalEquity < 0 && { color: '#FF3B30' }
            ]}>
              {formatCurrency(balanceSheet.equity.totalEquity)}
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderCashFlow = () => (
    <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
      <Card style={styles.reportCard}>
        <Text style={styles.reportTitle}>Cash Flow Statement</Text>
        <Text style={styles.reportSubtitle}>{dateRange.label}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPERATING ACTIVITIES</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Net Income</Text>
            <Text style={styles.value}>{formatCurrency(cashFlow.operatingActivities.netIncome)}</Text>
          </View>
          <Text style={styles.subsectionTitle}>Adjustments:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Change in Accounts Receivable</Text>
            <Text style={styles.value}>{formatCurrency(cashFlow.operatingActivities.adjustments.accountsReceivable)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Change in Accounts Payable</Text>
            <Text style={styles.value}>{formatCurrency(cashFlow.operatingActivities.adjustments.accountsPayable)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Net Cash from Operations</Text>
            <Text style={[
              styles.totalValue,
              cashFlow.operatingActivities.netCashFromOperations < 0 && { color: '#FF3B30' }
            ]}>
              {formatCurrency(cashFlow.operatingActivities.netCashFromOperations)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.row, styles.netIncomeRow]}>
            <Text style={styles.netIncomeLabel}>Net Cash Flow</Text>
            <Text style={[
              styles.netIncomeValue,
              cashFlow.netCashFlow < 0 && { color: '#FF3B30' }
            ]}>
              {formatCurrency(cashFlow.netCashFlow)}
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderPropertyPerformance = () => (
    <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.reportHeaderTitle}>Property Performance</Text>
      <Text style={styles.reportHeaderSubtitle}>{dateRange.label}</Text>

      {propertyPerformance.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Properties"
          message="Add properties to see performance reports"
          testID="property-performance-empty"
        />
      ) : (
        <FlatList
          data={propertyPerformance}
          keyExtractor={(item) => item.propertyId}
          renderItem={({ item }) => (
            <Card style={styles.propertyCard}>
              <View style={styles.propertyHeader}>
                <View>
                  <Text style={styles.propertyName}>{item.propertyName}</Text>
                  <Text style={styles.occupancyLabel}>
                    Occupancy: {item.occupancyRate.toFixed(0)}%
                  </Text>
                </View>
                <Badge 
                  label={`NOI: ${formatCurrency(item.netOperatingIncome)}`} 
                  variant={item.netOperatingIncome >= 0 ? 'success' : 'danger'} 
                />
              </View>

              <View style={styles.propertyStats}>
                <View style={styles.propertyStat}>
                  <Text style={styles.propertyStatLabel}>Revenue</Text>
                  <Text style={styles.propertyStatValue}>{formatCurrency(item.totalRevenue)}</Text>
                </View>
                <View style={styles.propertyStat}>
                  <Text style={styles.propertyStatLabel}>Expenses</Text>
                  <Text style={styles.propertyStatValue}>{formatCurrency(item.totalExpenses)}</Text>
                </View>
                <View style={styles.propertyStat}>
                  <Text style={styles.propertyStatLabel}>Avg Rent/Unit</Text>
                  <Text style={styles.propertyStatValue}>{formatCurrency(item.averageRentPerUnit)}</Text>
                </View>
              </View>
            </Card>
          )}
          contentContainerStyle={styles.propertyList}
          scrollEnabled={false}
        />
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderAccountLedger = () => {
    if (!selectedAccountCode) {
      return (
        <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.reportHeaderTitle}>Account Ledger</Text>
          <Text style={styles.reportHeaderSubtitle}>Select an account to view transactions</Text>

          {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
            const accounts = getAccountsByType(type as any);
            return (
              <Card key={type} style={styles.accountCard}>
                <View style={styles.accountTypeHeader}>
                  <Text style={styles.accountTypeTitle}>{type.toUpperCase()}</Text>
                  <Badge label={`${accounts.length} accounts`} variant="info" />
                </View>

                {accounts.map((account) => {
                  const balanceInfo = accountBalances.get(account.code);
                  return (
                    <TouchableOpacity
                      key={account.code}
                      style={styles.accountRowClickable}
                      onPress={() => setSelectedAccountCode(account.code)}
                      testID={`account-${account.code}`}
                    >
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountCode}>{account.code}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.accountName}>{account.name}</Text>
                          <Text style={styles.accountDescription}>{account.description}</Text>
                        </View>
                      </View>
                      <View style={styles.accountBalanceInfo}>
                        {balanceInfo && (
                          <>
                            <Text style={styles.accountBalanceValue}>
                              {formatCurrency(balanceInfo.balance)}
                            </Text>
                            <Text style={styles.accountEntryCount}>
                              {balanceInfo.entryCount} {balanceInfo.entryCount === 1 ? 'entry' : 'entries'}
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Card>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      );
    }

    const account = DEFAULT_CHART_OF_ACCOUNTS.find(a => a.code === selectedAccountCode);
    const accountEntries = journalEntries
      .filter(e => e.account_code === selectedAccountCode)
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    
    const balanceInfo = accountBalances.get(selectedAccountCode);

    return (
      <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.ledgerHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedAccountCode(null)}
          >
            <X size={20} color="#007AFF" />
            <Text style={styles.backButtonText}>Back to Accounts</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.reportCard}>
          <View style={styles.ledgerAccountHeader}>
            <View>
              <Text style={styles.ledgerAccountCode}>{account?.code}</Text>
              <Text style={styles.ledgerAccountName}>{account?.name}</Text>
              <Text style={styles.ledgerAccountDescription}>{account?.description}</Text>
            </View>
            <View style={styles.ledgerAccountBalance}>
              <Text style={styles.ledgerBalanceLabel}>Balance</Text>
              <Text style={styles.ledgerBalanceValue}>
                {formatCurrency(balanceInfo?.balance || 0)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.reportCard}>
          <Text style={styles.reportTitle}>Transaction History</Text>
          <Text style={styles.reportSubtitle}>
            {accountEntries.length} {accountEntries.length === 1 ? 'transaction' : 'transactions'}
          </Text>

          {accountEntries.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Transactions"
              message="No journal entries have been recorded for this account"
              testID="account-ledger-empty"
            />
          ) : (
            <View>
              {accountEntries.map((entry, index) => (
                <View key={entry.id} style={styles.ledgerEntry}>
                  <View style={styles.ledgerEntryHeader}>
                    <Text style={styles.ledgerEntryDate}>
                      {new Date(entry.transaction_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Badge
                      label={entry.entry_type.toUpperCase()}
                      variant={entry.entry_type === 'debit' ? 'warning' : 'success'}
                    />
                  </View>
                  <Text style={styles.ledgerEntryDescription}>{entry.description}</Text>
                  {entry.notes && (
                    <Text style={styles.ledgerEntryNotes}>{entry.notes}</Text>
                  )}
                  <View style={styles.ledgerEntryFooter}>
                    <Text style={styles.ledgerEntryType}>
                      {entry.transaction_type.charAt(0).toUpperCase() + entry.transaction_type.slice(1)}
                    </Text>
                    <Text style={[
                      styles.ledgerEntryAmount,
                      entry.entry_type === 'debit' ? styles.debitAmount : styles.creditAmount,
                    ]}>
                      {entry.entry_type === 'debit' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </Text>
                  </View>
                  {index < accountEntries.length - 1 && <View style={styles.ledgerEntrySeparator} />}
                </View>
              ))}
            </View>
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  const renderChartOfAccounts = () => (
    <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.reportHeaderTitle}>Chart of Accounts</Text>
      <Text style={styles.reportHeaderSubtitle}>Standard Accounting Structure</Text>

      {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
        const accounts = getAccountsByType(type as any);
        return (
          <Card key={type} style={styles.accountCard}>
            <View style={styles.accountTypeHeader}>
              <Text style={styles.accountTypeTitle}>{type.toUpperCase()}</Text>
              <Badge label={`${accounts.length} accounts`} variant="info" />
            </View>

            {accounts.map((account) => (
              <View key={account.code} style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountCode}>{account.code}</Text>
                  <View>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountDescription}>{account.description}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        );
      })}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Financial Reports</Text>
          <Text style={styles.headerSubtitle}>
            {selectedProperty ? `Property: ${selectedProperty.name}` : 'Track your business performance'}
          </Text>
        </View>
      </View>

      {selectedProperty && (
        <View style={styles.propertyFilterBar}>
          <View style={styles.propertyFilterContent}>
            <Building2 size={16} color="#007AFF" />
            <Text style={styles.propertyFilterText}>{selectedProperty.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => setSelectedPropertyId(null)}
          >
            <X size={16} color="#666" />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.propertySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.propertySelectorButton,
              !selectedPropertyId && styles.propertySelectorButtonActive
            ]}
            onPress={() => setSelectedPropertyId(null)}
          >
            <Text style={[
              styles.propertySelectorButtonText,
              !selectedPropertyId && styles.propertySelectorButtonTextActive
            ]}>All Properties</Text>
          </TouchableOpacity>
          {properties.map(property => (
            <TouchableOpacity
              key={property.id}
              style={[
                styles.propertySelectorButton,
                selectedPropertyId === property.id && styles.propertySelectorButtonActive
              ]}
              onPress={() => setSelectedPropertyId(property.id)}
            >
              <Text style={[
                styles.propertySelectorButtonText,
                selectedPropertyId === property.id && styles.propertySelectorButtonTextActive
              ]}>{property.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['month', 'quarter', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period as PeriodType)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.reportTypeSelector}
      >
        <TouchableOpacity
          style={[styles.reportTypeButton, activeReport === 'income' && styles.reportTypeButtonActive]}
          onPress={() => setActiveReport('income')}
        >
          <TrendingUp size={20} color={activeReport === 'income' ? '#007AFF' : '#666'} />
          <Text style={[styles.reportTypeText, activeReport === 'income' && styles.reportTypeTextActive]}>
            Income Statement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTypeButton, activeReport === 'balance' && styles.reportTypeButtonActive]}
          onPress={() => setActiveReport('balance')}
        >
          <PieChart size={20} color={activeReport === 'balance' ? '#007AFF' : '#666'} />
          <Text style={[styles.reportTypeText, activeReport === 'balance' && styles.reportTypeTextActive]}>
            Balance Sheet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTypeButton, activeReport === 'cashflow' && styles.reportTypeButtonActive]}
          onPress={() => setActiveReport('cashflow')}
        >
          <DollarSign size={20} color={activeReport === 'cashflow' ? '#007AFF' : '#666'} />
          <Text style={[styles.reportTypeText, activeReport === 'cashflow' && styles.reportTypeTextActive]}>
            Cash Flow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTypeButton, activeReport === 'property' && styles.reportTypeButtonActive]}
          onPress={() => setActiveReport('property')}
        >
          <Building2 size={20} color={activeReport === 'property' ? '#007AFF' : '#666'} />
          <Text style={[styles.reportTypeText, activeReport === 'property' && styles.reportTypeTextActive]}>
            By Property
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTypeButton, activeReport === 'accounts' && styles.reportTypeButtonActive]}
          onPress={() => setActiveReport('accounts')}
        >
          <FileText size={20} color={activeReport === 'accounts' ? '#007AFF' : '#666'} />
          <Text style={[styles.reportTypeText, activeReport === 'accounts' && styles.reportTypeTextActive]}>
            Chart of Accounts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportTypeButton, activeReport === 'ledger' && styles.reportTypeButtonActive]}
          onPress={() => {
            setActiveReport('ledger');
            setSelectedAccountCode(null);
          }}
        >
          <Receipt size={20} color={activeReport === 'ledger' ? '#007AFF' : '#666'} />
          <Text style={[styles.reportTypeText, activeReport === 'ledger' && styles.reportTypeTextActive]}>
            Account Ledger
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {activeReport === 'income' && renderIncomeStatement()}
      {activeReport === 'balance' && renderBalanceSheet()}
      {activeReport === 'cashflow' && renderCashFlow()}
      {activeReport === 'property' && renderPropertyPerformance()}
      {activeReport === 'accounts' && renderChartOfAccounts()}
      {activeReport === 'ledger' && renderAccountLedger()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  periodSelector: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  reportTypeSelector: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    maxHeight: 70,
  },
  reportTypeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent' as const,
  },
  reportTypeButtonActive: {
    borderBottomColor: '#007AFF',
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  reportTypeTextActive: {
    color: '#007AFF',
  },
  reportContainer: {
    flex: 1,
    padding: 16,
  },
  reportHeaderTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  reportHeaderSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reportCard: {
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  value: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#007AFF',
  },
  netIncomeRow: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  netIncomeLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  netIncomeValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#34C759',
  },
  profitMargin: {
    fontSize: 12,
    color: '#666',
  },
  propertyList: {
    paddingBottom: 16,
  },
  propertyCard: {
    marginBottom: 16,
  },
  propertyHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  occupancyLabel: {
    fontSize: 14,
    color: '#666',
  },
  propertyStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  propertyStat: {
    flex: 1,
    alignItems: 'center' as const,
  },
  propertyStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  propertyStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  accountCard: {
    marginBottom: 16,
  },
  accountTypeHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  accountTypeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  accountRow: {
    marginBottom: 16,
  },
  accountRowClickable: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  accountBalanceInfo: {
    alignItems: 'flex-end' as const,
    marginLeft: 12,
  },
  accountBalanceValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 2,
  },
  accountEntryCount: {
    fontSize: 11,
    color: '#999',
  },
  ledgerHeader: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  ledgerAccountHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  ledgerAccountCode: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 4,
  },
  ledgerAccountName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ledgerAccountDescription: {
    fontSize: 14,
    color: '#666',
  },
  ledgerAccountBalance: {
    alignItems: 'flex-end' as const,
  },
  ledgerBalanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ledgerBalanceValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#007AFF',
  },
  ledgerEntry: {
    paddingVertical: 12,
  },
  ledgerEntryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  ledgerEntryDate: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  ledgerEntryDescription: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ledgerEntryNotes: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  ledgerEntryFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  ledgerEntryType: {
    fontSize: 12,
    color: '#666',
  },
  ledgerEntryAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  debitAmount: {
    color: '#34C759',
  },
  creditAmount: {
    color: '#FF3B30',
  },
  ledgerEntrySeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 12,
  },
  accountInfo: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  accountCode: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#007AFF',
    width: 50,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  accountDescription: {
    fontSize: 12,
    color: '#666',
  },
  propertyFilterBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#E8F4FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
  },
  propertyFilterContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  propertyFilterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  clearFilterButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  propertySelector: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  propertySelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  propertySelectorButtonActive: {
    backgroundColor: '#007AFF',
  },
  propertySelectorButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  propertySelectorButtonTextActive: {
    color: '#FFFFFF',
  },
});
