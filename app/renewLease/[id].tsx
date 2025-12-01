import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { Building, User, Calendar, FileText } from 'lucide-react-native';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function RenewLeaseScreen() {
  const { id, leasePeriod } = useLocalSearchParams();
  const router = useRouter();
  const { leases, updateLease, addLease, properties, units, tenantRenters } = useApp();
  
  const oldLease = leases.find((l) => l.id === id);
  const property = properties.find((p) => p.id === oldLease?.property_id);
  const unit = units.find((u) => u.id === oldLease?.unit_id);
  const tenant = tenantRenters.find((t) => t.id === oldLease?.tenant_renter_id);

  const [renewalData, setRenewalData] = useState({
    start_date: '',
    end_date: '',
    rent_amount: oldLease?.rent_amount.toString() || '',
    deposit_amount: oldLease?.deposit_amount.toString() || '',
    payment_due_day: oldLease?.payment_due_day.toString() || '1',
    terms: oldLease?.terms || '',
    lease_period_months: parseInt(leasePeriod as string) || 12,
  });

  useEffect(() => {
    if (oldLease) {
      const oldEndDate = new Date(oldLease.end_date);
      const newStartDate = new Date(oldEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + renewalData.lease_period_months);
      
      setRenewalData((prev) => ({
        ...prev,
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
      }));
    }
  }, [oldLease, renewalData.lease_period_months]);

  if (!oldLease) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Lease Not Found' }} />
        <Text style={styles.errorText}>Lease not found</Text>
      </View>
    );
  }

  const getTenantName = (t: typeof tenant) => {
    if (!t) return 'Unknown';
    if (t.type === 'business') {
      return t.business_name || 'Unnamed Business';
    }
    return `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Unnamed';
  };

  const handleRenew = async () => {
    if (!renewalData.start_date || !renewalData.end_date || !renewalData.rent_amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const rentAmount = parseFloat(renewalData.rent_amount);
    const depositAmount = renewalData.deposit_amount ? parseFloat(renewalData.deposit_amount) : 0;
    const paymentDueDay = parseInt(renewalData.payment_due_day, 10);

    if (isNaN(rentAmount) || rentAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid rent amount');
      return;
    }

    if (paymentDueDay < 1 || paymentDueDay > 31) {
      Alert.alert('Error', 'Payment due day must be between 1 and 31');
      return;
    }

    try {
      await updateLease(oldLease.id, {
        status: 'renewed',
      });

      const newLease = await addLease({
        property_id: oldLease.property_id,
        unit_id: oldLease.unit_id,
        tenant_renter_id: oldLease.tenant_renter_id,
        start_date: renewalData.start_date,
        end_date: renewalData.end_date,
        rent_amount: rentAmount,
        deposit_amount: depositAmount,
        payment_due_day: paymentDueDay,
        status: 'active',
        terms: renewalData.terms || undefined,
      });

      Alert.alert(
        'Success',
        'Lease renewed successfully! The old lease has been marked as renewed and a new active lease has been created.',
        [
          {
            text: 'View New Lease',
            onPress: () => {
              router.replace(`/lease/${newLease?.id}`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error renewing lease:', error);
      Alert.alert('Error', 'Failed to renew lease');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Renew Lease' }} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Current Lease Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Building size={18} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Property</Text>
                <Text style={styles.infoValue}>{property?.name || 'Unknown'}</Text>
                <Text style={styles.infoSubValue}>Unit {unit?.unit_number || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <User size={18} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tenant</Text>
                <Text style={styles.infoValue}>{getTenantName(tenant)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={18} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Current Lease Period</Text>
                <Text style={styles.infoValue}>
                  {new Date(oldLease.start_date).toLocaleDateString()} - {new Date(oldLease.end_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>New Lease Details</Text>
          
          <Text style={styles.inputLabel}>Lease Period *</Text>
          <View style={styles.leasePeriodSelector}>
            {([6, 12, 24] as const).map((months) => (
              <TouchableOpacity
                key={months}
                style={[
                  styles.periodButton,
                  renewalData.lease_period_months === months && styles.periodButtonActive,
                ]}
                onPress={() => {
                  setRenewalData((prev) => {
                    const startDate = new Date(oldLease.end_date);
                    startDate.setDate(startDate.getDate() + 1);
                    
                    const endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + months);
                    
                    return {
                      ...prev,
                      lease_period_months: months,
                      start_date: startDate.toISOString().split('T')[0],
                      end_date: endDate.toISOString().split('T')[0],
                    };
                  });
                }}
                testID={`renewal-period-${months}-button`}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    renewalData.lease_period_months === months && styles.periodButtonTextActive,
                  ]}
                >
                  {months} Months
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Start Date"
            value={renewalData.start_date}
            onChangeText={(text) => {
              setRenewalData({ ...renewalData, start_date: text });
              if (text && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
                const startDate = new Date(text);
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + renewalData.lease_period_months);
                const endDateStr = endDate.toISOString().split('T')[0];
                setRenewalData((prev) => ({ ...prev, start_date: text, end_date: endDateStr }));
              }
            }}
            placeholder="YYYY-MM-DD"
            required
            testID="renewal-start-date-input"
          />

          <Input
            label="End Date"
            value={renewalData.end_date}
            onChangeText={(text) => setRenewalData({ ...renewalData, end_date: text })}
            placeholder="YYYY-MM-DD (Auto-calculated)"
            required
            testID="renewal-end-date-input"
          />

          <Text style={styles.sectionTitle}>Financial Details</Text>
          <View style={styles.row}>
            <Input
              label="Rent Amount (SCR)"
              value={renewalData.rent_amount}
              onChangeText={(text) => setRenewalData({ ...renewalData, rent_amount: text })}
              placeholder="1000"
              keyboardType="numeric"
              required
              containerStyle={styles.halfInput}
              testID="renewal-rent-input"
            />
            <Input
              label="Deposit Amount (SCR)"
              value={renewalData.deposit_amount}
              onChangeText={(text) => setRenewalData({ ...renewalData, deposit_amount: text })}
              placeholder="1000"
              keyboardType="numeric"
              containerStyle={styles.halfInput}
              testID="renewal-deposit-input"
            />
          </View>

          <Input
            label="Payment Due Day"
            value={renewalData.payment_due_day}
            onChangeText={(text) => setRenewalData({ ...renewalData, payment_due_day: text })}
            placeholder="1"
            keyboardType="numeric"
            testID="renewal-due-day-input"
          />

          <Input
            label="Lease Terms"
            value={renewalData.terms}
            onChangeText={(text) => setRenewalData({ ...renewalData, terms: text })}
            placeholder="Enter lease terms and conditions..."
            multiline
            numberOfLines={4}
            testID="renewal-terms-input"
          />
        </View>

        <View style={styles.warningSection}>
          <FileText size={20} color="#FF9500" />
          <Text style={styles.warningText}>
            The current lease will be marked as &quot;renewed&quot; and a new active lease will be created starting from the day after the current lease ends.
          </Text>
        </View>

        <View style={styles.actionsSection}>
          <Button
            title="Create Renewed Lease"
            onPress={handleRenew}
            icon={<FileText size={20} color="#FFFFFF" />}
            fullWidth
          />
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            fullWidth
          />
        </View>

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
  infoSection: {
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row' as const,
    gap: 12,
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
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: 14,
    color: '#666',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 6,
  },
  leasePeriodSelector: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center' as const,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  warningSection: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#8B6914',
    lineHeight: 20,
  },
  actionsSection: {
    gap: 12,
  },
});
