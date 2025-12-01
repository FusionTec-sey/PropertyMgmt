import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { Building, User, Calendar, FileText, TrendingUp, DollarSign, Info } from 'lucide-react-native';
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
    send_offer_to_tenant: true,
    response_deadline_days: '14',
  });

  const [rentIncrease, setRentIncrease] = useState<{
    amount: number;
    percentage: number;
  }>({ amount: 0, percentage: 0 });

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

  useEffect(() => {
    if (oldLease && renewalData.rent_amount) {
      const oldRent = oldLease.rent_amount;
      const newRent = parseFloat(renewalData.rent_amount);
      const increase = newRent - oldRent;
      const percentage = oldRent > 0 ? (increase / oldRent) * 100 : 0;
      setRentIncrease({ amount: increase, percentage });
    }
  }, [oldLease, renewalData.rent_amount]);

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

  const formatCurrency = (amount: number) => {
    return `₨${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SCR`;
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

    if (rentIncrease.amount > 0 && rentIncrease.percentage > 15) {
      Alert.alert(
        'Large Rent Increase',
        `The rent increase of ${rentIncrease.percentage.toFixed(1)}% is significant. Are you sure you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => proceedWithRenewal() },
        ]
      );
      return;
    }

    await proceedWithRenewal();
  };

  const proceedWithRenewal = async () => {
    const rentAmount = parseFloat(renewalData.rent_amount);
    const depositAmount = renewalData.deposit_amount ? parseFloat(renewalData.deposit_amount) : 0;
    const paymentDueDay = parseInt(renewalData.payment_due_day, 10);

    try {
      if (renewalData.send_offer_to_tenant) {
        const deadlineDays = parseInt(renewalData.response_deadline_days) || 14;
        const responseDeadline = new Date();
        responseDeadline.setDate(responseDeadline.getDate() + deadlineDays);

        await updateLease(oldLease.id, {
          renewal_offer: {
            offered_at: new Date().toISOString(),
            response_deadline: responseDeadline.toISOString(),
            new_start_date: renewalData.start_date,
            new_end_date: renewalData.end_date,
            new_rent_amount: rentAmount,
            new_deposit_amount: depositAmount,
            new_payment_due_day: paymentDueDay,
            new_terms: renewalData.terms,
            rent_increase: rentIncrease.amount,
            rent_increase_percentage: rentIncrease.percentage,
            status: 'pending',
          },
        });

        Alert.alert(
          'Renewal Offer Sent',
          `The tenant has been notified and has ${deadlineDays} days to respond to the renewal offer.`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
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
          renewed_from_lease_id: oldLease.id,
        });

        Alert.alert(
          'Lease Renewed',
          'The old lease has been marked as renewed and a new active lease has been created.',
          [
            {
              text: 'View New Lease',
              onPress: () => {
                router.replace(`/lease/${newLease?.id}`);
              },
            },
          ]
        );
      }
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

        {(rentIncrease.amount !== 0) && (
          <View style={[styles.infoSection, rentIncrease.amount > 0 ? styles.rentIncreaseInfo : styles.rentDecreaseInfo]}>
            <TrendingUp size={20} color={rentIncrease.amount > 0 ? '#FF9500' : '#34C759'} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                Rent {rentIncrease.amount > 0 ? 'Increase' : 'Decrease'}
              </Text>
              <Text style={styles.infoText}>
                {rentIncrease.amount > 0 ? '+' : ''}{formatCurrency(rentIncrease.amount)} ({rentIncrease.percentage > 0 ? '+' : ''}{rentIncrease.percentage.toFixed(2)}%)
              </Text>
            </View>
          </View>
        )}

        <View style={styles.offerSection}>
          <Text style={styles.sectionTitle}>Renewal Offer</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Info size={18} color="#007AFF" />
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Send Offer to Tenant</Text>
                <Text style={styles.switchSubtitle}>
                  Tenant can review and accept/decline the renewal terms
                </Text>
              </View>
            </View>
            <Switch
              value={renewalData.send_offer_to_tenant}
              onValueChange={(value) => setRenewalData({ ...renewalData, send_offer_to_tenant: value })}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {renewalData.send_offer_to_tenant && (
            <Input
              label="Response Deadline (Days)"
              value={renewalData.response_deadline_days}
              onChangeText={(text) => setRenewalData({ ...renewalData, response_deadline_days: text })}
              placeholder="14"
              keyboardType="numeric"
              testID="renewal-deadline-input"
            />
          )}
        </View>

        <View style={styles.warningSection}>
          <FileText size={20} color="#FF9500" />
          <Text style={styles.warningText}>
            {renewalData.send_offer_to_tenant 
              ? 'A renewal offer will be sent to the tenant. The current lease will be marked as "renewed" once the tenant accepts.'
              : 'The current lease will be marked as "renewed" and a new active lease will be created immediately.'}
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
  rentIncreaseInfo: {
    backgroundColor: '#FFF9E6',
    borderLeftColor: '#FF9500',
  },
  rentDecreaseInfo: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#34C759',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  offerSection: {
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  switchLabel: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  actionsSection: {
    gap: 12,
  },
});
