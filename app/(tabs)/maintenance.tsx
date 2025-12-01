import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Plus, Wrench, Calendar, AlertCircle } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { MaintenanceRequest, MaintenanceSchedule } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import EmptyState from '@/components/EmptyState';


type Tab = 'requests' | 'schedules';

export default function MaintenanceScreen() {
  const { 
    maintenanceRequests, 
    maintenanceSchedules,
    properties, 
    units, 
    tenantRenters, 
    addMaintenanceRequest, 
    updateMaintenanceRequest,
    addMaintenanceSchedule,
    updateMaintenanceSchedule,
    deleteMaintenanceSchedule
  } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [requestModalVisible, setRequestModalVisible] = useState<boolean>(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState<boolean>(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);

  const [requestFormData, setRequestFormData] = useState({
    property_id: '',
    unit_id: '',
    tenant_renter_id: '',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: '',
    scheduled_date: '',
    notes: '',
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    property_id: '',
    unit_id: '',
    asset_name: '',
    asset_type: 'hvac' as 'hvac' | 'plumbing' | 'electrical' | 'appliance' | 'structure' | 'other',
    task_description: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual',
    next_service_date: '',
    service_provider: '',
    estimated_cost: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    reminder_days_before: '7',
    notes: '',
  });

  const resetRequestForm = () => {
    setRequestFormData({
      property_id: '',
      unit_id: '',
      tenant_renter_id: '',
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      scheduled_date: '',
      notes: '',
    });
    setEditingRequest(null);
  };

  const resetScheduleForm = () => {
    setScheduleFormData({
      property_id: '',
      unit_id: '',
      asset_name: '',
      asset_type: 'hvac',
      task_description: '',
      frequency: 'monthly',
      next_service_date: '',
      service_provider: '',
      estimated_cost: '',
      priority: 'medium',
      reminder_days_before: '7',
      notes: '',
    });
    setEditingSchedule(null);
  };

  const handleAddRequest = () => {
    resetRequestForm();
    setRequestModalVisible(true);
  };

  const handleAddSchedule = () => {
    resetScheduleForm();
    setScheduleModalVisible(true);
  };

  const handleEditRequest = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    setRequestFormData({
      property_id: request.property_id,
      unit_id: request.unit_id || '',
      tenant_renter_id: request.tenant_renter_id || '',
      title: request.title,
      description: request.description,
      priority: request.priority,
      category: request.category || '',
      scheduled_date: request.scheduled_date || '',
      notes: request.notes || '',
    });
    setRequestModalVisible(true);
  };

  const handleEditSchedule = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule);
    setScheduleFormData({
      property_id: schedule.property_id,
      unit_id: schedule.unit_id || '',
      asset_name: schedule.asset_name,
      asset_type: schedule.asset_type,
      task_description: schedule.task_description,
      frequency: schedule.frequency,
      next_service_date: schedule.next_service_date,
      service_provider: schedule.service_provider || '',
      estimated_cost: schedule.estimated_cost?.toString() || '',
      priority: schedule.priority,
      reminder_days_before: schedule.reminder_days_before?.toString() || '7',
      notes: schedule.notes || '',
    });
    setScheduleModalVisible(true);
  };

  const handleSaveRequest = async () => {
    if (!requestFormData.property_id || !requestFormData.title || !requestFormData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const data: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> = {
      property_id: requestFormData.property_id,
      unit_id: requestFormData.unit_id || undefined,
      tenant_renter_id: requestFormData.tenant_renter_id || undefined,
      title: requestFormData.title,
      description: requestFormData.description,
      priority: requestFormData.priority,
      status: 'open' as const,
      category: requestFormData.category || undefined,
      reported_date: new Date().toISOString(),
      scheduled_date: requestFormData.scheduled_date || undefined,
      notes: requestFormData.notes || undefined,
    };

    if (editingRequest) {
      await updateMaintenanceRequest(editingRequest.id, data);
    } else {
      await addMaintenanceRequest(data);
    }

    setRequestModalVisible(false);
    resetRequestForm();
  };

  const handleSaveSchedule = async () => {
    if (!scheduleFormData.property_id || !scheduleFormData.asset_name || !scheduleFormData.task_description || !scheduleFormData.next_service_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const data = {
      property_id: scheduleFormData.property_id,
      unit_id: scheduleFormData.unit_id || undefined,
      asset_name: scheduleFormData.asset_name,
      asset_type: scheduleFormData.asset_type,
      task_description: scheduleFormData.task_description,
      frequency: scheduleFormData.frequency,
      next_service_date: scheduleFormData.next_service_date,
      service_provider: scheduleFormData.service_provider || undefined,
      estimated_cost: scheduleFormData.estimated_cost ? parseFloat(scheduleFormData.estimated_cost) : undefined,
      priority: scheduleFormData.priority,
      is_active: true,
      reminder_days_before: scheduleFormData.reminder_days_before ? parseInt(scheduleFormData.reminder_days_before) : undefined,
      notes: scheduleFormData.notes || undefined,
    };

    if (editingSchedule) {
      await updateMaintenanceSchedule(editingSchedule.id, data);
    } else {
      await addMaintenanceSchedule(data);
    }

    setScheduleModalVisible(false);
    resetScheduleForm();
  };

  const handleDeleteSchedule = async (id: string) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this maintenance schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteMaintenanceSchedule(id);
          }
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#FF9500';
      case 'in_progress': return '#007AFF';
      case 'resolved': return '#34C759';
      case 'cancelled': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const renderRequest = ({ item }: { item: MaintenanceRequest }) => {
    const property = properties.find(p => p.id === item.property_id);
    const unit = item.unit_id ? units.find(u => u.id === item.unit_id) : null;
    const tenantRenter = item.tenant_renter_id ? tenantRenters.find(r => r.id === item.tenant_renter_id) : null;

    return (
      <Card style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.requestTitle}>{item.title}</Text>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.badgeText}>{item.priority}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.requestDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Property: </Text>
          <Text style={styles.detailValue}>{property?.name || 'Unknown'}</Text>
        </View>

        {unit && (
          <View style={styles.requestDetails}>
            <Text style={styles.detailLabel}>Unit: </Text>
            <Text style={styles.detailValue}>{unit.unit_number}</Text>
          </View>
        )}

        {tenantRenter && (
          <View style={styles.requestDetails}>
            <Text style={styles.detailLabel}>Reported by: </Text>
            <Text style={styles.detailValue}>{tenantRenter.type === 'business' ? tenantRenter.business_name : `${tenantRenter.first_name} ${tenantRenter.last_name}`}</Text>
          </View>
        )}

        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Reported: </Text>
          <Text style={styles.detailValue}>{new Date(item.reported_date).toLocaleDateString()}</Text>
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditRequest(item)}
            testID={`edit-request-${item.id}`}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, item.status !== 'resolved' && styles.resolveButton]}
            onPress={async () => {
              await updateMaintenanceRequest(item.id, {
                status: item.status === 'resolved' ? 'open' : 'resolved',
                completed_date: item.status === 'resolved' ? undefined : new Date().toISOString(),
              });
            }}
            testID={`toggle-status-${item.id}`}
          >
            <Text style={[styles.actionText, item.status !== 'resolved' && styles.resolveText]}>
              {item.status === 'resolved' ? 'Reopen' : 'Resolve'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderSchedule = ({ item }: { item: MaintenanceSchedule }) => {
    const property = properties.find(p => p.id === item.property_id);
    const unit = item.unit_id ? units.find(u => u.id === item.unit_id) : null;
    const nextServiceDate = new Date(item.next_service_date);
    const today = new Date();
    const daysUntilService = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilService < 0;
    const isDueSoon = daysUntilService >= 0 && daysUntilService <= 7;

    return (
      <Card style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <View style={styles.iconContainer}>
            <Wrench size={20} color="#007AFF" />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleAsset}>{item.asset_name}</Text>
            <Text style={styles.scheduleType}>{item.asset_type.toUpperCase()}</Text>
          </View>
          {isOverdue && (
            <AlertCircle size={20} color="#FF3B30" />
          )}
        </View>

        <Text style={styles.scheduleTask} numberOfLines={2}>
          {item.task_description}
        </Text>

        <View style={styles.scheduleDetails}>
          <Text style={styles.detailLabel}>Property: </Text>
          <Text style={styles.detailValue}>{property?.name || 'Unknown'}</Text>
        </View>

        {unit && (
          <View style={styles.scheduleDetails}>
            <Text style={styles.detailLabel}>Unit: </Text>
            <Text style={styles.detailValue}>{unit.unit_number}</Text>
          </View>
        )}

        <View style={styles.scheduleDetails}>
          <Text style={styles.detailLabel}>Frequency: </Text>
          <Text style={styles.detailValue}>{item.frequency}</Text>
        </View>

        <View style={styles.scheduleDetails}>
          <Text style={styles.detailLabel}>Next Service: </Text>
          <Text style={[
            styles.detailValue,
            isOverdue && styles.overdueText,
            isDueSoon && styles.dueSoonText
          ]}>
            {nextServiceDate.toLocaleDateString()} 
            {isOverdue && ` (${Math.abs(daysUntilService)} days overdue)`}
            {isDueSoon && !isOverdue && ` (in ${daysUntilService} days)`}
          </Text>
        </View>

        {item.service_provider && (
          <View style={styles.scheduleDetails}>
            <Text style={styles.detailLabel}>Provider: </Text>
            <Text style={styles.detailValue}>{item.service_provider}</Text>
          </View>
        )}

        {item.estimated_cost && (
          <View style={styles.scheduleDetails}>
            <Text style={styles.detailLabel}>Est. Cost: </Text>
            <Text style={styles.detailValue}>${item.estimated_cost.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.scheduleActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditSchedule(item)}
            testID={`edit-schedule-${item.id}`}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteSchedule(item.id)}
            testID={`delete-schedule-${item.id}`}
          >
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
            testID="tab-requests"
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests ({maintenanceRequests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'schedules' && styles.activeTab]}
            onPress={() => setActiveTab('schedules')}
            testID="tab-schedules"
          >
            <Text style={[styles.tabText, activeTab === 'schedules' && styles.activeTabText]}>
              Schedules ({maintenanceSchedules.length})
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={activeTab === 'requests' ? handleAddRequest : handleAddSchedule}
          testID={`add-${activeTab}-button`}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {activeTab === 'requests' ? (
        maintenanceRequests.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No Maintenance Requests"
            message="Start by adding maintenance issues reported by tenants"
            actionLabel="Add Request"
            onAction={handleAddRequest}
            testID="requests-empty"
          />
        ) : (
          <FlatList
            data={maintenanceRequests}
            renderItem={renderRequest}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        maintenanceSchedules.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Maintenance Schedules"
            message="Create scheduled maintenance for assets like AC, plumbing, etc."
            actionLabel="Add Schedule"
            onAction={handleAddSchedule}
            testID="schedules-empty"
          />
        ) : (
          <FlatList
            data={maintenanceSchedules}
            renderItem={renderSchedule}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      <Modal
        visible={requestModalVisible}
        onClose={() => {
          setRequestModalVisible(false);
          resetRequestForm();
        }}
        title={editingRequest ? 'Edit Maintenance Request' : 'New Maintenance Request'}
        testID="request-modal"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Input
            label="Property"
            value={requestFormData.property_id}
            onChangeText={text => setRequestFormData({ ...requestFormData, property_id: text })}
            placeholder="Select property ID"
            required
            testID="request-property-input"
          />

          <Input
            label="Unit (Optional)"
            value={requestFormData.unit_id}
            onChangeText={text => setRequestFormData({ ...requestFormData, unit_id: text })}
            placeholder="Unit ID"
            testID="request-unit-input"
          />

          <Input
            label="Tenant (Optional)"
            value={requestFormData.tenant_renter_id}
            onChangeText={text => setRequestFormData({ ...requestFormData, tenant_renter_id: text })}
            placeholder="Tenant ID"
            testID="request-tenant-input"
          />

          <Input
            label="Title"
            value={requestFormData.title}
            onChangeText={text => setRequestFormData({ ...requestFormData, title: text })}
            placeholder="e.g., Leaking faucet"
            required
            testID="request-title-input"
          />

          <Input
            label="Description"
            value={requestFormData.description}
            onChangeText={text => setRequestFormData({ ...requestFormData, description: text })}
            placeholder="Detailed description of the issue"
            multiline
            numberOfLines={3}
            required
            testID="request-description-input"
          />

          <Input
            label="Category"
            value={requestFormData.category}
            onChangeText={text => setRequestFormData({ ...requestFormData, category: text })}
            placeholder="e.g., Plumbing, Electrical"
            testID="request-category-input"
          />

          <Input
            label="Scheduled Date (YYYY-MM-DD)"
            value={requestFormData.scheduled_date}
            onChangeText={text => setRequestFormData({ ...requestFormData, scheduled_date: text })}
            placeholder="2025-12-25"
            testID="request-scheduled-input"
          />

          <Input
            label="Notes"
            value={requestFormData.notes}
            onChangeText={text => setRequestFormData({ ...requestFormData, notes: text })}
            placeholder="Additional notes"
            multiline
            numberOfLines={2}
            testID="request-notes-input"
          />

          <Button
            title={editingRequest ? 'Update Request' : 'Add Request'}
            onPress={handleSaveRequest}
            fullWidth
            testID="save-request-button"
          />
        </ScrollView>
      </Modal>

      <Modal
        visible={scheduleModalVisible}
        onClose={() => {
          setScheduleModalVisible(false);
          resetScheduleForm();
        }}
        title={editingSchedule ? 'Edit Maintenance Schedule' : 'New Maintenance Schedule'}
        testID="schedule-modal"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Input
            label="Property"
            value={scheduleFormData.property_id}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, property_id: text })}
            placeholder="Property ID"
            required
            testID="schedule-property-input"
          />

          <Input
            label="Unit (Optional)"
            value={scheduleFormData.unit_id}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, unit_id: text })}
            placeholder="Unit ID"
            testID="schedule-unit-input"
          />

          <Input
            label="Asset Name"
            value={scheduleFormData.asset_name}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, asset_name: text })}
            placeholder="e.g., Central AC Unit #1"
            required
            testID="schedule-asset-input"
          />

          <Input
            label="Task Description"
            value={scheduleFormData.task_description}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, task_description: text })}
            placeholder="e.g., Filter replacement and system check"
            multiline
            numberOfLines={2}
            required
            testID="schedule-task-input"
          />

          <Input
            label="Frequency"
            value={scheduleFormData.frequency}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, frequency: text as any })}
            placeholder="monthly, quarterly, annual"
            testID="schedule-frequency-input"
          />

          <Input
            label="Next Service Date (YYYY-MM-DD)"
            value={scheduleFormData.next_service_date}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, next_service_date: text })}
            placeholder="2025-12-25"
            required
            testID="schedule-next-date-input"
          />

          <Input
            label="Service Provider"
            value={scheduleFormData.service_provider}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, service_provider: text })}
            placeholder="Company name"
            testID="schedule-provider-input"
          />

          <Input
            label="Estimated Cost"
            value={scheduleFormData.estimated_cost}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, estimated_cost: text })}
            placeholder="0.00"
            keyboardType="decimal-pad"
            testID="schedule-cost-input"
          />

          <Input
            label="Reminder (days before)"
            value={scheduleFormData.reminder_days_before}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, reminder_days_before: text })}
            placeholder="7"
            keyboardType="number-pad"
            testID="schedule-reminder-input"
          />

          <Input
            label="Notes"
            value={scheduleFormData.notes}
            onChangeText={text => setScheduleFormData({ ...scheduleFormData, notes: text })}
            placeholder="Additional notes"
            multiline
            numberOfLines={2}
            testID="schedule-notes-input"
          />

          <Button
            title={editingSchedule ? 'Update Schedule' : 'Add Schedule'}
            onPress={handleSaveSchedule}
            fullWidth
            testID="save-schedule-button"
          />
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
  tabContainer: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#FFFFFF',
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
  requestCard: {
    marginBottom: 16,
  },
  requestHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textTransform: 'capitalize' as const,
  },
  requestDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  requestDetails: {
    flexDirection: 'row' as const,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '600' as const,
  },
  dueSoonText: {
    color: '#FF9500',
    fontWeight: '600' as const,
  },
  requestActions: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center' as const,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  resolveButton: {
    backgroundColor: '#34C759',
  },
  resolveText: {
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteText: {
    color: '#FFFFFF',
  },
  scheduleCard: {
    marginBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleAsset: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  scheduleType: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  scheduleTask: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  scheduleDetails: {
    flexDirection: 'row' as const,
    marginBottom: 4,
  },
  scheduleActions: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 12,
  },
});
