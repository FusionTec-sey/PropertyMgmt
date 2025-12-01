import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Plus, DollarSign, Calendar, AlertCircle, Paperclip, FileText, Eye } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Payment, PaymentCurrency } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencySymbol } from '@/constants/currencies';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';

export default function PaymentsScreen() {
  const { payments, leases, tenantRenters, addPayment, updatePayment } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    lease_id: '',
    tenant_renter_id: '',
    amount: '',
    currency: DEFAULT_CURRENCY as PaymentCurrency,
    payment_date: '',
    due_date: '',
    status: 'pending' as 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled',
    payment_method: 'bank_transfer' as 'cash' | 'cheque' | 'bank_transfer',
    reference_number: '',
    notes: '',
    late_fee: '',
    payment_proof: null as { uri: string; type: 'image' | 'pdf'; name: string; size?: number } | null,
  });

  const overduePayments = useMemo(() => {
    return payments.filter(p => p.status === 'overdue').length;
  }, [payments]);

  const pendingPayments = useMemo(() => {
    return payments.filter(p => p.status === 'pending').length;
  }, [payments]);

  const paidThisMonth = useMemo(() => {
    const now = new Date();
    return payments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return p.status === 'paid' && 
             paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const resetForm = () => {
    setFormData({
      lease_id: '',
      tenant_renter_id: '',
      amount: '',
      currency: DEFAULT_CURRENCY,
      payment_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'pending',
      payment_method: 'bank_transfer',
      reference_number: '',
      notes: '',
      late_fee: '',
      payment_proof: null,
    });
  };

  const handleAdd = () => {
    if (leases.length === 0) {
      Alert.alert('No Leases', 'Please create a lease first before recording payments');
      return;
    }
    resetForm();
    setModalVisible(true);
  };

  const handleMarkPaid = (payment: Payment) => {
    Alert.alert(
      'Mark as Paid',
      'Confirm that this payment has been received?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: 'default',
          onPress: () => {
            updatePayment(payment.id, { 
              status: 'paid',
              payment_date: new Date().toISOString().split('T')[0]
            });
            Alert.alert('Success', 'Payment marked as paid');
          }
        },
      ]
    );
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileType = file.mimeType?.startsWith('image/') ? 'image' : 'pdf';
      
      setFormData({
        ...formData,
        payment_proof: {
          uri: file.uri,
          type: fileType as 'image' | 'pdf',
          name: file.name,
          size: file.size,
        },
      });
      
      Alert.alert('Success', `${file.name} attached successfully`);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSave = async () => {
    if (!formData.lease_id || !formData.tenant_renter_id || !formData.amount || !formData.due_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const paymentData = {
      lease_id: formData.lease_id,
      tenant_renter_id: formData.tenant_renter_id,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      payment_date: formData.payment_date || new Date().toISOString().split('T')[0],
      due_date: formData.due_date,
      status: formData.status,
      payment_method: formData.payment_method,
      reference_number: formData.reference_number || undefined,
      notes: formData.notes || undefined,
      late_fee: formData.late_fee ? parseFloat(formData.late_fee) : undefined,
      payment_proof: formData.payment_proof ? {
        ...formData.payment_proof,
        uploadedAt: new Date().toISOString(),
      } : undefined,
    };

    await addPayment(paymentData);
    Alert.alert('Success', 'Payment recorded successfully');
    setModalVisible(false);
    resetForm();
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'info';
      case 'overdue':
        return 'danger';
      case 'partial':
        return 'warning';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };



  const renderPayment = ({ item }: { item: Payment }) => {
    const tenantRenter = tenantRenters.find((tr: any) => tr.id === item.tenant_renter_id);
    const isOverdue = item.status === 'overdue';
    const totalAmount = item.amount + (item.late_fee || 0);
    const currencySymbol = getCurrencySymbol(item.currency);

    return (
      <Card style={[styles.paymentCard, isOverdue && styles.overdueCard]}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text style={styles.tenantRenterName}>
              {tenantRenter ? (tenantRenter.type === 'business' ? tenantRenter.business_name : `${tenantRenter.first_name} ${tenantRenter.last_name}`) : 'Unknown'}
            </Text>
            <Text style={styles.amount}>
              {currencySymbol}{totalAmount.toLocaleString()} {item.currency}
            </Text>
          </View>
          <Badge label={item.status} variant={getStatusVariant(item.status)} />
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Calendar size={14} color="#666" />
            <Text style={styles.dateLabel}>Due:</Text>
            <Text style={styles.dateText}>{formatDate(item.due_date)}</Text>
          </View>
          {item.status === 'paid' && (
            <View style={styles.dateItem}>
              <Calendar size={14} color="#34C759" />
              <Text style={styles.dateLabel}>Paid:</Text>
              <Text style={styles.dateText}>{formatDate(item.payment_date)}</Text>
            </View>
          )}
        </View>

        {item.late_fee && item.late_fee > 0 && (
          <View style={styles.lateFeeRow}>
            <AlertCircle size={14} color="#FF9500" />
            <Text style={styles.lateFeeText}>
              Late Fee: {currencySymbol}{item.late_fee.toLocaleString()}
            </Text>
          </View>
        )}

        {item.payment_method && (
          <Text style={styles.paymentMethod}>
            Method: {item.payment_method.replace('_', ' ')}
          </Text>
        )}

        {item.reference_number && (
          <Text style={styles.reference}>Ref: {item.reference_number}</Text>
        )}

        {item.payment_proof && (
          <View style={styles.proofContainer}>
            <View style={styles.proofInfo}>
              {item.payment_proof.type === 'image' ? (
                <Image source={{ uri: item.payment_proof.uri }} style={styles.proofThumbnail} />
              ) : (
                <FileText size={40} color="#007AFF" />
              )}
              <View style={styles.proofDetails}>
                <Text style={styles.proofLabel}>Payment Proof</Text>
                <Text style={styles.proofName}>{item.payment_proof.name}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewProofButton}
              onPress={() => Alert.alert('View Proof', `Opening: ${item.payment_proof?.name}`)}
            >
              <Eye size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}

        {item.status !== 'paid' && item.status !== 'cancelled' && (
          <View style={styles.paymentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMarkPaid(item)}
              testID={`mark-paid-${item.id}`}
            >
              <DollarSign size={16} color="#34C759" />
              <Text style={[styles.actionText, { color: '#34C759' }]}>Mark as Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₨{paidThisMonth.toLocaleString()}</Text>
          <Text style={styles.statLabel}>This Month ({DEFAULT_CURRENCY})</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>{pendingPayments}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>{overduePayments}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments ({payments.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-payment-button"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {payments.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No Payments"
          message="Start tracking rent payments from your tenants"
          actionLabel={leases.length > 0 ? "Record Payment" : undefined}
          onAction={leases.length > 0 ? handleAdd : undefined}
          testID="payments-empty"
        />
      ) : (
        <FlatList
          data={payments.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())}
          renderItem={renderPayment}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        title="Record Payment"
        testID="payment-modal"
      >
        <Text style={styles.sectionTitle}>Lease & Tenant</Text>
        <View style={styles.formSection}>
          <Text style={styles.label}>Lease</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            {leases.filter(l => l.status === 'active').map(lease => {
              const tenantRenter = tenantRenters.find((tr: any) => tr.id === lease.tenant_renter_id);
              return (
                <TouchableOpacity
                  key={lease.id}
                  style={[
                    styles.selectorItem,
                    formData.lease_id === lease.id && styles.selectorItemActive
                  ]}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      lease_id: lease.id,
                      tenant_renter_id: lease.tenant_renter_id,
                      amount: lease.rent_amount.toString(),
                    });
                  }}
                >
                  <Text style={[
                    styles.selectorText,
                    formData.lease_id === lease.id && styles.selectorTextActive
                  ]}>
                    {tenantRenter ? (tenantRenter.type === 'business' ? tenantRenter.business_name : `${tenantRenter.first_name} ${tenantRenter.last_name}`) : 'Unknown'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.row}>
          <Input
            label="Amount"
            value={formData.amount}
            onChangeText={text => setFormData({ ...formData, amount: text })}
            placeholder="1200"
            keyboardType="decimal-pad"
            required
            containerStyle={styles.halfInput}
            testID="payment-amount-input"
          />
          <Input
            label="Late Fee"
            value={formData.late_fee}
            onChangeText={text => setFormData({ ...formData, late_fee: text })}
            placeholder="0"
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
            testID="payment-late-fee-input"
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Due Date"
            value={formData.due_date}
            onChangeText={text => setFormData({ ...formData, due_date: text })}
            placeholder="YYYY-MM-DD"
            required
            containerStyle={styles.halfInput}
            testID="payment-due-date-input"
          />
          <Input
            label="Payment Date"
            value={formData.payment_date}
            onChangeText={text => setFormData({ ...formData, payment_date: text })}
            placeholder="YYYY-MM-DD"
            containerStyle={styles.halfInput}
            testID="payment-date-input"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            {['pending', 'paid', 'overdue', 'partial', 'cancelled'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.selectorItem,
                  formData.status === status && styles.selectorItemActive
                ]}
                onPress={() => setFormData({ ...formData, status: status as any })}
              >
                <Text style={[
                  styles.selectorText,
                  formData.status === status && styles.selectorTextActive
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.row}>
          <View style={[styles.formSection, styles.halfInput]}>
            <Text style={styles.label}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
              {(Object.keys(CURRENCIES) as PaymentCurrency[]).map(currencyCode => {
                const curr = CURRENCIES[currencyCode];
                return (
                  <TouchableOpacity
                    key={currencyCode}
                    style={[
                      styles.selectorItem,
                      formData.currency === currencyCode && styles.selectorItemActive
                    ]}
                    onPress={() => setFormData({ ...formData, currency: currencyCode })}
                  >
                    <Text style={[
                      styles.selectorText,
                      formData.currency === currencyCode && styles.selectorTextActive
                    ]}>
                      {curr.flag} {curr.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={[styles.formSection, styles.halfInput]}>
            <Text style={styles.label}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
              {(['cash', 'cheque', 'bank_transfer'] as const).map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.selectorItem,
                    formData.payment_method === method && styles.selectorItemActive
                  ]}
                  onPress={() => setFormData({ ...formData, payment_method: method })}
                >
                  <Text style={[
                    styles.selectorText,
                    formData.payment_method === method && styles.selectorTextActive
                  ]}>
                    {method.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <Input
          label="Reference Number"
          value={formData.reference_number}
          onChangeText={text => setFormData({ ...formData, reference_number: text })}
          placeholder="Check #, Transaction ID, etc."
          testID="payment-reference-input"
        />

        <Input
          label="Notes"
          value={formData.notes}
          onChangeText={text => setFormData({ ...formData, notes: text })}
          placeholder="Additional notes"
          multiline
          numberOfLines={2}
          testID="payment-notes-input"
        />

        <View style={styles.formSection}>
          <Text style={styles.label}>Payment Proof (Photo/PDF)</Text>
          {formData.payment_proof ? (
            <View style={styles.attachmentPreview}>
              {formData.payment_proof.type === 'image' ? (
                <Image source={{ uri: formData.payment_proof.uri }} style={styles.attachmentImage} />
              ) : (
                <View style={styles.pdfPreview}>
                  <FileText size={40} color="#007AFF" />
                  <Text style={styles.pdfName}>{formData.payment_proof.name}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeAttachment}
                onPress={() => setFormData({ ...formData, payment_proof: null })}
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickDocument}
              testID="upload-proof-button"
            >
              <Paperclip size={20} color="#007AFF" />
              <Text style={styles.uploadText}>Attach Payment Proof</Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          title="Record Payment"
          onPress={handleSave}
          fullWidth
          testID="save-payment-button"
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  statsBar: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#34C759',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  list: {
    padding: 16,
  },
  paymentCard: {
    marginBottom: 16,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  paymentHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  tenantRenterName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#34C759',
  },
  datesRow: {
    flexDirection: 'row' as const,
    gap: 16,
    marginBottom: 8,
  },
  dateItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  lateFeeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  lateFeeText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600' as const,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize' as const,
  },
  reference: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  proofContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  proofInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  proofThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  proofDetails: {
    flex: 1,
  },
  proofLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  proofName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  viewProofButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  paymentActions: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  formSection: {
    marginBottom: 16,
  },
  selectorScroll: {
    marginBottom: 8,
  },
  selectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  selectorItemActive: {
    backgroundColor: '#007AFF',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    textTransform: 'capitalize' as const,
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  attachmentPreview: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden' as const,
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  pdfPreview: {
    height: 120,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  pdfName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    paddingHorizontal: 16,
  },
  removeAttachment: {
    padding: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center' as const,
  },
  removeText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed' as const,
    backgroundColor: '#F0F8FF',
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
});
