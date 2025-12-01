import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Plus, Users, Mail, Phone, Edit, User } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Renter } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import EmptyState from '@/components/EmptyState';

export default function RentersScreen() {
  const { renters, addRenter, updateRenter, leases } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingRenter, setEditingRenter] = useState<Renter | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    id_number: '',
    id_type: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      id_number: '',
      id_type: '',
      notes: '',
    });
    setEditingRenter(null);
  };

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (renter: Renter) => {
    setEditingRenter(renter);
    setFormData({
      first_name: renter.first_name,
      last_name: renter.last_name,
      email: renter.email,
      phone: renter.phone,
      date_of_birth: renter.date_of_birth || '',
      emergency_contact_name: renter.emergency_contact_name || '',
      emergency_contact_phone: renter.emergency_contact_phone || '',
      id_number: renter.id_number || '',
      id_type: renter.id_type || '',
      notes: renter.notes || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const renterData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth || undefined,
      emergency_contact_name: formData.emergency_contact_name || undefined,
      emergency_contact_phone: formData.emergency_contact_phone || undefined,
      id_number: formData.id_number || undefined,
      id_type: formData.id_type || undefined,
      notes: formData.notes || undefined,
    };

    if (editingRenter) {
      await updateRenter(editingRenter.id, renterData);
    } else {
      await addRenter(renterData);
    }

    setModalVisible(false);
    resetForm();
  };

  const renderRenter = ({ item }: { item: Renter }) => {
    const renterLeases = leases.filter(l => l.renter_id === item.id);
    const activeLeases = renterLeases.filter(l => l.status === 'active');

    return (
      <Card style={styles.renterCard}>
        <View style={styles.renterHeader}>
          <View style={styles.avatarContainer}>
            <User size={24} color="#007AFF" />
          </View>
          <View style={styles.renterInfo}>
            <Text style={styles.renterName}>
              {item.first_name} {item.last_name}
            </Text>
            {activeLeases.length > 0 && (
              <Text style={styles.leaseStatus}>
                {activeLeases.length} Active Lease{activeLeases.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <Mail size={14} color="#666" />
            <Text style={styles.contactText}>{item.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Phone size={14} color="#666" />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.renterActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            testID={`edit-renter-${item.id}`}
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
        <Text style={styles.headerTitle}>Renters ({renters.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-renter-button"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {renters.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Renters"
          message="Start by adding your first renter to the system"
          actionLabel="Add Renter"
          onAction={handleAdd}
          testID="renters-empty"
        />
      ) : (
        <FlatList
          data={renters}
          renderItem={renderRenter}
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
        title={editingRenter ? 'Edit Renter' : 'Add Renter'}
        testID="renter-modal"
      >
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.row}>
          <Input
            label="First Name"
            value={formData.first_name}
            onChangeText={text => setFormData({ ...formData, first_name: text })}
            placeholder="John"
            required
            containerStyle={styles.halfInput}
            testID="renter-firstname-input"
          />
          <Input
            label="Last Name"
            value={formData.last_name}
            onChangeText={text => setFormData({ ...formData, last_name: text })}
            placeholder="Doe"
            required
            containerStyle={styles.halfInput}
            testID="renter-lastname-input"
          />
        </View>

        <Input
          label="Email"
          value={formData.email}
          onChangeText={text => setFormData({ ...formData, email: text })}
          placeholder="john.doe@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          required
          testID="renter-email-input"
        />

        <Input
          label="Phone"
          value={formData.phone}
          onChangeText={text => setFormData({ ...formData, phone: text })}
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
          required
          testID="renter-phone-input"
        />

        <Input
          label="Date of Birth"
          value={formData.date_of_birth}
          onChangeText={text => setFormData({ ...formData, date_of_birth: text })}
          placeholder="YYYY-MM-DD"
          testID="renter-dob-input"
        />

        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <Input
          label="Contact Name"
          value={formData.emergency_contact_name}
          onChangeText={text => setFormData({ ...formData, emergency_contact_name: text })}
          placeholder="Jane Doe"
          testID="renter-emergency-name-input"
        />

        <Input
          label="Contact Phone"
          value={formData.emergency_contact_phone}
          onChangeText={text => setFormData({ ...formData, emergency_contact_phone: text })}
          placeholder="(555) 987-6543"
          keyboardType="phone-pad"
          testID="renter-emergency-phone-input"
        />

        <Text style={styles.sectionTitle}>Identification</Text>
        <View style={styles.row}>
          <Input
            label="ID Type"
            value={formData.id_type}
            onChangeText={text => setFormData({ ...formData, id_type: text })}
            placeholder="Driver's License"
            containerStyle={styles.halfInput}
            testID="renter-id-type-input"
          />
          <Input
            label="ID Number"
            value={formData.id_number}
            onChangeText={text => setFormData({ ...formData, id_number: text })}
            placeholder="ABC123456"
            containerStyle={styles.halfInput}
            testID="renter-id-number-input"
          />
        </View>

        <Input
          label="Notes"
          value={formData.notes}
          onChangeText={text => setFormData({ ...formData, notes: text })}
          placeholder="Additional notes about the renter"
          multiline
          numberOfLines={3}
          testID="renter-notes-input"
        />

        <Button
          title={editingRenter ? 'Update Renter' : 'Add Renter'}
          onPress={handleSave}
          fullWidth
          testID="save-renter-button"
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
  renterCard: {
    marginBottom: 16,
  },
  renterHeader: {
    flexDirection: 'row' as const,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  renterInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  renterName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  leaseStatus: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500' as const,
  },
  contactInfo: {
    gap: 8,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  notesSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
  },
  renterActions: {
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
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
});
