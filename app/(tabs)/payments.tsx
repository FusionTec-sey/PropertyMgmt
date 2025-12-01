import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Plus, DollarSign, Calendar, AlertCircle, Paperclip, FileText, Eye, Send, RefreshCw, Receipt, TrendingDown } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Payment, PaymentCurrency, Invoice, Expense, ExpenseCategory, ExpensePaidBy, ExpenseStatus } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencySymbol } from '@/constants/currencies';
import { generateInvoiceNumber, generateInvoiceData, generateMonthlyInvoiceDate, shouldGenerateInvoice, shareInvoicePDF } from '@/utils/invoiceGenerator';
import { generateReceiptNumber, generateReceiptData, shareReceiptPDF } from '@/utils/receiptGenerator';
import type { Receipt as ReceiptType } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';

export default function PaymentsScreen() {
  const { 
    payments, 
    leases, 
    tenantRenters, 
    properties,
    units,
    currentTenant,
    invoices,
    addPayment, 
    updatePayment,
    addInvoice,
    updateInvoice
  } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices' | 'expenses'>('payments');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
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
            Alert.alert('Success', 'Payment marked as paid. Generate receipt from payment details.');
          }
        },
      ]
    );
  };

  const handleGenerateReceipt = async (payment: Payment) => {
    const lease = leases.find(l => l.id === payment.lease_id);
    const tenantRenter = tenantRenters.find(tr => tr.id === payment.tenant_renter_id);
    const property = properties.find(p => p.id === lease?.property_id);
    const unit = units.find(u => u.id === lease?.unit_id);

    if (!lease || !tenantRenter || !property || !unit || !currentTenant) {
      Alert.alert('Error', 'Unable to generate receipt. Missing required information.');
      return;
    }

    try {
      console.log('[Payments] Generating receipt for payment', payment.id);
      
      const receiptNumber = generateReceiptNumber(payments.filter(p => p.receipt_number).length);
      const receiptData = generateReceiptData(payment, lease, receiptNumber, currentTenant.id, false);
      
      const receipt: ReceiptType = {
        ...receiptData,
        id: `receipt-${Date.now()}`,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const landlordInfo = {
        name: currentTenant.name,
        address: property.address,
        email: currentTenant.email,
        phone: currentTenant.phone,
      };

      await shareReceiptPDF(receipt, payment, tenantRenter, lease, property, unit, landlordInfo);
      
      await updatePayment(payment.id, {
        receipt_number: receiptNumber,
        receipt_generated_at: new Date().toISOString(),
      });
      
      Alert.alert('Success', `Receipt ${receiptNumber} generated and shared successfully!`);
    } catch (error) {
      console.error('[Payments] Error generating receipt:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    }
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
      
      Alert.alert(
        'Success', 
        `${file.name} attached successfully. A receipt will be automatically generated upon saving.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleAutoGenerateInvoices = useCallback(async () => {
    setIsGenerating(true);
    console.log('[Payments] Starting auto-generation for active leases');
    
    try {
      const activeLeases = leases.filter(l => l.status === 'active');
      console.log(`[Payments] Found ${activeLeases.length} active leases`);
      
      let generatedCount = 0;
      
      for (const lease of activeLeases) {
        if (shouldGenerateInvoice(lease, invoices)) {
          const tenantRenter = tenantRenters.find(tr => tr.id === lease.tenant_renter_id);
          const property = properties.find(p => p.id === lease.property_id);
          const unit = units.find(u => u.id === lease.unit_id);
          
          if (tenantRenter && property && unit) {
            const { invoiceDate, dueDate } = generateMonthlyInvoiceDate(lease);
            const invoiceNumber = generateInvoiceNumber(invoices.length + generatedCount);
            
            const invoiceData = generateInvoiceData({
              lease,
              tenantRenter,
              property,
              unit,
              invoiceDate,
              dueDate,
              currency: DEFAULT_CURRENCY,
              invoiceNumber,
              autoGenerated: true,
              recurringPeriod: 'monthly',
              notes: `Monthly rent invoice for ${property.name}, Unit ${unit.unit_number}`,
            });
            
            await addInvoice(invoiceData);
            generatedCount++;
            console.log(`[Payments] Generated invoice ${invoiceNumber} for ${tenantRenter.email}`);
          }
        }
      }
      
      if (generatedCount > 0) {
        Alert.alert('Success', `Generated ${generatedCount} invoice${generatedCount > 1 ? 's' : ''} successfully!`);
      } else {
        Alert.alert('Info', 'No new invoices to generate. All active leases have invoices for this period.');
      }
    } catch (error) {
      console.error('[Payments] Error during auto-generation:', error);
      Alert.alert('Error', 'Failed to generate invoices. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [leases, tenantRenters, properties, units, invoices, addInvoice]);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceModalVisible(true);
  };

  const handleShareInvoice = async (invoice: Invoice) => {
    const tenantRenter = tenantRenters.find(tr => tr.id === invoice.tenant_renter_id);
    const property = properties.find(p => p.id === invoice.property_id);
    const unit = units.find(u => u.id === invoice.unit_id);
    
    if (!tenantRenter || !property || !unit) {
      Alert.alert('Error', 'Unable to find invoice details');
      return;
    }

    const landlordInfo = {
      name: currentTenant?.name || 'Landlord',
      address: property.address,
      email: currentTenant?.email || '',
      phone: currentTenant?.phone || '',
    };

    try {
      console.log('[Payments] Starting PDF generation and share for invoice', invoice.invoice_number);
      await shareInvoicePDF(invoice, tenantRenter, property, unit, landlordInfo);
      
      await updateInvoice(invoice.id, { 
        sent_at: new Date().toISOString(),
        status: 'sent'
      });
      
      Alert.alert('Success', `Invoice ${invoice.invoice_number} PDF shared successfully!`);
    } catch (error) {
      console.error('[Payments] Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share invoice PDF. Please try again.');
    }
  };

  const handleMarkInvoiceAsPaid = async (invoice: Invoice) => {
    Alert.alert(
      'Mark as Paid',
      `Confirm that invoice ${invoice.invoice_number} has been paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: 'default',
          onPress: async () => {
            await updateInvoice(invoice.id, { 
              status: 'paid',
              paid_at: new Date().toISOString(),
              amount_paid: invoice.total_amount,
              balance_due: 0,
            });
            Alert.alert('Success', 'Invoice marked as paid');
            setInvoiceModalVisible(false);
          }
        },
      ]
    );
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

    const newPayment = await addPayment(paymentData);
    
    if (formData.payment_proof && newPayment && formData.status === 'paid') {
      console.log('[Payments] Proof of payment uploaded - Auto-generating receipt');
      
      setTimeout(async () => {
        try {
          await handleGenerateReceipt(newPayment);
        } catch (error) {
          console.error('[Payments] Error auto-generating receipt:', error);
        }
      }, 500);
    }
    
    Alert.alert('Success', formData.payment_proof && formData.status === 'paid' 
      ? 'Payment recorded successfully. Receipt will be generated automatically.'
      : 'Payment recorded successfully');
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
              {currencySymbol}{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency}
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
              Late Fee: {currencySymbol}{item.late_fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        <View style={styles.paymentActions}>
          {item.status !== 'paid' && item.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMarkPaid(item)}
              testID={`mark-paid-${item.id}`}
            >
              <DollarSign size={16} color="#34C759" />
              <Text style={[styles.actionText, { color: '#34C759' }]}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          {item.status === 'paid' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleGenerateReceipt(item)}
              testID={`generate-receipt-${item.id}`}
            >
              <Receipt size={16} color="#34C759" />
              <Text style={[styles.actionText, { color: '#34C759' }]}>
                {item.receipt_number ? 'Re-generate Receipt' : 'Generate Receipt'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const tenantRenter = tenantRenters.find(tr => tr.id === item.tenant_renter_id);
    const property = properties.find(p => p.id === item.property_id);
    const unit = units.find(u => u.id === item.unit_id);
    const currencySymbol = getCurrencySymbol(item.currency);
    
    const tenantName = tenantRenter 
      ? (tenantRenter.type === 'business' ? tenantRenter.business_name : `${tenantRenter.first_name} ${tenantRenter.last_name}`)
      : 'Unknown';

    const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
      switch (status) {
        case 'paid': return 'success';
        case 'sent': return 'info';
        case 'overdue': return 'danger';
        case 'draft': return 'default';
        case 'cancelled': return 'default';
        default: return 'default';
      }
    };

    return (
      <Card style={[styles.paymentCard, item.status === 'overdue' && styles.overdueCard]}>
        <TouchableOpacity onPress={() => handleViewInvoice(item)}>
          <View style={styles.paymentHeader}>
            <View style={styles.paymentInfo}>
              <View style={styles.invoiceNumberRow}>
                <FileText size={18} color="#007AFF" />
                <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
                {item.auto_generated && (
                  <View style={styles.autoTag}>
                    <RefreshCw size={10} color="#666" />
                    <Text style={styles.autoTagText}>Auto</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tenantRenterName}>{tenantName}</Text>
              <Text style={styles.propertyInfo}>
                {property?.name} - Unit {unit?.unit_number}
              </Text>
            </View>
            <View style={styles.invoiceAmountContainer}>
              <Text style={styles.amount}>
                {currencySymbol}{item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.currency}>{item.currency}</Text>
              <Badge label={item.status} variant={getStatusVariant(item.status)} />
            </View>
          </View>

          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Calendar size={14} color="#666" />
              <Text style={styles.dateLabel}>Issued:</Text>
              <Text style={styles.dateText}>{formatDate(item.invoice_date)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Calendar size={14} color={item.status === 'overdue' ? '#FF3B30' : '#666'} />
              <Text style={styles.dateLabel}>Due:</Text>
              <Text style={[styles.dateText, item.status === 'overdue' && { color: '#FF3B30', fontWeight: '700' }]}>
                {formatDate(item.due_date)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.paymentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewInvoice(item)}
            testID={`view-invoice-${item.id}`}
          >
            <Eye size={16} color="#007AFF" />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShareInvoice(item)}
            testID={`share-invoice-${item.id}`}
          >
            <Send size={16} color="#34C759" />
            <Text style={[styles.actionText, { color: '#34C759' }]}>Share</Text>
          </TouchableOpacity>
          {item.status !== 'paid' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMarkInvoiceAsPaid(item)}
              testID={`mark-paid-invoice-${item.id}`}
            >
              <DollarSign size={16} color="#FF9500" />
              <Text style={[styles.actionText, { color: '#FF9500' }]}>Mark Paid</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
          testID="tab-payments"
        >
          <DollarSign size={20} color={activeTab === 'payments' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invoices' && styles.tabActive]}
          onPress={() => setActiveTab('invoices')}
          testID="tab-invoices"
        >
          <Receipt size={20} color={activeTab === 'invoices' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'invoices' && styles.tabTextActive]}>Invoices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
          onPress={() => setActiveTab('expenses')}
          testID="tab-expenses"
        >
          <TrendingDown size={20} color={activeTab === 'expenses' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>Expenses</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'payments' && (
        <>
          <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₨{paidThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.statLabel}>This Month (SCR)</Text>
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
        </>
      )}

      {activeTab === 'invoices' && (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Invoices ({invoices.length})</Text>
              <Text style={styles.headerSubtitle}>
                {invoices.filter(i => i.status === 'paid').length} paid • {invoices.filter(i => i.status === 'overdue').length} overdue
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.autoGenButton, isGenerating && styles.autoGenButtonDisabled]}
                onPress={handleAutoGenerateInvoices}
                disabled={isGenerating}
                testID="auto-generate-invoices-button"
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.autoGenText}>{isGenerating ? 'Generating...' : 'Auto-Generate'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Invoices"
              message="Auto-generate monthly invoices for your active leases"
              actionLabel="Auto-Generate Invoices"
              onAction={handleAutoGenerateInvoices}
              testID="invoices-empty"
            />
          ) : (
            <FlatList
              data={invoices.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())}
              renderItem={renderInvoice}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          visible={invoiceModalVisible}
          onClose={() => {
            setInvoiceModalVisible(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          tenantRenters={tenantRenters}
          properties={properties}
          units={units}
          onShare={handleShareInvoice}
          onMarkAsPaid={handleMarkInvoiceAsPaid}
          currentTenant={currentTenant}
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

interface InvoiceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: Invoice;
  tenantRenters: any[];
  properties: any[];
  units: any[];
  onShare: (invoice: Invoice) => void;
  onMarkAsPaid: (invoice: Invoice) => void;
  currentTenant: any;
}

function InvoiceDetailModal({
  visible,
  onClose,
  invoice,
  tenantRenters,
  properties,
  units,
  onShare,
  onMarkAsPaid,
  currentTenant,
}: InvoiceDetailModalProps) {
  const tenantRenter = tenantRenters.find(tr => tr.id === invoice.tenant_renter_id);
  const property = properties.find(p => p.id === invoice.property_id);
  const unit = units.find(u => u.id === invoice.unit_id);
  const currencySymbol = getCurrencySymbol(invoice.currency);

  const tenantName = tenantRenter 
    ? (tenantRenter.type === 'business' ? tenantRenter.business_name : `${tenantRenter.first_name} ${tenantRenter.last_name}`)
    : 'Unknown';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'info';
      case 'overdue': return 'danger';
      case 'draft': return 'default';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Invoice ${invoice.invoice_number}`}
      testID="invoice-detail-modal"
    >
      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderLeft}>
            <Text style={styles.detailInvoiceNumber}>{invoice.invoice_number}</Text>
            <Badge label={invoice.status} variant={getStatusVariant(invoice.status)} />
          </View>
          <View style={styles.detailHeaderRight}>
            <Text style={styles.detailAmount}>
              {currencySymbol}{invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.detailCurrency}>{invoice.currency}</Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Bill To</Text>
          <Text style={styles.detailSectionValue}>{tenantName}</Text>
          <Text style={styles.detailSectionSub}>{tenantRenter?.email}</Text>
          <Text style={styles.detailSectionSub}>{tenantRenter?.phone}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Property Details</Text>
          <Text style={styles.detailSectionValue}>{property?.name}</Text>
          <Text style={styles.detailSectionSub}>Unit {unit?.unit_number}</Text>
          <Text style={styles.detailSectionSub}>{property?.address}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Dates</Text>
          <View style={styles.detailDatesRow}>
            <View style={styles.detailDateItem}>
              <Text style={styles.detailDateLabel}>Invoice Date</Text>
              <Text style={styles.detailDateValue}>{formatDate(invoice.invoice_date)}</Text>
            </View>
            <View style={styles.detailDateItem}>
              <Text style={styles.detailDateLabel}>Due Date</Text>
              <Text style={[styles.detailDateValue, invoice.status === 'overdue' && { color: '#FF3B30' }]}>
                {formatDate(invoice.due_date)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Line Items</Text>
          {invoice.line_items.map((item) => (
            <View key={item.id} style={styles.lineItemRow}>
              <View style={styles.lineItemLeft}>
                <Text style={styles.lineItemDescription}>{item.description}</Text>
                <Text style={styles.lineItemDetails}>
                  {item.quantity} × {currencySymbol}{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <Text style={styles.lineItemAmount}>
                {currencySymbol}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.detailTotals}>
          <View style={styles.detailTotalRow}>
            <Text style={styles.detailTotalLabel}>Subtotal:</Text>
            <Text style={styles.detailTotalValue}>
              {currencySymbol}{invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          {invoice.tax_amount && invoice.tax_amount > 0 && (
            <View style={styles.detailTotalRow}>
              <Text style={styles.detailTotalLabel}>Tax:</Text>
              <Text style={styles.detailTotalValue}>
                {currencySymbol}{invoice.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          )}
          {invoice.late_fee_amount && invoice.late_fee_amount > 0 && (
            <View style={styles.detailTotalRow}>
              <Text style={[styles.detailTotalLabel, { color: '#FF9500' }]}>Late Fee:</Text>
              <Text style={[styles.detailTotalValue, { color: '#FF9500' }]}>
                {currencySymbol}{invoice.late_fee_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          )}
          <View style={[styles.detailTotalRow, styles.detailTotalRowFinal]}>
            <Text style={styles.detailTotalLabelFinal}>Total Amount:</Text>
            <Text style={styles.detailTotalValueFinal}>
              {currencySymbol}{invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}
            </Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Notes</Text>
            <Text style={styles.detailNotes}>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.detailActions}>
          <Button
            title="Share Invoice"
            onPress={() => {
              onClose();
              onShare(invoice);
            }}
            icon={<Send size={18} color="#FFFFFF" />}
            fullWidth
            testID="detail-share-button"
          />
          {invoice.status !== 'paid' && (
            <Button
              title="Mark as Paid"
              onPress={() => onMarkAsPaid(invoice)}
              icon={<DollarSign size={18} color="#FFFFFF" />}
              fullWidth
              variant="secondary"
              testID="detail-mark-paid-button"
            />
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </Modal>
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
  tabSelector: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent' as const,
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  autoGenButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  autoGenButtonDisabled: {
    backgroundColor: '#999',
  },
  autoGenText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  invoiceNumberRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap' as const,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#007AFF',
    flexShrink: 0,
  },
  autoTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  autoTagText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#666',
  },
  propertyInfo: {
    fontSize: 14,
    color: '#666',
  },
  invoiceAmountContainer: {
    alignItems: 'flex-end' as const,
    gap: 4,
  },
  currency: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailScroll: {
    maxHeight: 600,
  },
  detailHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  detailHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  detailInvoiceNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  detailHeaderRight: {
    alignItems: 'flex-end' as const,
  },
  detailAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#007AFF',
  },
  detailCurrency: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  detailSectionValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  detailSectionSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailDatesRow: {
    flexDirection: 'row' as const,
    gap: 20,
  },
  detailDateItem: {
    flex: 1,
  },
  detailDateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailDateValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  lineItemRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  lineItemLeft: {
    flex: 1,
  },
  lineItemDescription: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  lineItemDetails: {
    fontSize: 13,
    color: '#666',
  },
  lineItemAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  detailTotals: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    marginBottom: 20,
  },
  detailTotalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
  },
  detailTotalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  detailTotalLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailTotalValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  detailTotalLabelFinal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  detailTotalValueFinal: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#007AFF',
  },
  detailNotes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  detailActions: {
    gap: 12,
    marginTop: 12,
  },
});
