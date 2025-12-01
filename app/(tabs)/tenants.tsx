import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Plus, Users, Mail, Phone, Edit, User, ClipboardCheck, Camera, CheckCircle, Circle, X, Building, FileText, Calendar, DollarSign } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { TenantRenter, MoveInChecklistItem, Unit, Lease } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function TenantsScreen() {
  const { tenantRenters, addTenantRenter, updateTenantRenter, leases, units, addMoveInChecklist, updateMoveInChecklist, moveInChecklists, properties } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<TenantRenter | null>(null);
  const [checklistModalVisible, setChecklistModalVisible] = useState<boolean>(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantRenter | null>(null);
  const [cameraVisible, setCameraVisible] = useState<boolean>(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [currentChecklistItemIndex, setCurrentChecklistItemIndex] = useState<number | null>(null);
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<TenantRenter | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    type: 'individual' as 'individual' | 'business',
    first_name: '',
    last_name: '',
    business_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    id_number: '',
    id_type: '',
    address: '',
    island: '',
    postal_code: '',
    country: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'individual',
      first_name: '',
      last_name: '',
      business_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      id_number: '',
      id_type: '',
      address: '',
      island: '',
      postal_code: '',
      country: '',
      notes: '',
    });
    setEditingTenant(null);
  };

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (tenant: TenantRenter) => {
    setEditingTenant(tenant);
    setFormData({
      type: tenant.type,
      first_name: tenant.first_name || '',
      last_name: tenant.last_name || '',
      business_name: tenant.business_name || '',
      email: tenant.email,
      phone: tenant.phone,
      date_of_birth: tenant.date_of_birth || '',
      emergency_contact_name: tenant.emergency_contact_name || '',
      emergency_contact_phone: tenant.emergency_contact_phone || '',
      id_number: tenant.id_number || '',
      id_type: tenant.id_type || '',
      address: tenant.address || '',
      island: tenant.island || '',
      postal_code: tenant.postal_code || '',
      country: tenant.country || '',
      notes: tenant.notes || '',
    });
    setModalVisible(true);
  };

  const handleOpenChecklist = (tenant: TenantRenter) => {
    setSelectedTenant(tenant);
    const tenantLeases = leases.filter(l => l.tenant_renter_id === tenant.id && l.status === 'active');
    if (tenantLeases.length === 0) {
      Alert.alert('No Active Lease', 'This tenant does not have an active lease.');
      return;
    }
    setChecklistModalVisible(true);
  };

  const getDefaultChecklistItems = (): MoveInChecklistItem[] => [
    { id: '1', name: 'Walls condition', category: 'general', checked: false, condition: 'good' },
    { id: '2', name: 'Floors condition', category: 'general', checked: false, condition: 'good' },
    { id: '3', name: 'Windows and doors', category: 'general', checked: false, condition: 'good' },
    { id: '4', name: 'Ceiling condition', category: 'general', checked: false, condition: 'good' },
    { id: '5', name: 'Refrigerator', category: 'kitchen', checked: false, condition: 'good' },
    { id: '6', name: 'Stove/Oven', category: 'kitchen', checked: false, condition: 'good' },
    { id: '7', name: 'Microwave', category: 'kitchen', checked: false, condition: 'good' },
    { id: '8', name: 'Kitchen cabinets', category: 'kitchen', checked: false, condition: 'good' },
    { id: '9', name: 'Kitchen sink and faucet', category: 'kitchen', checked: false, condition: 'good' },
    { id: '10', name: 'Toilet', category: 'bathroom', checked: false, condition: 'good' },
    { id: '11', name: 'Shower/Bathtub', category: 'bathroom', checked: false, condition: 'good' },
    { id: '12', name: 'Bathroom sink', category: 'bathroom', checked: false, condition: 'good' },
    { id: '13', name: 'Bathroom cabinets', category: 'bathroom', checked: false, condition: 'good' },
    { id: '14', name: 'Bedroom closets', category: 'bedroom', checked: false, condition: 'good' },
    { id: '15', name: 'Air conditioning', category: 'general', checked: false, condition: 'good' },
    { id: '16', name: 'Heating system', category: 'general', checked: false, condition: 'good' },
    { id: '17', name: 'Light fixtures', category: 'general', checked: false, condition: 'good' },
    { id: '18', name: 'Smoke detectors', category: 'general', checked: false, condition: 'good' },
  ];

  const handleSaveChecklist = async (items: MoveInChecklistItem[], unitId: string, overallCondition: 'excellent' | 'good' | 'fair' | 'poor') => {
    if (!selectedTenant) return;

    const tenantLeases = leases.filter(l => l.tenant_renter_id === selectedTenant.id && l.status === 'active');
    if (tenantLeases.length === 0) return;

    const lease = tenantLeases[0];

    const existingChecklist = moveInChecklists.find(c => c.tenant_renter_id === selectedTenant.id && c.unit_id === unitId);

    if (existingChecklist) {
      await updateMoveInChecklist(existingChecklist.id, {
        items,
        overall_condition: overallCondition,
        damage_images: damagePhotos,
        completed: true,
        completed_date: new Date().toISOString(),
      });
    } else {
      await addMoveInChecklist({
        tenant_renter_id: selectedTenant.id,
        unit_id: unitId,
        lease_id: lease.id,
        items,
        overall_condition: overallCondition,
        damage_images: damagePhotos,
        completed: true,
        completed_date: new Date().toISOString(),
      });
    }

    Alert.alert('Success', 'Move-in checklist saved successfully!');
    setChecklistModalVisible(false);
    setDamagePhotos([]);
    setSelectedTenant(null);
  };

  const handleTakePicture = async (camera: any, itemIndex: number | null = null) => {
    try {
      const photo = await camera.takePictureAsync();
      if (itemIndex !== null) {
        setCurrentChecklistItemIndex(itemIndex);
      }
      if (itemIndex === null) {
        setDamagePhotos([...damagePhotos, photo.uri]);
      }
      setCameraVisible(false);
      return photo.uri;
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
      setCameraVisible(false);
    }
  };

  const handlePickImage = async (itemIndex: number | null = null) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (itemIndex !== null) {
          setCurrentChecklistItemIndex(itemIndex);
        }
        if (itemIndex === null) {
          setDamagePhotos([...damagePhotos, uri]);
        }
        return uri;
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleOpenCamera = async (itemIndex: number | null = null) => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }
    setCurrentChecklistItemIndex(itemIndex);
    setCameraVisible(true);
  };

  const handleImageAction = (itemIndex: number | null = null) => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => handleOpenCamera(itemIndex) },
        { text: 'Choose from Library', onPress: () => handlePickImage(itemIndex) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill in email and phone');
      return;
    }

    if (formData.type === 'individual' && (!formData.first_name || !formData.last_name)) {
      Alert.alert('Error', 'Please fill in first and last name for individual');
      return;
    }

    if (formData.type === 'business' && !formData.business_name) {
      Alert.alert('Error', 'Please fill in business name');
      return;
    }

    const tenantData = {
      type: formData.type,
      first_name: formData.type === 'individual' ? formData.first_name : undefined,
      last_name: formData.type === 'individual' ? formData.last_name : undefined,
      business_name: formData.type === 'business' ? formData.business_name : undefined,
      email: formData.email,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth || undefined,
      emergency_contact_name: formData.emergency_contact_name || undefined,
      emergency_contact_phone: formData.emergency_contact_phone || undefined,
      id_number: formData.id_number || undefined,
      id_type: formData.id_type || undefined,
      address: formData.address || undefined,
      island: formData.island || undefined,
      postal_code: formData.postal_code || undefined,
      country: formData.country || undefined,
      notes: formData.notes || undefined,
    };

    if (editingTenant) {
      await updateTenantRenter(editingTenant.id, tenantData);
    } else {
      await addTenantRenter(tenantData);
    }

    setModalVisible(false);
    resetForm();
  };

  const getTenantName = (tenant: TenantRenter) => {
    if (tenant.type === 'business') {
      return tenant.business_name || 'Unnamed Business';
    }
    return `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed';
  };

  const handleViewDetails = (tenant: TenantRenter) => {
    setSelectedTenantForDetail(tenant);
    setDetailModalVisible(true);
  };

  const renderTenant = ({ item }: { item: TenantRenter }) => {
    const tenantLeases = leases.filter(l => l.tenant_renter_id === item.id);
    const activeLeases = tenantLeases.filter(l => l.status === 'active');

    return (
      <Card style={styles.tenantCard}>
        <TouchableOpacity onPress={() => handleViewDetails(item)}>
          <View style={styles.tenantHeader}>
            <View style={styles.avatarContainer}>
              {item.type === 'business' ? (
                <Building size={24} color="#007AFF" />
              ) : (
                <User size={24} color="#007AFF" />
              )}
            </View>
            <View style={styles.tenantInfo}>
              <Text style={styles.tenantName}>{getTenantName(item)}</Text>
              <Text style={styles.tenantType}>{item.type === 'business' ? 'Business' : 'Individual'}</Text>
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
            <View style={styles.tenantNotesSection}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.tenantActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            testID={`edit-tenant-${item.id}`}
          >
            <Edit size={16} color="#007AFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenChecklist(item)}
            testID={`checklist-tenant-${item.id}`}
          >
            <ClipboardCheck size={16} color="#34C759" />
            <Text style={[styles.actionText, { color: '#34C759' }]}>Checklist</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tenants ({tenantRenters.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-tenant-button"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {tenantRenters.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Tenants"
          message="Start by adding your first tenant to the system"
          actionLabel="Add Tenant"
          onAction={handleAdd}
          testID="tenants-empty"
        />
      ) : (
        <FlatList
          data={tenantRenters}
          renderItem={renderTenant}
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
        title={editingTenant ? 'Edit Tenant' : 'Add Tenant'}
        testID="tenant-modal"
      >
        <Text style={styles.sectionTitle}>Tenant Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, formData.type === 'individual' && styles.typeButtonActive]}
            onPress={() => setFormData({ ...formData, type: 'individual' })}
          >
            <User size={20} color={formData.type === 'individual' ? '#FFFFFF' : '#666'} />
            <Text style={[styles.typeButtonText, formData.type === 'individual' && styles.typeButtonTextActive]}>Individual</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, formData.type === 'business' && styles.typeButtonActive]}
            onPress={() => setFormData({ ...formData, type: 'business' })}
          >
            <Building size={20} color={formData.type === 'business' ? '#FFFFFF' : '#666'} />
            <Text style={[styles.typeButtonText, formData.type === 'business' && styles.typeButtonTextActive]}>Business</Text>
          </TouchableOpacity>
        </View>

        {formData.type === 'individual' ? (
          <>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.row}>
              <Input
                label="First Name"
                value={formData.first_name}
                onChangeText={text => setFormData({ ...formData, first_name: text })}
                placeholder="John"
                required
                containerStyle={styles.halfInput}
                testID="tenant-firstname-input"
              />
              <Input
                label="Last Name"
                value={formData.last_name}
                onChangeText={text => setFormData({ ...formData, last_name: text })}
                placeholder="Doe"
                required
                containerStyle={styles.halfInput}
                testID="tenant-lastname-input"
              />
            </View>

            <Input
              label="Date of Birth"
              value={formData.date_of_birth}
              onChangeText={text => setFormData({ ...formData, date_of_birth: text })}
              placeholder="YYYY-MM-DD"
              testID="tenant-dob-input"
            />
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Business Information</Text>
            <Input
              label="Business Name"
              value={formData.business_name}
              onChangeText={text => setFormData({ ...formData, business_name: text })}
              placeholder="ABC Company Ltd"
              required
              testID="tenant-business-name-input"
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Input
          label="Email"
          value={formData.email}
          onChangeText={text => setFormData({ ...formData, email: text })}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          required
          testID="tenant-email-input"
        />

        <Input
          label="Phone"
          value={formData.phone}
          onChangeText={text => setFormData({ ...formData, phone: text })}
          placeholder="+248 xxx xxxx"
          keyboardType="phone-pad"
          required
          testID="tenant-phone-input"
        />

        <Input
          label="Address"
          value={formData.address}
          onChangeText={text => setFormData({ ...formData, address: text })}
          placeholder="Street Address"
          testID="tenant-address-input"
        />

        <View style={styles.row}>
          <Input
            label="Island"
            value={formData.island}
            onChangeText={text => setFormData({ ...formData, island: text })}
            placeholder="Mahe"
            containerStyle={styles.halfInput}
            testID="tenant-island-input"
          />
          <Input
            label="Postal Code"
            value={formData.postal_code}
            onChangeText={text => setFormData({ ...formData, postal_code: text })}
            placeholder="12345"
            containerStyle={styles.halfInput}
            testID="tenant-postal-code-input"
          />
        </View>

        <Input
          label="Country"
          value={formData.country}
          onChangeText={text => setFormData({ ...formData, country: text })}
          placeholder="Seychelles"
          testID="tenant-country-input"
        />

        {formData.type === 'individual' && (
          <>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Input
              label="Contact Name"
              value={formData.emergency_contact_name}
              onChangeText={text => setFormData({ ...formData, emergency_contact_name: text })}
              placeholder="Jane Doe"
              testID="tenant-emergency-name-input"
            />

            <Input
              label="Contact Phone"
              value={formData.emergency_contact_phone}
              onChangeText={text => setFormData({ ...formData, emergency_contact_phone: text })}
              placeholder="+248 xxx xxxx"
              keyboardType="phone-pad"
              testID="tenant-emergency-phone-input"
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Identification</Text>
        <View style={styles.row}>
          <Input
            label="ID Type"
            value={formData.id_type}
            onChangeText={text => setFormData({ ...formData, id_type: text })}
            placeholder="Passport"
            containerStyle={styles.halfInput}
            testID="tenant-id-type-input"
          />
          <Input
            label="ID Number"
            value={formData.id_number}
            onChangeText={text => setFormData({ ...formData, id_number: text })}
            placeholder="ABC123456"
            containerStyle={styles.halfInput}
            testID="tenant-id-number-input"
          />
        </View>

        <Input
          label="Notes"
          value={formData.notes}
          onChangeText={text => setFormData({ ...formData, notes: text })}
          placeholder="Additional notes about the tenant"
          multiline
          numberOfLines={3}
          testID="tenant-notes-input"
        />

        <Button
          title={editingTenant ? 'Update Tenant' : 'Add Tenant'}
          onPress={handleSave}
          fullWidth
          testID="save-tenant-button"
        />
      </Modal>

      {selectedTenant && (
        <ChecklistModal
          visible={checklistModalVisible}
          onClose={() => {
            setChecklistModalVisible(false);
            setSelectedTenant(null);
            setDamagePhotos([]);
          }}
          tenant={selectedTenant}
          leases={leases}
          units={units}
          moveInChecklists={moveInChecklists}
          onSave={handleSaveChecklist}
          onImageAction={handleImageAction}
          damagePhotos={damagePhotos}
          setDamagePhotos={setDamagePhotos}
          getDefaultItems={getDefaultChecklistItems}
          getTenantName={getTenantName}
        />
      )}

      {selectedTenantForDetail && (
        <TenantDetailModal
          visible={detailModalVisible}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedTenantForDetail(null);
          }}
          tenant={selectedTenantForDetail}
          leases={leases}
          units={units}
          properties={properties}
          getTenantName={getTenantName}
        />
      )}

      <Modal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        title="Take Photo"
        testID="camera-modal"
      >
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            ref={(ref: any) => {
              if (ref) {
                (window as any).cameraRef = ref;
              }
            }}
          />
          <View style={styles.cameraActions}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => {
                const camera = (window as any).cameraRef;
                if (camera) {
                  handleTakePicture(camera, currentChecklistItemIndex);
                }
              }}
            >
              <Camera size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface ChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  tenant: TenantRenter;
  leases: any[];
  units: Unit[];
  moveInChecklists: any[];
  onSave: (items: MoveInChecklistItem[], unitId: string, overallCondition: 'excellent' | 'good' | 'fair' | 'poor') => void;
  onImageAction: (itemIndex: number | null) => void;
  damagePhotos: string[];
  setDamagePhotos: (photos: string[]) => void;
  getDefaultItems: () => MoveInChecklistItem[];
  getTenantName: (tenant: TenantRenter) => string;
}

function ChecklistModal({
  visible,
  onClose,
  tenant,
  leases,
  units,
  moveInChecklists,
  onSave,
  onImageAction,
  damagePhotos,
  setDamagePhotos,
  getDefaultItems,
  getTenantName,
}: ChecklistModalProps) {
  const tenantLeases = leases.filter(l => l.tenant_renter_id === tenant.id && l.status === 'active');
  const lease = tenantLeases[0];
  const unit = units.find(u => u.id === lease?.unit_id);
  
  const existingChecklist = moveInChecklists.find(c => c.tenant_renter_id === tenant.id && c.unit_id === unit?.id);
  
  const [checklistItems, setChecklistItems] = useState<MoveInChecklistItem[]>(
    existingChecklist?.items || getDefaultItems()
  );
  const [overallCondition, setOverallCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>(
    existingChecklist?.overall_condition || 'good'
  );
  const [notes, setNotes] = useState<string>(existingChecklist?.notes || '');

  const toggleItem = (index: number) => {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    setChecklistItems(updated);
  };

  const updateItemCondition = (index: number, condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged') => {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], condition };
    setChecklistItems(updated);
  };

  const updateItemNotes = (index: number, itemNotes: string) => {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], notes: itemNotes };
    setChecklistItems(updated);
  };

  const handleSaveInternal = () => {
    if (!unit) return;
    onSave(checklistItems, unit.id, overallCondition);
  };

  const removeDamagePhoto = (index: number) => {
    const updated = damagePhotos.filter((_, i) => i !== index);
    setDamagePhotos(updated);
  };

  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MoveInChecklistItem[]>);

  const categoryLabels: Record<string, string> = {
    general: 'General',
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    bedroom: 'Bedroom',
    living: 'Living Room',
    other: 'Other',
  };

  if (!lease || !unit) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Move-In Checklist - ${getTenantName(tenant)}`}
      testID="checklist-modal"
    >
      <ScrollView style={styles.checklistScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.checklistSubtitle}>Unit: {unit.unit_number}</Text>

        <View style={styles.overallConditionSection}>
          <Text style={styles.sectionTitle}>Overall Unit Condition</Text>
          <View style={styles.conditionButtons}>
            {(['excellent', 'good', 'fair', 'poor'] as const).map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.conditionButton,
                  overallCondition === cond && styles.conditionButtonActive,
                ]}
                onPress={() => setOverallCondition(cond)}
              >
                <Text
                  style={[
                    styles.conditionButtonText,
                    overallCondition === cond && styles.conditionButtonTextActive,
                  ]}
                >
                  {cond.charAt(0).toUpperCase() + cond.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.damagePhotosSection}>
          <View style={styles.damageSectionHeader}>
            <Text style={styles.sectionTitle}>Damage Photos</Text>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={() => onImageAction(null)}
            >
              <Camera size={16} color="#007AFF" />
              <Text style={styles.addPhotoText}>Add</Text>
            </TouchableOpacity>
          </View>
          {damagePhotos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {damagePhotos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removeDamagePhoto(index)}
                  >
                    <X size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noPhotosText}>No damage photos added</Text>
          )}
        </View>

        {Object.entries(groupedItems).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{categoryLabels[category] || category}</Text>
            {items.map((item, itemIndex) => {
              const actualIndex = checklistItems.findIndex(i => i.id === item.id);
              return (
                <View key={item.id} style={styles.checklistItem}>
                  <View style={styles.checklistItemHeader}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => toggleItem(actualIndex)}
                    >
                      {item.checked ? (
                        <CheckCircle size={24} color="#34C759" />
                      ) : (
                        <Circle size={24} color="#999" />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.checklistItemName}>{item.name}</Text>
                  </View>

                  <View style={styles.itemConditions}>
                    {(['excellent', 'good', 'fair', 'poor', 'damaged'] as const).map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        style={[
                          styles.itemConditionButton,
                          item.condition === cond && styles.itemConditionButtonActive,
                        ]}
                        onPress={() => updateItemCondition(actualIndex, cond)}
                      >
                        <Text
                          style={[
                            styles.itemConditionText,
                            item.condition === cond && styles.itemConditionTextActive,
                          ]}
                        >
                          {cond.charAt(0).toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Input
                    value={item.notes || ''}
                    onChangeText={(text) => updateItemNotes(actualIndex, text)}
                    placeholder="Add notes about condition..."
                    multiline
                    numberOfLines={2}
                  />
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional observations..."
            multiline
            numberOfLines={4}
          />
        </View>

        <Button
          title="Save Checklist"
          onPress={handleSaveInternal}
          fullWidth
          testID="save-checklist-button"
        />
        <View style={{ height: 20 }} />
      </ScrollView>
    </Modal>
  );
}

interface TenantDetailModalProps {
  visible: boolean;
  onClose: () => void;
  tenant: TenantRenter;
  leases: Lease[];
  units: Unit[];
  properties: any[];
  getTenantName: (tenant: TenantRenter) => string;
}

function TenantDetailModal({
  visible,
  onClose,
  tenant,
  leases,
  units,
  properties,
  getTenantName,
}: TenantDetailModalProps) {
  const tenantLeases = leases.filter(l => l.tenant_renter_id === tenant.id);

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

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={getTenantName(tenant)}
      testID="tenant-detail-modal"
    >
      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Contact Information</Text>
          <View style={styles.detailRow}>
            <Mail size={16} color="#666" />
            <Text style={styles.detailText}>{tenant.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={16} color="#666" />
            <Text style={styles.detailText}>{tenant.phone}</Text>
          </View>
          {tenant.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailText}>{tenant.address}</Text>
            </View>
          )}
          {tenant.island && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Island:</Text>
              <Text style={styles.detailText}>{tenant.island}</Text>
            </View>
          )}
          {tenant.postal_code && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Postal Code:</Text>
              <Text style={styles.detailText}>{tenant.postal_code}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Leases ({tenantLeases.length})</Text>
          {tenantLeases.length === 0 ? (
            <Text style={styles.noDataText}>No leases found</Text>
          ) : (
            tenantLeases.map((lease) => {
              const property = properties.find(p => p.id === lease.property_id);
              const unit = units.find(u => u.id === lease.unit_id);
              
              return (
                <Card key={lease.id} style={styles.leaseCard}>
                  <View style={styles.leaseCardHeader}>
                    <View>
                      <Text style={styles.leasePropertyName}>{property?.name || 'Unknown'}</Text>
                      <Text style={styles.leaseUnitNumber}>Unit {unit?.unit_number || 'N/A'}</Text>
                    </View>
                    <Badge label={lease.status} variant={getStatusVariant(lease.status)} />
                  </View>

                  <View style={styles.leaseDates}>
                    <View style={styles.leaseDateItem}>
                      <Calendar size={14} color="#666" />
                      <Text style={styles.leaseDateText}>{formatDate(lease.start_date)}</Text>
                    </View>
                    <Text style={styles.dateSeparator}>→</Text>
                    <View style={styles.leaseDateItem}>
                      <Calendar size={14} color="#666" />
                      <Text style={styles.leaseDateText}>{formatDate(lease.end_date)}</Text>
                    </View>
                  </View>

                  <View style={styles.leaseRentInfo}>
                    <DollarSign size={16} color="#34C759" />
                    <Text style={styles.leaseRentAmount}>${lease.rent_amount.toLocaleString()}/month</Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>
        
        {tenant.notes && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Notes</Text>
            <Text style={styles.detailNotes}>{tenant.notes}</Text>
          </View>
        )}

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
  tenantCard: {
    marginBottom: 16,
  },
  tenantHeader: {
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
  tenantInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tenantType: {
    fontSize: 12,
    color: '#999',
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
  tenantNotesSection: {
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
  tenantActions: {
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
  typeSelector: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  checklistScroll: {
    maxHeight: 600,
  },
  checklistSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  overallConditionSection: {
    marginBottom: 20,
  },
  conditionButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center' as const,
  },
  conditionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  conditionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  conditionButtonTextActive: {
    color: '#FFFFFF',
  },
  damagePhotosSection: {
    marginBottom: 20,
  },
  damageSectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  addPhotoButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  photoScroll: {
    flexDirection: 'row' as const,
  },
  photoContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  noPhotosText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic' as const,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  checklistItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  checklistItemHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  checklistItemName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  itemConditions: {
    flexDirection: 'row' as const,
    gap: 6,
    marginBottom: 12,
  },
  itemConditionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemConditionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  itemConditionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  itemConditionTextActive: {
    color: '#FFFFFF',
  },
  notesSection: {
    marginBottom: 20,
  },
  cameraContainer: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  camera: {
    flex: 1,
  },
  cameraActions: {
    position: 'absolute' as const,
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  detailScroll: {
    maxHeight: 600,
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  detailText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  detailNotes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  leaseCard: {
    marginBottom: 12,
  },
  leaseCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  leasePropertyName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  leaseUnitNumber: {
    fontSize: 14,
    color: '#666',
  },
  leaseDates: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  leaseDateItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  leaseDateText: {
    fontSize: 14,
    color: '#666',
  },
  dateSeparator: {
    fontSize: 14,
    color: '#999',
  },
  leaseRentInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  leaseRentAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#34C759',
  },
});
