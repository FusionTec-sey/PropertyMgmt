import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Plus, Building2, MapPin, Edit, Trash2, ChevronDown, ChevronRight, Home, DollarSign, ParkingCircle, Image as ImageIcon, Package } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Property, Unit, PropertyType, ParkingSpot } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import PhotoGallery from '@/components/PhotoGallery';
import { showPhotoOptions } from '@/components/PhotoPicker';
import { useRouter } from 'expo-router';

export default function PropertiesScreen() {
  const { properties, units, addProperty, updateProperty, deleteProperty, addUnit, updateUnit } = useApp();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [unitModalVisible, setUnitModalVisible] = useState<boolean>(false);
  const [parkingModalVisible, setParkingModalVisible] = useState<boolean>(false);
  const [photosModalVisible, setPhotosModalVisible] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());
  const [editingPhotosFor, setEditingPhotosFor] = useState<'property' | 'unit' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    island: '',
    postal_code: '',
    country: 'Seychelles',
    property_type: 'building' as PropertyType,
    total_units: '0',
    description: '',
  });

  const [unitFormData, setUnitFormData] = useState({
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

  const [parkingFormData, setParkingFormData] = useState({
    spot_number: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      island: '',
      postal_code: '',
      country: 'Seychelles',
      property_type: 'building',
      total_units: '0',
      description: '',
    });
    setEditingProperty(null);
  };

  const resetUnitForm = () => {
    setUnitFormData({
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
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city,
      island: property.island,
      postal_code: property.postal_code,
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

  const handleAddUnit = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    resetUnitForm();
    setUnitModalVisible(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setSelectedPropertyId(unit.property_id);
    setEditingUnit(unit);
    setUnitFormData({
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
    setUnitModalVisible(true);
  };

  const handleSaveUnit = async () => {
    if (!unitFormData.unit_number || !unitFormData.rent_amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const unitData = {
      property_id: selectedPropertyId,
      unit_number: unitFormData.unit_number,
      floor: unitFormData.floor ? parseInt(unitFormData.floor) : undefined,
      bedrooms: unitFormData.bedrooms ? parseInt(unitFormData.bedrooms) : undefined,
      bathrooms: unitFormData.bathrooms ? parseFloat(unitFormData.bathrooms) : undefined,
      square_feet: unitFormData.square_feet ? parseInt(unitFormData.square_feet) : undefined,
      rent_amount: parseFloat(unitFormData.rent_amount),
      deposit_amount: unitFormData.deposit_amount ? parseFloat(unitFormData.deposit_amount) : undefined,
      status: unitFormData.status,
      description: unitFormData.description || undefined,
    };

    if (editingUnit) {
      await updateUnit(editingUnit.id, unitData);
    } else {
      await addUnit(unitData);
    }

    setUnitModalVisible(false);
    resetUnitForm();
  };

  const handleManageParking = (property: Property) => {
    setEditingProperty(property);
    setParkingModalVisible(true);
  };

  const handleManagePropertyPhotos = (property: Property) => {
    setEditingProperty(property);
    setEditingPhotosFor('property');
    setPhotosModalVisible(true);
  };

  const handleManageUnitPhotos = (unit: Unit) => {
    setEditingUnit(unit);
    setEditingPhotosFor('unit');
    setPhotosModalVisible(true);
  };

  const handleManageInventory = (property: Property, unit?: Unit) => {
    router.push(`/inventory/${property.id}${unit ? `?unitId=${unit.id}` : ''}` as any);
  };

  const handleAddPhoto = () => {
    showPhotoOptions((uri: string) => {
      if (editingPhotosFor === 'property' && editingProperty) {
        const currentPhotos = editingProperty.images || [];
        updateProperty(editingProperty.id, {
          images: [...currentPhotos, uri],
        });
      } else if (editingPhotosFor === 'unit' && editingUnit) {
        const currentPhotos = editingUnit.images || [];
        updateUnit(editingUnit.id, {
          images: [...currentPhotos, uri],
        });
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    if (editingPhotosFor === 'property' && editingProperty) {
      const currentPhotos = editingProperty.images || [];
      const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
      updateProperty(editingProperty.id, {
        images: updatedPhotos,
      });
    } else if (editingPhotosFor === 'unit' && editingUnit) {
      const currentPhotos = editingUnit.images || [];
      const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
      updateUnit(editingUnit.id, {
        images: updatedPhotos,
      });
    }
  };

  const handleAddParkingSpot = () => {
    if (!parkingFormData.spot_number) {
      Alert.alert('Error', 'Please enter a spot number');
      return;
    }

    if (editingProperty) {
      const newSpot: ParkingSpot = {
        id: Date.now().toString(),
        spot_number: parkingFormData.spot_number,
        notes: parkingFormData.notes || undefined,
      };

      const existingSpots = editingProperty.parking_spots || [];
      updateProperty(editingProperty.id, {
        parking_spots: [...existingSpots, newSpot],
      });

      setParkingFormData({ spot_number: '', notes: '' });
    }
  };

  const handleDeleteParkingSpot = (spotId: string) => {
    if (editingProperty) {
      const updatedSpots = (editingProperty.parking_spots || []).filter(s => s.id !== spotId);
      updateProperty(editingProperty.id, {
        parking_spots: updatedSpots,
      });
    }
  };

  const toggleExpanded = (propertyId: string) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
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

  const renderUnit = (unit: Unit) => (
    <Card key={unit.id} style={styles.unitCard}>
      <View style={styles.unitHeader}>
        <View>
          <Text style={styles.unitNumber}>Unit {unit.unit_number}</Text>
          {unit.bedrooms || unit.bathrooms ? (
            <Text style={styles.unitDetails}>
              {unit.bedrooms && `${unit.bedrooms} bed`}
              {unit.bedrooms && unit.bathrooms && ' • '}
              {unit.bathrooms && `${unit.bathrooms} bath`}
            </Text>
          ) : null}
        </View>
        <Badge label={unit.status} variant={getStatusVariant(unit.status)} />
      </View>

      <View style={styles.rentRow}>
        <DollarSign size={16} color="#34C759" />
        <Text style={styles.rentAmount}>
          ${unit.rent_amount.toLocaleString()}/month
        </Text>
      </View>

      {unit.images && unit.images.length > 0 && (
        <View style={styles.unitPhotosPreview}>
          <ImageIcon size={14} color="#666" />
          <Text style={styles.unitPhotosText}>{unit.images.length} photo{unit.images.length > 1 ? 's' : ''}</Text>
        </View>
      )}

      <View style={styles.unitActions}>
        <TouchableOpacity
          style={styles.unitActionButton}
          onPress={() => {
            const property = properties.find(p => p.id === unit.property_id);
            if (property) handleManageInventory(property, unit);
          }}
          testID={`inventory-unit-${unit.id}`}
        >
          <Package size={16} color="#007AFF" />
          <Text style={styles.unitActionText}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.unitActionButton}
          onPress={() => handleManageUnitPhotos(unit)}
          testID={`photos-unit-${unit.id}`}
        >
          <ImageIcon size={16} color="#007AFF" />
          <Text style={styles.unitActionText}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.unitActionButton}
          onPress={() => handleEditUnit(unit)}
          testID={`edit-unit-${unit.id}`}
        >
          <Edit size={16} color="#007AFF" />
          <Text style={styles.unitActionText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderProperty = ({ item }: { item: Property }) => {
    const propertyUnits = units.filter(u => u.property_id === item.id);
    const occupiedUnits = propertyUnits.filter(u => u.status === 'occupied').length;
    const isExpanded = expandedProperties.has(item.id);
    const parkingCount = item.parking_spots?.length || 0;

    return (
      <Card style={styles.propertyCard}>
        <TouchableOpacity
          onPress={() => toggleExpanded(item.id)}
          testID={`toggle-property-${item.id}`}
        >
          <View style={styles.propertyHeader}>
            {item.images && item.images.length > 0 ? (
              <Image
                source={{ uri: item.images[0] }}
                style={styles.propertyImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.propertyIcon}>
                <Building2 size={24} color="#007AFF" />
              </View>
            )}
            <View style={styles.propertyInfo}>
              <View style={styles.propertyTitleRow}>
                <Text style={styles.propertyName}>{item.name}</Text>
                <Badge label={item.property_type} variant="info" />
              </View>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#666" />
                <Text style={styles.locationText}>
                  {item.city}, {item.island}
                </Text>
              </View>
            </View>
            {isExpanded ? (
              <ChevronDown size={24} color="#666" />
            ) : (
              <ChevronRight size={24} color="#666" />
            )}
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
            <View style={styles.stat}>
              <Text style={styles.statValue}>{parkingCount}</Text>
              <Text style={styles.statLabel}>Parking</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAddUnit(item.id)}
                testID={`add-unit-${item.id}`}
              >
                <Plus size={16} color="#007AFF" />
                <Text style={styles.actionText}>Add Unit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/inventory/${item.id}` as any)}
                testID={`inventory-property-${item.id}`}
              >
                <Package size={16} color="#007AFF" />
                <Text style={styles.actionText}>Inventory</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleManagePropertyPhotos(item)}
                testID={`photos-property-${item.id}`}
              >
                <ImageIcon size={16} color="#007AFF" />
                <Text style={styles.actionText}>Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleManageParking(item)}
                testID={`manage-parking-${item.id}`}
              >
                <ParkingCircle size={16} color="#007AFF" />
                <Text style={styles.actionText}>Parking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(item)}
                testID={`edit-property-${item.id}`}
              >
                <Edit size={16} color="#007AFF" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(item)}
                testID={`delete-property-${item.id}`}
              >
                <Trash2 size={16} color="#FF3B30" />
                <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            </View>

            {propertyUnits.length === 0 ? (
              <View style={styles.emptyUnits}>
                <Home size={32} color="#999" />
                <Text style={styles.emptyUnitsText}>No units yet</Text>
                <Text style={styles.emptyUnitsSubtext}>Add units to this property</Text>
              </View>
            ) : (
              <View style={styles.unitsContainer}>
                {propertyUnits.map(unit => renderUnit(unit))}
              </View>
            )}
          </View>
        )}
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

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Property Type</Text>
          <View style={styles.typeSelector}>
            {(['unit', 'building', 'house', 'office'] as PropertyType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeItem,
                  formData.property_type === type && styles.typeItemActive
                ]}
                onPress={() => setFormData({ ...formData, property_type: type })}
              >
                <Text style={[
                  styles.typeItemText,
                  formData.property_type === type && styles.typeItemTextActive
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
            label="Island"
            value={formData.island}
            onChangeText={text => setFormData({ ...formData, island: text })}
            placeholder="Mahe"
            containerStyle={styles.halfInput}
            testID="property-island-input"
          />
          <Input
            label="Postal Code"
            value={formData.postal_code}
            onChangeText={text => setFormData({ ...formData, postal_code: text })}
            placeholder="12345"
            containerStyle={styles.halfInput}
            testID="property-postal-code-input"
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

      <Modal
        visible={unitModalVisible}
        onClose={() => {
          setUnitModalVisible(false);
          resetUnitForm();
        }}
        title={editingUnit ? 'Edit Unit' : 'Add Unit'}
        testID="unit-modal"
      >
        <Input
          label="Unit Number"
          value={unitFormData.unit_number}
          onChangeText={text => setUnitFormData({ ...unitFormData, unit_number: text })}
          placeholder="101"
          required
          testID="unit-number-input"
        />

        <View style={styles.row}>
          <Input
            label="Floor"
            value={unitFormData.floor}
            onChangeText={text => setUnitFormData({ ...unitFormData, floor: text })}
            placeholder="1"
            keyboardType="number-pad"
            containerStyle={styles.halfInput}
            testID="unit-floor-input"
          />
          <Input
            label="Bedrooms"
            value={unitFormData.bedrooms}
            onChangeText={text => setUnitFormData({ ...unitFormData, bedrooms: text })}
            placeholder="2"
            keyboardType="number-pad"
            containerStyle={styles.halfInput}
            testID="unit-bedrooms-input"
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Bathrooms"
            value={unitFormData.bathrooms}
            onChangeText={text => setUnitFormData({ ...unitFormData, bathrooms: text })}
            placeholder="1.5"
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
            testID="unit-bathrooms-input"
          />
          <Input
            label="Square Feet"
            value={unitFormData.square_feet}
            onChangeText={text => setUnitFormData({ ...unitFormData, square_feet: text })}
            placeholder="800"
            keyboardType="number-pad"
            containerStyle={styles.halfInput}
            testID="unit-sqft-input"
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Rent Amount"
            value={unitFormData.rent_amount}
            onChangeText={text => setUnitFormData({ ...unitFormData, rent_amount: text })}
            placeholder="1200"
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
            required
            testID="unit-rent-input"
          />
          <Input
            label="Deposit"
            value={unitFormData.deposit_amount}
            onChangeText={text => setUnitFormData({ ...unitFormData, deposit_amount: text })}
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
                  unitFormData.status === status && styles.statusItemActive
                ]}
                onPress={() => setUnitFormData({ ...unitFormData, status: status as any })}
              >
                <Text style={[
                  styles.statusItemText,
                  unitFormData.status === status && styles.statusItemTextActive
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Description"
          value={unitFormData.description}
          onChangeText={text => setUnitFormData({ ...unitFormData, description: text })}
          placeholder="Optional description"
          multiline
          numberOfLines={2}
          testID="unit-description-input"
        />

        <Button
          title={editingUnit ? 'Update Unit' : 'Add Unit'}
          onPress={handleSaveUnit}
          fullWidth
          testID="save-unit-button"
        />
      </Modal>

      <Modal
        visible={parkingModalVisible}
        onClose={() => {
          setParkingModalVisible(false);
          setParkingFormData({ spot_number: '', notes: '' });
        }}
        title={`Parking - ${editingProperty?.name}`}
        testID="parking-modal"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.parkingAddSection}>
            <Text style={styles.sectionTitle}>Add Parking Spot</Text>
            <View style={styles.row}>
              <Input
                label="Spot Number"
                value={parkingFormData.spot_number}
                onChangeText={text => setParkingFormData({ ...parkingFormData, spot_number: text })}
                placeholder="P1"
                containerStyle={styles.halfInput}
                testID="parking-spot-input"
              />
              <Input
                label="Notes"
                value={parkingFormData.notes}
                onChangeText={text => setParkingFormData({ ...parkingFormData, notes: text })}
                placeholder="Optional"
                containerStyle={styles.halfInput}
                testID="parking-notes-input"
              />
            </View>
            <Button
              title="Add Spot"
              onPress={handleAddParkingSpot}
              fullWidth
              testID="add-parking-button"
            />
          </View>

          <View style={styles.parkingList}>
            <Text style={styles.sectionTitle}>
              Parking Spots ({editingProperty?.parking_spots?.length || 0})
            </Text>
            {editingProperty?.parking_spots && editingProperty.parking_spots.length > 0 ? (
              editingProperty.parking_spots.map(spot => (
                <Card key={spot.id} style={styles.parkingCard}>
                  <View style={styles.parkingSpotRow}>
                    <View style={styles.parkingSpotInfo}>
                      <ParkingCircle size={20} color="#007AFF" />
                      <View>
                        <Text style={styles.parkingSpotNumber}>Spot {spot.spot_number}</Text>
                        {spot.notes && (
                          <Text style={styles.parkingSpotNotes}>{spot.notes}</Text>
                        )}
                        {spot.assigned_to_tenant_renter_id && (
                          <Badge label="Assigned" variant="info" />
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteParkingSpot(spot.id)}
                      testID={`delete-parking-${spot.id}`}
                    >
                      <Trash2 size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.emptyParking}>
                <ParkingCircle size={32} color="#999" />
                <Text style={styles.emptyParkingText}>No parking spots yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Modal>

      <Modal
        visible={photosModalVisible}
        onClose={() => {
          setPhotosModalVisible(false);
          setEditingPhotosFor(null);
          setEditingProperty(null);
          setEditingUnit(null);
        }}
        title={editingPhotosFor === 'property' 
          ? `Photos - ${editingProperty?.name}` 
          : `Photos - Unit ${editingUnit?.unit_number}`}
        testID="photos-modal"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <PhotoGallery
            photos={editingPhotosFor === 'property' 
              ? (editingProperty?.images || []) 
              : (editingUnit?.images || [])}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
            editable
            maxPhotos={20}
            testID="property-photo-gallery"
          />
          
          {((editingPhotosFor === 'property' && (!editingProperty?.images || editingProperty.images.length === 0)) ||
            (editingPhotosFor === 'unit' && (!editingUnit?.images || editingUnit.images.length === 0))) && (
            <EmptyState
              icon={ImageIcon}
              title="No Photos"
              message="Add photos to showcase this space"
              actionLabel="Add Photo"
              onAction={handleAddPhoto}
              testID="photos-empty"
            />
          )}
        </ScrollView>
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
    alignItems: 'center' as const,
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
  propertyImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  propertyInfo: {
    flex: 1,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  propertyTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap' as const,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flexShrink: 1,
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
  actionRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  expandedSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  unitsContainer: {
    gap: 8,
  },
  unitCard: {
    padding: 12,
    marginBottom: 0,
  },
  unitHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  unitNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  unitDetails: {
    fontSize: 13,
    color: '#666',
  },
  rentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 8,
  },
  rentAmount: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  unitActions: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  unitActionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    gap: 4,
  },
  unitActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  emptyUnits: {
    alignItems: 'center' as const,
    padding: 24,
  },
  emptyUnitsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#999',
    marginTop: 8,
  },
  emptyUnitsSubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  typeSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  typeItem: {
    flex: 1,
    minWidth: '45%' as const,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center' as const,
  },
  typeItemActive: {
    backgroundColor: '#007AFF',
  },
  typeItemText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  typeItemTextActive: {
    color: '#FFFFFF',
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
  parkingAddSection: {
    marginBottom: 24,
  },
  parkingList: {
    gap: 8,
  },
  parkingCard: {
    padding: 12,
    marginBottom: 8,
  },
  parkingSpotRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  parkingSpotInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  parkingSpotNumber: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  parkingSpotNotes: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyParking: {
    alignItems: 'center' as const,
    padding: 24,
  },
  emptyParkingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  unitPhotosPreview: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 8,
  },
  unitPhotosText: {
    fontSize: 13,
    color: '#666',
  },
});
