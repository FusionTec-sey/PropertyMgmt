import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Plus, Home, Edit, DollarSign } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Unit } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';

export default function UnitsManagementScreen() {
  const { units, properties, addUnit, updateUnit } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [formData, setFormData] = useState({
    property_id: '',
    unit_number: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    rent_amount: '',
    deposit_amount: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance' | 'reserved',
    description: '',
  });

  const filteredUnits = useMemo(() => {
    if (selectedProperty === 'all') return units;
    return units.filter(u => u.property_id === selectedProperty);
  }, [units, selectedProperty]);

  const resetForm = () => {
    setFormData({
      property_id: '',
      unit_number: '',
      floor: '',
      bedrooms: '',
      bathrooms: '',
      square_feet: '',
      rent_amount: '',
      deposit_amount: '',
      status: 'available',
      description: '',
    });
    setEditingUnit(null);
  };

  const handleAdd = () => {
    if (properties.length === 0) {
      Alert.alert('No Properties', 'Please add a property first before creating units');
      return;
    }
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      property_id: unit.property_id,
      unit_number: unit.unit_number,
      floor: unit.floor?.toString() || '',
      bedrooms: unit.bedrooms?.toString() || '',
      bathrooms: unit.bathrooms?.toString() || '',
      square_feet: unit.square_feet?.toString() || '',
      rent_amount: unit.rent_amount.toString(),
      deposit_amount: unit.deposit_amount?.toString() || '',
      status: unit.status,
      description: unit.description || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.property_id || !formData.unit_number || !formData.rent_amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const unitData = {
      property_id: formData.property_id,
      unit_number: formData.unit_number,
      floor: formData.floor ? parseInt(formData.floor) : undefined,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
      square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
      rent_amount: parseFloat(formData.rent_amount),
      deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : undefined,
      status: formData.status,
      description: formData.description || undefined,
    };

    if (editingUnit) {
      await updateUnit(editingUnit.id, unitData);
    } else {
      await addUnit(unitData);
    }

    setModalVisible(false);
    resetForm();
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'info';
      case 'maintenance':
        return 'warning';
      case 'reserved':
        return 'danger';
      default:
        return 'info';
    }
  };

  const renderUnit = ({ item }: { item: Unit }) => {
    const property = properties.find(p => p.id === item.property_id);

    return (
      <Card style={styles.unitCard}>
        <View style={styles.unitHeader}>
          <View>
            <Text style={styles.unitNumber}>Unit {item.unit_number}</Text>
            <Text style={styles.propertyName}>{property?.name || 'Unknown Property'}</Text>
          </View>
          <Badge label={item.status} variant={getStatusVariant(item.status)} />
        </View>

        <View style={styles.unitDetails}>
          {item.bedrooms && (
            <Text style={styles.detailText}>{item.bedrooms} bed</Text>
          )}
          {item.bathrooms && (
            <Text style={styles.detailText}>{item.bathrooms} bath</Text>
          )}
          {item.square_feet && (
            <Text style={styles.detailText}>{item.square_feet} sq ft</Text>
          )}
        </View>

        <View style={styles.rentRow}>
          <DollarSign size={16} color="#34C759" />
          <Text style={styles.rentAmount}>
            ${item.rent_amount.toLocaleString()}/month
          </Text>
        </View>

        <View style={styles.unitActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            testID={`edit-unit-${item.id}`}
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
          <Text style={styles.headerTitle}>Units ({filteredUnits.length})</Text>
          {properties.length > 1 && (
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, selectedProperty === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedProperty('all')}
              >
                <Text style={[styles.filterChipText, selectedProperty === 'all' && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {properties.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.filterChip, selectedProperty === p.id && styles.filterChipActive]}
                  onPress={() => setSelectedProperty(p.id)}
                >
                  <Text style={[styles.filterChipText, selectedProperty === p.id && styles.filterChipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-unit-button"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {filteredUnits.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No Units"
          message={properties.length === 0 ? "Add a property first, then create units" : "Start by adding units to your properties"}
          actionLabel={properties.length > 0 ? "Add Unit" : undefined}
          onAction={properties.length > 0 ? handleAdd : undefined}
          testID="units-empty"
        />
      ) : (
        <FlatList
          data={filteredUnits}
          renderItem={renderUnit}
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
        title={editingUnit ? 'Edit Unit' : 'Add Unit'}
        testID="unit-modal"
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.propertySelector}>
            {properties.map(property => (
              <TouchableOpacity
                key={property.id}
                style={[
                  styles.propertySelectorItem,
                  formData.property_id === property.id && styles.propertySelectorItemActive
                ]}
                onPress={() => setFormData({ ...formData, property_id: property.id })}
              >
                <Text style={[
                  styles.propertySelectorText,
                  formData.property_id === property.id && styles.propertySelectorTextActive
                ]}>
                  {property.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Unit Number"
          value={formData.unit_number}
          onChangeText={text => setFormData({ ...formData, unit_number: text })}
          placeholder="101"
          required
          testID="unit-number-input"
        />

        <View style={styles.row}>
          <Input
            label="Floor"
            value={formData.floor}
            onChangeText={text => setFormData({ ...formData, floor: text })}
            placeholder="1"
            keyboardType="number-pad"
            containerStyle={styles.halfInput}
            testID="unit-floor-input"
          />
          <Input
            label="Bedrooms"
            value={formData.bedrooms}
            onChangeText={text => setFormData({ ...formData, bedrooms: text })}
            placeholder="2"
            keyboardType="number-pad"
            containerStyle={styles.halfInput}
            testID="unit-bedrooms-input"
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Bathrooms"
            value={formData.bathrooms}
            onChangeText={text => setFormData({ ...formData, bathrooms: text })}
            placeholder="1.5"
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
            testID="unit-bathrooms-input"
          />
          <Input
            label="Square Feet"
            value={formData.square_feet}
            onChangeText={text => setFormData({ ...formData, square_feet: text })}
            placeholder="800"
            keyboardType="number-pad"
            containerStyle={styles.halfInput}
            testID="unit-sqft-input"
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Rent Amount"
            value={formData.rent_amount}
            onChangeText={text => setFormData({ ...formData, rent_amount: text })}
            placeholder="1200"
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
            required
            testID="unit-rent-input"
          />
          <Input
            label="Deposit"
            value={formData.deposit_amount}
            onChangeText={text => setFormData({ ...formData, deposit_amount: text })}
            placeholder="1200"
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
            testID="unit-deposit-input"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusSelector}>
            {['available', 'occupied', 'maintenance', 'reserved'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusItem,
                  formData.status === status && styles.statusItemActive
                ]}
                onPress={() => setFormData({ ...formData, status: status as any })}
              >
                <Text style={[
                  styles.statusItemText,
                  formData.status === status && styles.statusItemTextActive
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Description"
          value={formData.description}
          onChangeText={text => setFormData({ ...formData, description: text })}
          placeholder="Optional description"
          multiline
          numberOfLines={2}
          testID="unit-description-input"
        />

        <Button
          title={editingUnit ? 'Update Unit' : 'Add Unit'}
          onPress={handleSave}
          fullWidth
          testID="save-unit-button"
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
  filterRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
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
  unitCard: {
    marginBottom: 16,
  },
  unitHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  unitNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 14,
    color: '#666',
  },
  unitDetails: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  rentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 12,
  },
  rentAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  unitActions: {
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
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  propertySelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  propertySelectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  propertySelectorItemActive: {
    backgroundColor: '#007AFF15',
    borderColor: '#007AFF',
  },
  propertySelectorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  propertySelectorTextActive: {
    color: '#007AFF',
  },
  statusSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  statusItem: {
    flex: 1,
    minWidth: '45%' as const,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center' as const,
  },
  statusItemActive: {
    backgroundColor: '#007AFF',
  },
  statusItemText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    textTransform: 'capitalize' as const,
  },
  statusItemTextActive: {
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
