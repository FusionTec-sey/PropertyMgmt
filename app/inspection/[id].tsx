import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Calendar, Clock, MapPin, Home, User, FileText, Edit, CheckCircle, Image as ImageIcon } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { InspectionStatus, InspectionType } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Select from '@/components/Select';
import PhotoGallery from '@/components/PhotoGallery';
import { showPhotoOptions } from '@/components/PhotoPicker';

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { propertyInspections, properties, units, tenantRenters, updatePropertyInspection, deletePropertyInspection } = useApp();
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [findingsModalVisible, setFindingsModalVisible] = useState<boolean>(false);
  
  const inspection = propertyInspections.find(i => i.id === id);

  const [editFormData, setEditFormData] = useState({
    scheduled_date: inspection?.scheduled_date || '',
    scheduled_time: inspection?.scheduled_time || '',
    status: inspection?.status || 'scheduled' as InspectionStatus,
  });

  const [findingsFormData, setFindingsFormData] = useState({
    findings: inspection?.findings || '',
    issues_found: inspection?.issues_found?.join('\n') || '',
    recommendations: inspection?.recommendations || '',
  });

  if (!inspection) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Inspection Not Found' }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Inspection not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const property = properties.find(p => p.id === inspection.property_id);
  const unit = inspection.unit_id ? units.find(u => u.id === inspection.unit_id) : null;
  const tenant = inspection.tenant_renter_id ? tenantRenters.find(t => t.id === inspection.tenant_renter_id) : null;

  const getTenantName = () => {
    if (!tenant) return null;
    if (tenant.type === 'business') return tenant.business_name || 'Unnamed Business';
    return `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusVariant = (status: InspectionStatus): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'rescheduled':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getTypeColor = (type: InspectionType): string => {
    switch (type) {
      case 'move_in':
        return '#34C759';
      case 'move_out':
        return '#FF9500';
      case 'routine':
        return '#007AFF';
      case 'maintenance':
        return '#FF3B30';
      case 'annual':
        return '#5856D6';
      case 'emergency':
        return '#FF2D55';
      default:
        return '#666';
    }
  };

  const handleEdit = () => {
    setEditFormData({
      scheduled_date: inspection.scheduled_date,
      scheduled_time: inspection.scheduled_time || '',
      status: inspection.status,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    await updatePropertyInspection(inspection.id, {
      scheduled_date: editFormData.scheduled_date,
      scheduled_time: editFormData.scheduled_time || undefined,
      status: editFormData.status,
    });
    setEditModalVisible(false);
  };

  const handleSaveFindings = async () => {
    const issuesArray = findingsFormData.issues_found
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    await updatePropertyInspection(inspection.id, {
      findings: findingsFormData.findings || undefined,
      issues_found: issuesArray.length > 0 ? issuesArray : undefined,
      recommendations: findingsFormData.recommendations || undefined,
      completed_date: inspection.status === 'completed' ? (inspection.completed_date || new Date().toISOString()) : undefined,
    });
    setFindingsModalVisible(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Inspection',
      'Are you sure you want to delete this inspection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePropertyInspection(inspection.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleCompleteInspection = () => {
    Alert.alert(
      'Complete Inspection',
      'Mark this inspection as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            await updatePropertyInspection(inspection.id, {
              status: 'completed',
              completed_date: new Date().toISOString(),
            });
          },
        },
      ]
    );
  };

  const handleCancelInspection = () => {
    Alert.alert(
      'Cancel Inspection',
      'Mark this inspection as cancelled?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            await updatePropertyInspection(inspection.id, {
              status: 'cancelled',
            });
          },
        },
      ]
    );
  };

  const handleAddPhoto = () => {
    showPhotoOptions((uri: string) => {
      const currentPhotos = inspection.images || [];
      updatePropertyInspection(inspection.id, {
        images: [...currentPhotos, uri],
      });
    });
  };

  const handleDeletePhoto = (index: number) => {
    const currentPhotos = inspection.images || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
    updatePropertyInspection(inspection.id, {
      images: updatedPhotos,
    });
  };

  const statusOptions = [
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Rescheduled', value: 'rescheduled' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `${inspection.inspection_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Inspection`,
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(inspection.inspection_type) }]} />
            <View style={styles.headerInfo}>
              <Text style={styles.inspectionTitle}>
                {inspection.inspection_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Inspection
              </Text>
              <Badge label={inspection.status} variant={getStatusVariant(inspection.status)} />
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <MapPin size={18} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Property</Text>
                <Text style={styles.infoValue}>{property?.name || 'Unknown'}</Text>
              </View>
            </View>

            {unit && (
              <View style={styles.infoRow}>
                <Home size={18} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Unit</Text>
                  <Text style={styles.infoValue}>Unit {unit.unit_number}</Text>
                </View>
              </View>
            )}

            {tenant && (
              <View style={styles.infoRow}>
                <User size={18} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tenant</Text>
                  <Text style={styles.infoValue}>{getTenantName()}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Calendar size={18} color="#007AFF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Scheduled Date</Text>
                <Text style={styles.infoValue}>{formatDate(inspection.scheduled_date)}</Text>
              </View>
            </View>

            {inspection.scheduled_time && (
              <View style={styles.infoRow}>
                <Clock size={18} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>{inspection.scheduled_time}</Text>
                </View>
              </View>
            )}

            {inspection.completed_date && (
              <View style={styles.infoRow}>
                <CheckCircle size={18} color="#34C759" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Completed Date</Text>
                  <Text style={styles.infoValue}>{formatDate(inspection.completed_date)}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {inspection.findings || inspection.issues_found || inspection.recommendations ? (
          <Card>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Findings & Recommendations</Text>
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={() => {
                  setFindingsFormData({
                    findings: inspection.findings || '',
                    issues_found: inspection.issues_found?.join('\n') || '',
                    recommendations: inspection.recommendations || '',
                  });
                  setFindingsModalVisible(true);
                }}
              >
                <Edit size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {inspection.findings && (
              <View style={styles.findingsSection}>
                <Text style={styles.findingsLabel}>General Findings</Text>
                <Text style={styles.findingsText}>{inspection.findings}</Text>
              </View>
            )}

            {inspection.issues_found && inspection.issues_found.length > 0 && (
              <View style={styles.findingsSection}>
                <Text style={styles.findingsLabel}>Issues Found</Text>
                {inspection.issues_found.map((issue, index) => (
                  <View key={index} style={styles.issueItem}>
                    <Text style={styles.issueBullet}>•</Text>
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {inspection.recommendations && (
              <View style={styles.findingsSection}>
                <Text style={styles.findingsLabel}>Recommendations</Text>
                <Text style={styles.findingsText}>{inspection.recommendations}</Text>
              </View>
            )}
          </Card>
        ) : (
          <Card>
            <View style={styles.emptyFindings}>
              <FileText size={32} color="#999" />
              <Text style={styles.emptyFindingsText}>No findings recorded yet</Text>
              <Button
                title="Add Findings"
                onPress={() => {
                  setFindingsFormData({
                    findings: '',
                    issues_found: '',
                    recommendations: '',
                  });
                  setFindingsModalVisible(true);
                }}
              />
            </View>
          </Card>
        )}

        <Card>
          <View style={styles.sectionHeader}>
            <ImageIcon size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Photos ({inspection.images?.length || 0})</Text>
          </View>
          <PhotoGallery
            photos={inspection.images || []}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
            editable
            maxPhotos={20}
            testID="inspection-photos"
          />
        </Card>

        <View style={styles.actionsSection}>
          {inspection.status === 'scheduled' && (
            <>
              <Button
                title="Complete Inspection"
                onPress={handleCompleteInspection}
                fullWidth
                variant="primary"
                testID="complete-button"
              />
              <Button
                title="Cancel Inspection"
                onPress={handleCancelInspection}
                fullWidth
                variant="outline"
                testID="cancel-button"
              />
            </>
          )}
          <Button
            title="Edit Inspection"
            onPress={handleEdit}
            fullWidth
            variant="outline"
            testID="edit-button"
          />
          <Button
            title="Delete Inspection"
            onPress={handleDelete}
            fullWidth
            variant="outline"
            testID="delete-button"
          />
        </View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title="Edit Inspection"
        testID="edit-modal"
      >
        <Input
          label="Scheduled Date"
          value={editFormData.scheduled_date}
          onChangeText={text => setEditFormData({ ...editFormData, scheduled_date: text })}
          placeholder="YYYY-MM-DD"
          required
          testID="edit-date-input"
        />
        <Input
          label="Scheduled Time (Optional)"
          value={editFormData.scheduled_time}
          onChangeText={text => setEditFormData({ ...editFormData, scheduled_time: text })}
          placeholder="10:00 AM"
          testID="edit-time-input"
        />
        <Select
          label="Status"
          options={statusOptions}
          value={editFormData.status}
          onValueChange={value => setEditFormData({ ...editFormData, status: value as InspectionStatus })}
          testID="edit-status-select"
        />
        <Button
          title="Save Changes"
          onPress={handleSaveEdit}
          fullWidth
          testID="save-edit-button"
        />
      </Modal>

      <Modal
        visible={findingsModalVisible}
        onClose={() => setFindingsModalVisible(false)}
        title="Findings & Recommendations"
        testID="findings-modal"
      >
        <Input
          label="General Findings"
          value={findingsFormData.findings}
          onChangeText={text => setFindingsFormData({ ...findingsFormData, findings: text })}
          placeholder="Overall condition and observations"
          multiline
          numberOfLines={4}
          testID="findings-input"
        />
        <Input
          label="Issues Found (one per line)"
          value={findingsFormData.issues_found}
          onChangeText={text => setFindingsFormData({ ...findingsFormData, issues_found: text })}
          placeholder="List any issues found"
          multiline
          numberOfLines={4}
          testID="issues-input"
        />
        <Input
          label="Recommendations"
          value={findingsFormData.recommendations}
          onChangeText={text => setFindingsFormData({ ...findingsFormData, recommendations: text })}
          placeholder="Suggested actions or repairs"
          multiline
          numberOfLines={4}
          testID="recommendations-input"
        />
        <Button
          title="Save Findings"
          onPress={handleSaveFindings}
          fullWidth
          testID="save-findings-button"
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
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  typeIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  inspectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  editIconButton: {
    padding: 4,
  },
  findingsSection: {
    marginBottom: 16,
  },
  findingsLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  findingsText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  issueItem: {
    flexDirection: 'row' as const,
    marginBottom: 6,
  },
  issueBullet: {
    fontSize: 15,
    color: '#FF3B30',
    marginRight: 8,
    fontWeight: '700' as const,
  },
  issueText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  emptyFindings: {
    alignItems: 'center' as const,
    padding: 24,
  },
  emptyFindingsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  actionsSection: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
});
