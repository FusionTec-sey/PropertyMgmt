import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { Plus, Wrench, Calendar, AlertCircle, Building2, ChevronRight, ChevronDown, User } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { MaintenanceRequest, MaintenanceSchedule, Property, Unit } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Select from '@/components/Select';
import EmptyState from '@/components/EmptyState';
import { PhotoPicker } from '@/components/PhotoPicker';
import PhotoGallery from '@/components/PhotoGallery';



type Tab = 'requests' | 'schedules';

export default function MaintenanceScreen() {
  const { 
    maintenanceRequests, 
    maintenanceSchedules,
    properties, 
    units, 
    tenantRenters, 
    leases,
    addMaintenanceRequest, 
    updateMaintenanceRequest,
    addMaintenanceSchedule,
    updateMaintenanceSchedule,
    deleteMaintenanceSchedule
  } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());
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
    images: [] as string[],
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
      images: [],
    });
    setEditingRequest(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
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
      images: request.images || [],
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
      images: requestFormData.images.length > 0 ? requestFormData.images : undefined,
    };

    if (editingRequest) {
      await updateMaintenanceRequest(editingRequest.id, data);
      Alert.alert('Success', 'Maintenance request updated');
    } else {
      await addMaintenanceRequest(data);
      Alert.alert('Success', 'Maintenance request created');
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
      Alert.alert('Success', 'Maintenance schedule updated');
    } else {
      await addMaintenanceSchedule(data);
      Alert.alert('Success', 'Maintenance schedule created');
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

  const togglePropertyExpanded = (propertyId: string) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
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

  const getTenantName = (tenantRenterId: string) => {
    const tenant = tenantRenters.find(t => t.id === tenantRenterId);
    if (!tenant) return 'Unknown';
    if (tenant.type === 'business') return tenant.business_name || 'Unnamed Business';
    return `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed';
  };

  const renderRequestInUnit = (request: MaintenanceRequest, unit: Unit | null) => {
    const tenantRenter = request.tenant_renter_id ? tenantRenters.find(r => r.id === request.tenant_renter_id) : null;
    const activeLease = leases.find(l => l.unit_id === unit?.id && l.status === 'active');
    const affectedTenant = activeLease ? tenantRenters.find(t => t.id === activeLease.tenant_renter_id) : null;

    return (
      <Card key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.requestTitle}>{request.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
              <Text style={styles.badgeText}>{request.priority}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.badgeText}>{request.status}</Text>
          </View>
        </View>

        <Text style={styles.requestDescription} numberOfLines={2}>
          {request.description}
        </Text>

        {request.images && request.images.length > 0 && (
          <View style={styles.photoGalleryContainer}>
            <PhotoGallery
              photos={request.images}
              testID={`request-gallery-${request.id}`}
            />
          </View>
        )}

        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Reported: </Text>
          <Text style={styles.detailValue}>{new Date(request.reported_date).toLocaleDateString()}</Text>
        </View>

        {tenantRenter && (
          <View style={styles.requestDetails}>
            <Text style={styles.detailLabel}>Reported by: </Text>
            <Text style={styles.detailValue}>{getTenantName(tenantRenter.id)}</Text>
          </View>
        )}

        {affectedTenant && (
          <View style={styles.affectedTenantBanner}>
            <User size={16} color="#FF9500" />
            <View>
              <Text style={styles.affectedTenantLabel}>Affected Tenant</Text>
              <Text style={styles.affectedTenantName}>{getTenantName(affectedTenant.id)}</Text>
              {affectedTenant.phone && (
                <Text style={styles.affectedTenantContact}>{affectedTenant.phone}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditRequest(request)}
            testID={`edit-request-${request.id}`}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, request.status !== 'resolved' && styles.resolveButton]}
            onPress={() => {
              Alert.alert(
                request.status === 'resolved' ? 'Reopen Request' : 'Resolve Request',
                request.status === 'resolved' 
                  ? 'Are you sure you want to reopen this maintenance request?'
                  : 'Mark this maintenance request as resolved?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: request.status === 'resolved' ? 'Reopen' : 'Resolve',
                    onPress: async () => {
                      await updateMaintenanceRequest(request.id, {
                        status: request.status === 'resolved' ? 'open' : 'resolved',
                        completed_date: request.status === 'resolved' ? undefined : new Date().toISOString(),
                      });
                      Alert.alert('Success', `Request ${request.status === 'resolved' ? 'reopened' : 'resolved'} successfully`);
                    }
                  },
                ]
              );
            }}
            testID={`toggle-status-${request.id}`}
          >
            <Text style={[styles.actionText, request.status !== 'resolved' && styles.resolveText]}>
              {request.status === 'resolved' ? 'Reopen' : 'Resolve'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderPropertySection = (property: Property) => {
    const propertyUnits = units.filter(u => u.property_id === property.id);
    const propertyRequests = maintenanceRequests.filter(r => r.property_id === property.id);
    const isExpanded = expandedProperties.has(property.id);

    return (
      <Card key={property.id} style={styles.propertyCard}>
        <TouchableOpacity
          onPress={() => togglePropertyExpanded(property.id)}
          testID={`toggle-property-${property.id}`}
        >
          <View style={styles.propertyHeader}>
            <View style={styles.propertyIconContainer}>
              <Building2 size={20} color="#007AFF" />
            </View>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>{property.name}</Text>
              <Text style={styles.propertyStats}>
                {propertyRequests.length} request{propertyRequests.length !== 1 ? 's' : ''} • {propertyUnits.length} unit{propertyUnits.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {isExpanded ? (
              <ChevronDown size={24} color="#666" />
            ) : (
              <ChevronRight size={24} color="#666" />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedSection}>
            {propertyUnits.length === 0 ? (
              <Text style={styles.noUnitsText}>No units in this property</Text>
            ) : (
              propertyUnits.map(unit => {
                const unitRequests = propertyRequests.filter(r => r.unit_id === unit.id);
                const activeLease = leases.find(l => l.unit_id === unit.id && l.status === 'active');
                const tenant = activeLease ? tenantRenters.find(t => t.id === activeLease.tenant_renter_id) : null;

                return (
                  <View key={unit.id} style={styles.unitSection}>
                    <View style={styles.unitHeader}>
                      <View>
                        <Text style={styles.unitNumber}>Unit {unit.unit_number}</Text>
                        {tenant && (
                          <Text style={styles.unitTenant}>Tenant: {getTenantName(tenant.id)}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.addRequestButton}
                        onPress={() => {
                          setRequestFormData({
                            ...requestFormData,
                            property_id: property.id,
                            unit_id: unit.id,
                          });
                          setRequestModalVisible(true);
                        }}
                        testID={`add-request-unit-${unit.id}`}
                      >
                        <Plus size={16} color="#FFFFFF" />
                        <Text style={styles.addRequestButtonText}>Add Request</Text>
                      </TouchableOpacity>
                    </View>

                    {unitRequests.length === 0 ? (
                      <Text style={styles.noRequestsText}>No maintenance requests</Text>
                    ) : (
                      unitRequests.map(request => renderRequestInUnit(request, unit))
                    )}
                  </View>
                );
              })
            )}

            {/* Property-level requests (no specific unit) */}
            {propertyRequests.filter(r => !r.unit_id).length > 0 && (
              <View style={styles.unitSection}>
                <View style={styles.unitHeader}>
                  <Text style={styles.unitNumber}>Property-wide</Text>
                </View>
                {propertyRequests.filter(r => !r.unit_id).map(request => renderRequestInUnit(request, null))}
              </View>
            )}
          </View>
        )}
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
            <Text style={styles.detailValue}>₨{item.estimated_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SCR</Text>
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
        properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Properties"
            message="Add properties first to manage maintenance requests"
            actionLabel="Go to Properties"
            onAction={() => {}}
            testID="properties-empty"
          />
        ) : maintenanceRequests.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No Maintenance Requests"
            message="Start by adding maintenance issues for your properties"
            actionLabel="Add Request"
            onAction={handleAddRequest}
            testID="requests-empty"
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#007AFF"
              />
            }
          >
            {properties.map(property => renderPropertySection(property))}
          </ScrollView>
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#007AFF"
              />
            }
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
          <Select
            label="Property"
            value={requestFormData.property_id}
            options={properties.map(p => ({ label: p.name, value: p.id }))}
            onValueChange={value => {
              setRequestFormData({ ...requestFormData, property_id: value, unit_id: '' });
            }}
            placeholder="Select a property"
            required
            testID="request-property-select"
          />

          <Select
            label="Unit (Optional)"
            value={requestFormData.unit_id}
            options={[
              { label: 'Property-wide (no specific unit)', value: '' },
              ...units
                .filter(u => u.property_id === requestFormData.property_id)
                .map(u => ({ label: `Unit ${u.unit_number}`, value: u.id }))
            ]}
            onValueChange={value => setRequestFormData({ ...requestFormData, unit_id: value })}
            placeholder="Select a unit"
            disabled={!requestFormData.property_id}
            testID="request-unit-select"
          />

          <Select
            label="Tenant (Optional)"
            value={requestFormData.tenant_renter_id}
            options={[
              { label: 'None', value: '' },
              ...tenantRenters.map(t => {
                const name = t.type === 'business' 
                  ? t.business_name || 'Unnamed Business'
                  : `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Unnamed';
                return { label: name, value: t.id };
              })
            ]}
            onValueChange={value => setRequestFormData({ ...requestFormData, tenant_renter_id: value })}
            placeholder="Select a tenant"
            testID="request-tenant-select"
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

          <Select
            label="Category"
            value={requestFormData.category}
            options={[
              { label: 'None', value: '' },
              { label: 'Plumbing', value: 'Plumbing' },
              { label: 'Electrical', value: 'Electrical' },
              { label: 'HVAC', value: 'HVAC' },
              { label: 'Appliance', value: 'Appliance' },
              { label: 'Structural', value: 'Structural' },
              { label: 'Painting', value: 'Painting' },
              { label: 'Flooring', value: 'Flooring' },
              { label: 'Pest Control', value: 'Pest Control' },
              { label: 'Other', value: 'Other' },
            ]}
            onValueChange={value => setRequestFormData({ ...requestFormData, category: value })}
            placeholder="Select a category"
            testID="request-category-select"
          />

          <Select
            label="Priority"
            value={requestFormData.priority}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]}
            onValueChange={value => setRequestFormData({ ...requestFormData, priority: value as any })}
            placeholder="Select priority"
            testID="request-priority-select"
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

          <View style={styles.photoPickerContainer}>
            <Text style={styles.photoPickerLabel}>Photos</Text>
            <PhotoPicker
              photos={requestFormData.images}
              onPhotosChange={(photos) => setRequestFormData({ ...requestFormData, images: photos })}
              maxPhotos={10}
            />
          </View>

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
          <Select
            label="Property"
            value={scheduleFormData.property_id}
            options={properties.map(p => ({ label: p.name, value: p.id }))}
            onValueChange={value => {
              setScheduleFormData({ ...scheduleFormData, property_id: value, unit_id: '' });
            }}
            placeholder="Select a property"
            required
            testID="schedule-property-select"
          />

          <Select
            label="Unit (Optional)"
            value={scheduleFormData.unit_id}
            options={[
              { label: 'Property-wide (no specific unit)', value: '' },
              ...units
                .filter(u => u.property_id === scheduleFormData.property_id)
                .map(u => ({ label: `Unit ${u.unit_number}`, value: u.id }))
            ]}
            onValueChange={value => setScheduleFormData({ ...scheduleFormData, unit_id: value })}
            placeholder="Select a unit"
            disabled={!scheduleFormData.property_id}
            testID="schedule-unit-select"
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

          <Select
            label="Asset Type"
            value={scheduleFormData.asset_type}
            options={[
              { label: 'HVAC', value: 'hvac' },
              { label: 'Plumbing', value: 'plumbing' },
              { label: 'Electrical', value: 'electrical' },
              { label: 'Appliance', value: 'appliance' },
              { label: 'Structure', value: 'structure' },
              { label: 'Other', value: 'other' },
            ]}
            onValueChange={value => setScheduleFormData({ ...scheduleFormData, asset_type: value as any })}
            placeholder="Select asset type"
            testID="schedule-asset-type-select"
          />

          <Select
            label="Frequency"
            value={scheduleFormData.frequency}
            options={[
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Quarterly', value: 'quarterly' },
              { label: 'Semi-Annual', value: 'semi-annual' },
              { label: 'Annual', value: 'annual' },
            ]}
            onValueChange={value => setScheduleFormData({ ...scheduleFormData, frequency: value as any })}
            placeholder="Select frequency"
            testID="schedule-frequency-select"
          />

          <Select
            label="Priority"
            value={scheduleFormData.priority}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
            ]}
            onValueChange={value => setScheduleFormData({ ...scheduleFormData, priority: value as any })}
            placeholder="Select priority"
            testID="schedule-priority-select"
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
  priorityBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadge: {
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
  photoGalleryContainer: {
    marginBottom: 12,
  },
  photoPickerContainer: {
    marginBottom: 16,
  },
  photoPickerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  propertyCard: {
    marginBottom: 12,
  },
  propertyHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  propertyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  propertyStats: {
    fontSize: 14,
    color: '#666',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  unitSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unitHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  unitNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  unitTenant: {
    fontSize: 13,
    color: '#666',
  },
  addRequestButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addRequestButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  noUnitsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  noRequestsText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic' as const,
    marginBottom: 12,
  },
  affectedTenantBanner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
    marginVertical: 8,
    gap: 10,
  },
  affectedTenantLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FF9500',
    marginBottom: 2,
  },
  affectedTenantName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  affectedTenantContact: {
    fontSize: 13,
    color: '#666',
  },
});
