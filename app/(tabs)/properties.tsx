import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Plus, Building2, MapPin, Edit, Trash2 } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Property } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import EmptyState from '@/components/EmptyState';

export default function PropertiesScreen() {
  const { properties, addProperty, updateProperty, deleteProperty, units } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    property_type: 'residential' as 'residential' | 'commercial' | 'mixed',
    total_units: '0',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      property_type: 'residential',
      total_units: '0',
      description: '',
    });
    setEditingProperty(null);
  };

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      zip_code: property.zip_code,
      country: property.country,
      property_type: property.property_type,
      total_units: property.total_units.toString(),
      description: property.description || '',
    });
    setModalVisible(true);
  };

  const handleDelete = (property: Property) => {
    const propertyUnits = units.filter(u => u.property_id === property.id);
    
    Alert.alert(
      'Delete Property',
      propertyUnits.length > 0
        ? `This property has ${propertyUnits.length} unit(s). Are you sure you want to delete it?`
        : 'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProperty(property.id),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address || !formData.city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingProperty) {
      await updateProperty(editingProperty.id, {
        ...formData,
        total_units: parseInt(formData.total_units) || 0,
      });
    } else {
      await addProperty({
        ...formData,
        total_units: parseInt(formData.total_units) || 0,
      });
    }

    setModalVisible(false);
    resetForm();
  };

  const renderProperty = ({ item }: { item: Property }) => {
    const propertyUnits = units.filter(u => u.property_id === item.id);
    const occupiedUnits = propertyUnits.filter(u => u.status === 'occupied').length;

    return (
      <Card style={styles.propertyCard}>
        <View style={styles.propertyHeader}>
          <View style={styles.propertyIcon}>
            <Building2 size={24} color="#007AFF" />
          </View>
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{item.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#666" />
              <Text style={styles.locationText}>
                {item.city}, {item.state}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.propertyStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{propertyUnits.length}</Text>
            <Text style={styles.statLabel}>Units</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{occupiedUnits}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{propertyUnits.length - occupiedUnits}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <View style={styles.propertyActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            testID={`edit-property-${item.id}`}
          >
            <Edit size={18} color="#007AFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
            testID={`delete-property-${item.id}`}
          >
            <Trash2 size={18} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Properties ({properties.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-property-button"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Properties"
          message="Start by adding your first property to manage"
          actionLabel="Add Property"
          onAction={handleAdd}
          testID="properties-empty"
        />
      ) : (
        <FlatList
          data={properties}
          renderItem={renderProperty}
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
        title={editingProperty ? 'Edit Property' : 'Add Property'}
        testID="property-modal"
      >
        <Input
          label="Property Name"
          value={formData.name}
          onChangeText={text => setFormData({ ...formData, name: text })}
          placeholder="Enter property name"
          required
          testID="property-name-input"
        />
        <Input
          label="Address"
          value={formData.address}
          onChangeText={text => setFormData({ ...formData, address: text })}
          placeholder="Enter street address"
          required
          testID="property-address-input"
        />
        <Input
          label="City"
          value={formData.city}
          onChangeText={text => setFormData({ ...formData, city: text })}
          placeholder="Enter city"
          required
          testID="property-city-input"
        />
        <View style={styles.row}>
          <Input
            label="State"
            value={formData.state}
            onChangeText={text => setFormData({ ...formData, state: text })}
            placeholder="State"
            containerStyle={styles.halfInput}
            testID="property-state-input"
          />
          <Input
            label="ZIP Code"
            value={formData.zip_code}
            onChangeText={text => setFormData({ ...formData, zip_code: text })}
            placeholder="ZIP"
            keyboardType="number-pad"
            containerStyle={styles.halfInput}
            testID="property-zip-input"
          />
        </View>
        <Input
          label="Total Units"
          value={formData.total_units}
          onChangeText={text => setFormData({ ...formData, total_units: text })}
          placeholder="0"
          keyboardType="number-pad"
          testID="property-units-input"
        />
        <Input
          label="Description"
          value={formData.description}
          onChangeText={text => setFormData({ ...formData, description: text })}
          placeholder="Optional description"
          multiline
          numberOfLines={3}
          testID="property-description-input"
        />
        <Button
          title={editingProperty ? 'Update Property' : 'Add Property'}
          onPress={handleSave}
          fullWidth
          testID="save-property-button"
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
  propertyCard: {
    marginBottom: 16,
  },
  propertyHeader: {
    flexDirection: 'row' as const,
    marginBottom: 16,
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  propertyInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  propertyStats: {
    flexDirection: 'row' as const,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  propertyActions: {
    flexDirection: 'row' as const,
    gap: 12,
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
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
});
