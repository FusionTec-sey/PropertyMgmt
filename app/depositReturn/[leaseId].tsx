import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { DollarSign, CheckCircle, User, Building } from 'lucide-react-native';
import Button from '@/components/Button';
import Card from '@/components/Card';

import Input from '@/components/Input';

export default function DepositReturnScreen() {
  const { leaseId, damageCost } = useLocalSearchParams();
  const router = useRouter();
  const { leases, units, properties, tenantRenters, updateLease, addPayment } = useApp();

  const lease = leases.find(l => l.id === leaseId);
  const unit = units.find(u => u.id === lease?.unit_id);
  const property = properties.find(p => p.id === lease?.property_id);
  const tenant = tenantRenters.find(t => t.id === lease?.tenant_renter_id);

  const totalDamageCost = parseFloat(damageCost as string) || 0;
  const depositAmount = lease?.deposit_amount || 0;
  const depositReturn = Math.max(0, depositAmount - totalDamageCost);

  const [deductions, setDeductions] = useState<{ description: string; amount: number }[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'cheque'>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const addDeduction = () => {
    setDeductions([...deductions, { description: '', amount: 0 }]);
  };

  const updateDeduction = (index: number, field: 'description' | 'amount', value: string | number) => {
    const updated = [...deductions];
    if (field === 'description') {
      updated[index].description = value as string;
    } else {
      updated[index].amount = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    }
    setDeductions(updated);
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const totalAdditionalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const finalDepositReturn = Math.max(0, depositReturn - totalAdditionalDeductions);

  const handleComplete = async () => {
    if (!lease || !unit || !tenant) return;

    Alert.alert(
      'Complete Deposit Return',
      `Final deposit return: ₨${finalDepositReturn.toLocaleString()} SCR\n\nThis will:\n- Mark the lease as terminated\n- Create a payment record\n- Update the unit status\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setIsSaving(true);
            try {
              await updateLease(lease.id, {
                status: 'terminated',
              });

              if (finalDepositReturn > 0) {
                await addPayment({
                  lease_id: lease.id,
                  tenant_renter_id: tenant.id,
                  amount: finalDepositReturn,
                  currency: 'SCR',
                  payment_date: returnDate,
                  due_date: returnDate,
                  status: 'paid',
                  payment_method: paymentMethod,
                  reference_number: referenceNumber || undefined,
                  notes: `Deposit return after deductions:\n- Damage repairs: ₨${totalDamageCost}\n- Additional deductions: ₨${totalAdditionalDeductions}\n${additionalNotes ? `\n${additionalNotes}` : ''}`,
                });
              }

              Alert.alert('Success', 'Deposit return completed successfully!', [
                { text: 'OK', onPress: () => router.push('/(tabs)') },
              ]);
            } catch (error) {
              console.error('Error completing deposit return:', error);
              Alert.alert('Error', 'Failed to complete deposit return');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (!lease || !unit || !tenant) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Deposit Return' }} />
        <Text style={styles.errorText}>Lease, unit, or tenant not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Security Deposit Return',
        }}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <DollarSign size={32} color="#34C759" />
            </View>
            <Text style={styles.headerTitle}>Deposit Return Summary</Text>
          </View>

          <View style={styles.infoRow}>
            <Building size={18} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Property & Unit</Text>
              <Text style={styles.infoValue}>{property?.name} - Unit {unit.unit_number}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <User size={18} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tenant</Text>
              <Text style={styles.infoValue}>
                {tenant.type === 'business'
                  ? tenant.business_name
                  : `${tenant.first_name} ${tenant.last_name}`}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.calculationCard}>
          <Text style={styles.sectionTitle}>Deposit Calculation</Text>
          
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Original Security Deposit</Text>
            <Text style={styles.calcValue}>₨{depositAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Damage/Repair Costs</Text>
            <Text style={[styles.calcValue, styles.deduction]}>-₨{totalDamageCost.toLocaleString()}</Text>
          </View>

          {deductions.map((deduction, index) => (
            <View key={index} style={styles.calcRow}>
              <Text style={styles.calcLabel}>{deduction.description || 'Deduction'}</Text>
              <Text style={[styles.calcValue, styles.deduction]}>-₨{deduction.amount.toLocaleString()}</Text>
            </View>
          ))}

          <View style={[styles.divider, styles.dividerBold]} />

          <View style={styles.calcRow}>
            <Text style={styles.calcTotalLabel}>Deposit Return Amount</Text>
            <Text style={styles.calcTotalValue}>₨{finalDepositReturn.toLocaleString()} SCR</Text>
          </View>
        </Card>

        <Card style={styles.deductionsCard}>
          <Text style={styles.sectionTitle}>Additional Deductions</Text>
          <Text style={styles.sectionSubtitle}>
            Add any additional deductions beyond repair costs (e.g., unpaid utilities, cleaning fees)
          </Text>

          {deductions.map((deduction, index) => (
            <View key={index} style={styles.deductionRow}>
              <View style={styles.deductionInputs}>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Description"
                  placeholderTextColor="#999"
                  value={deduction.description}
                  onChangeText={(text: string) => updateDeduction(index, 'description', text)}
                />
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₨</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor="#999"
                    value={deduction.amount ? String(deduction.amount) : ''}
                    onChangeText={(text: string) => updateDeduction(index, 'amount', text)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeDeduction(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addDeduction}>
            <Text style={styles.addButtonText}>+ Add Deduction</Text>
          </TouchableOpacity>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Return Date</Text>
            <Input
              value={returnDate}
              onChangeText={setReturnDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.methodButtons}>
              {[
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cash', label: 'Cash' },
                { value: 'cheque', label: 'Cheque' },
              ].map(method => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.methodButton,
                    paymentMethod === method.value && styles.methodButtonActive,
                  ]}
                  onPress={() => setPaymentMethod(method.value as any)}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      paymentMethod === method.value && styles.methodButtonTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reference Number (Optional)</Text>
            <Input
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="Transaction reference or cheque number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any additional information about the deposit return..."
              placeholderTextColor="#999"
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
              numberOfLines={4}
            />
          </View>
        </Card>

        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Important</Text>
          <Text style={styles.warningText}>
            This action will finalize the deposit return and terminate the lease. Make sure all calculations are correct before proceeding.
          </Text>
        </Card>

        <Button
          title={`Complete Deposit Return (₨${finalDepositReturn.toLocaleString()})`}
          onPress={handleComplete}
          loading={isSaving}
          icon={<CheckCircle size={20} color="#FFFFFF" />}
          fullWidth
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center' as const,
    marginTop: 40,
  },
  headerCard: {
    marginBottom: 16,
  },
  iconHeader: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F8F0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
  },
  infoRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  calculationCard: {
    marginBottom: 16,
    backgroundColor: '#FFF9E6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  calcRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  calcLabel: {
    fontSize: 14,
    color: '#666',
  },
  calcValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  deduction: {
    color: '#FF3B30',
  },
  calcTotalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  calcTotalValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#34C759',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  dividerBold: {
    height: 2,
    backgroundColor: '#FFD700',
  },
  deductionsCard: {
    marginBottom: 16,
  },
  deductionRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  deductionInputs: {
    flex: 1,
    gap: 8,
  },
  descriptionInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  amountInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: '600' as const,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  methodButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center' as const,
  },
  methodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  methodButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  methodButtonTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 100,
    textAlignVertical: 'top' as const,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  warningCard: {
    marginBottom: 24,
    backgroundColor: '#FFF5E5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FF9500',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
