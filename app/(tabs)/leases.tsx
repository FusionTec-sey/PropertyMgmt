import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Plus, FileText, Calendar, Edit, DollarSign } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Lease } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';

export default function LeasesScreen() {
  const { leases, properties, units, renters, addLease, updateLease } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    renter_id: '',
    start_date: '',
    end_date: '',
    rent_amount: '',
    deposit_amount: '',
    payment_due_day: '',
    status: 'draft' as 'draft' | 'active' | 'expired' | 'terminated' | 'renewed',
    terms: '',
    signed_date: '',
  });

  const filteredLeases = useMemo(() => {
    if (filterStatus === 'all') return leases;
    return leases.filter(l => l.status === filterStatus);
  }, [leases, filterStatus]);

  const availableUnits = useMemo(() => {
    return units.filter(u => u.status === 'available' || (editingLease && u.id === editingLease.unit_id));
  }, [units, editingLease]);

  const unitsForProperty = useMemo(() => {
    if (!formData.property_id) return [];
    return availableUnits.filter(u => u.property_id === formData.property_id);
  }, [formData.property_id, availableUnits]);

  const resetForm = () => {
    setFormData({
      property_id: '',
      unit_id: '',
      renter_id: '',
      start_date: '',
      end_date: '',
      rent_amount: '',
      deposit_amount: '',
      payment_due_day: '1',
      status: 'draft',
      terms: '',
      signed_date: '',
    });
    setEditingLease(null);
  };

  const handleAdd = () => {
    if (properties.length === 0 || renters.length === 0 || availableUnits.length === 0) {
      let message = 'Please add ';
      const missing = [];
      if (properties.length === 0) missing.push('properties');
      if (availableUnits.length === 0) missing.push('available units');
      if (renters.length === 0) missing.push('renters');
      message += missing.join(', ') + ' first before creating a lease';
      Alert.alert('Missing Requirements', message);
      return;
    }
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (lease: Lease) => {
    setEditingLease(lease);
    setFormData({
      property_id: lease.property_id,
      unit_id: lease.unit_id,
      renter_id: lease.renter_id,
      start_date: lease.start_date,
      end_date: lease.end_date,
      rent_amount: lease.rent_amount.toString(),
      deposit_amount: lease.deposit_amount.toString(),
      payment_due_day: lease.payment_due_day.toString(),
      status: lease.status,
      terms: lease.terms || '',
      signed_date: lease.signed_date || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.property_id || !formData.unit_id || !formData.renter_id || 
        !formData.start_date || !formData.end_date || !formData.rent_amount || !formData.deposit_amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const leaseData = {
      property_id: formData.property_id,
      unit_id: formData.unit_id,
      renter_id: formData.renter_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      rent_amount: parseFloat(formData.rent_amount),
      deposit_amount: parseFloat(formData.deposit_amount),
      payment_due_day: parseInt(formData.payment_due_day) || 1,
      status: formData.status,
      terms: formData.terms || undefined,
      signed_date: formData.signed_date || undefined,
    };

    if (editingLease) {
      await updateLease(editingLease.id, leaseData);
    } else {
      await addLease(leaseData);
    }

    setModalVisible(false);
    resetForm();
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'expired':
      case 'terminated':
        return 'danger';
      case 'renewed':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderLease = ({ item }: { item: Lease }) => {
    const property = properties.find(p => p.id === item.property_id);
    const unit = units.find(u => u.id === item.unit_id);
    const renter = renters.find(r => r.id === item.renter_id);

    return (
      <Card style={styles.leaseCard}>
        <View style={styles.leaseHeader}>
          <View style={styles.leaseInfo}>
            <Text style={styles.propertyName}>{property?.name || 'Unknown'}</Text>
            <Text style={styles.unitNumber}>Unit {unit?.unit_number || 'N/A'}</Text>
          </View>
          <Badge label={item.status} variant={getStatusVariant(item.status)} />
        </View>

        <View style={styles.renterSection}>
          <Text style={styles.renterLabel}>Renter:</Text>
          <Text style={styles.renterName}>
            {renter ? `${renter.first_name} ${renter.last_name}` : 'Unknown'}
          </Text>
        </View>

        <View style={styles.leaseDates}>
          <View style={styles.dateItem}>
            <Calendar size={14} color="#666" />
            <Text style={styles.dateText}>{formatDate(item.start_date)}</Text>
          </View>
          <Text style={styles.dateSeparator}>→</Text>
          <View style={styles.dateItem}>
            <Calendar size={14} color="#666" />
            <Text style={styles.dateText}>{formatDate(item.end_date)}</Text>
          </View>
        </View>

        <View style={styles.rentInfo}>
          <DollarSign size={16} color="#34C759" />
          <Text style={styles.rentAmount}>${item.rent_amount.toLocaleString()}/month</Text>
          <Text style={styles.paymentDay}>Due on day {item.payment_due_day}</Text>
        </View>

        <View style={styles.leaseActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            testID={`edit-lease-${item.id}`}
          >
            <Edit size={16} color="#007AFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Leases ({filteredLeases.length})</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {['all', 'draft', 'active', 'expired', 'terminated', 'renewed'].map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-lease-button"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {filteredLeases.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Leases"
          message={leases.length === 0 ? "Start by creating your first lease agreement" : `No ${filterStatus} leases found`}
          actionLabel={leases.length === 0 && properties.length > 0 && renters.length > 0 ? "Create Lease" : undefined}
          onAction={properties.length > 0 && renters.length > 0 ? handleAdd : undefined}
          testID="leases-empty"
        />
      ) : (
        <FlatList
          data={filteredLeases}
          renderItem={renderLease}
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
        title={editingLease ? 'Edit Lease' : 'Create Lease'}
        testID="lease-modal"
      >
        <Text style={styles.sectionTitle}>Property & Unit</Text>
        <View style={styles.formSection}>
          <Text style={styles.label}>Property</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            {properties.map(property => (
              <TouchableOpacity
                key={property.id}
                style={[
                  styles.selectorItem,
                  formData.property_id === property.id && styles.selectorItemActive
                ]}
                onPress={() => setFormData({ ...formData, property_id: property.id, unit_id: '' })}
              >
                <Text style={[
                  styles.selectorText,
                  formData.property_id === property.id && styles.selectorTextActive
                ]}>
                  {property.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {formData.property_id && (
          <View style={styles.formSection}>
            <Text style={styles.label}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
              {unitsForProperty.map(unit => (
                <TouchableOpacity
                  key={unit.id}
                  style={[
                    styles.selectorItem,
                    formData.unit_id === unit.id && styles.selectorItemActive
                  ]}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      unit_id: unit.id,
                      rent_amount: unit.rent_amount.toString(),
                      deposit_amount: unit.deposit_amount?.toString() || unit.rent_amount.toString(),
                    });
                  }}
                >
                  <Text style={[
                    styles.selectorText,
                    formData.unit_id === unit.id && styles.selectorTextActive
                  ]}>
                    Unit {unit.unit_number}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>Renter</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          {renters.map(renter => (
            <TouchableOpacity
              key={renter.id}
              style={[
                styles.selectorItem,
                formData.renter_id === renter.id && styles.selectorItemActive
              ]}
              onPress={() => setFormData({ ...formData, renter_id: renter.id })}
            >
              <Text style={[
                styles.selectorText,
                formData.renter_id === renter.id && styles.selectorTextActive
              ]}>
                {renter.first_name} {renter.last_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Lease Terms</Text>
        <View style={styles.row}>
          <Input
            label="Start Date"
            value={formData.start_date}
            onChangeText={text => setFormData({ ...formData, start_date: text })}
            placeholder="YYYY-MM-DD"
            required
            containerStyle={styles.halfInput}
            testID="lease-start-date-input"
          />
          <Input
            label="End Date"
            value={formData.end_date}
            onChangeText={text => setFormData({ ...formData, end_date: text })}
            placeholder="YYYY-MM-DD"
            required
            containerStyle={styles.halfInput}
            testID="lease-end-date-input"
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Rent Amount"
            value={formData.rent_amount}
            onChangeText={text => setFormData({ ...formData, rent_amount: text })}
            placeholder="1200"
            keyboardType="decimal-pad"
            required
            containerStyle={styles.halfInput}
            testID="lease-rent-input"
          />
          <Input
            label="Deposit Amount"
            value={formData.deposit_amount}
            onChangeText={text => setFormData({ ...formData, deposit_amount: text })}
            placeholder="1200"
            keyboardType="decimal-pad"
            required
            containerStyle={styles.halfInput}
            testID="lease-deposit-input"
          />
        </View>

        <Input
          label="Payment Due Day"
          value={formData.payment_due_day}
          onChangeText={text => setFormData({ ...formData, payment_due_day: text })}
          placeholder="1"
          keyboardType="number-pad"
          testID="lease-due-day-input"
        />

        <View style={styles.formSection}>
          <Text style={styles.label}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            {['draft', 'active', 'expired', 'terminated', 'renewed'].map(status => (
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

        <Input
          label="Signed Date"
          value={formData.signed_date}
          onChangeText={text => setFormData({ ...formData, signed_date: text })}
          placeholder="YYYY-MM-DD"
          testID="lease-signed-date-input"
        />

        <Input
          label="Terms & Conditions"
          value={formData.terms}
          onChangeText={text => setFormData({ ...formData, terms: text })}
          placeholder="Additional terms and conditions"
          multiline
          numberOfLines={3}
          testID="lease-terms-input"
        />

        <Button
          title={editingLease ? 'Update Lease' : 'Create Lease'}
          onPress={handleSave}
          fullWidth
          testID="save-lease-button"
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
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  filterScroll: {
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
    textTransform: 'capitalize' as const,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
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
  leaseCard: {
    marginBottom: 16,
  },
  leaseHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  leaseInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  unitNumber: {
    fontSize: 14,
    color: '#666',
  },
  renterSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  renterLabel: {
    fontSize: 14,
    color: '#666',
  },
  renterName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  leaseDates: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  dateItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  dateSeparator: {
    fontSize: 14,
    color: '#999',
  },
  rentInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 12,
  },
  rentAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  paymentDay: {
    fontSize: 12,
    color: '#999',
  },
  leaseActions: {
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
});
