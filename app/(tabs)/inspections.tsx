import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Plus, ClipboardCheck, Calendar, Clock, AlertCircle, ChevronRight, MapPin, Home, User, FileText } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { PropertyInspection, InspectionType, InspectionStatus } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { useRouter } from 'expo-router';

type FilterStatus = InspectionStatus | 'all';
type FilterType = InspectionType | 'all';

export default function InspectionsScreen() {
  const { propertyInspections, properties, units, tenantRenters, currentUser, addPropertyInspection } = useApp();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    tenant_renter_id: '',
    inspection_type: 'routine' as InspectionType,
    scheduled_date: '',
    scheduled_time: '',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      property_id: '',
      unit_id: '',
      tenant_renter_id: '',
      inspection_type: 'routine',
      scheduled_date: '',
      scheduled_time: '',
    });
  };

  const handleAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.property_id || !formData.scheduled_date) {
      Alert.alert('Error', 'Please select a property and scheduled date');
      return;
    }

    await addPropertyInspection({
      property_id: formData.property_id,
      unit_id: formData.unit_id || undefined,
      tenant_renter_id: formData.tenant_renter_id || undefined,
      inspection_type: formData.inspection_type,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time || undefined,
      inspector_id: currentUser?.id,
      status: 'scheduled',
    });

    setModalVisible(false);
    resetForm();
  };

  const filteredInspections = useMemo(() => {
    let filtered = propertyInspections;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(i => i.inspection_type === filterType);
    }

    return filtered.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());
  }, [propertyInspections, filterStatus, filterType]);

  const upcomingInspections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return propertyInspections
      .filter(i => i.status === 'scheduled' && new Date(i.scheduled_date) >= today)
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
      .slice(0, 5);
  }, [propertyInspections]);

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'Unknown Property';
  };

  const getUnitNumber = (unitId: string | undefined) => {
    if (!unitId) return null;
    const unit = units.find(u => u.id === unitId);
    return unit?.unit_number;
  };

  const getTenantName = (tenantId: string | undefined) => {
    if (!tenantId) return null;
    const tenant = tenantRenters.find(t => t.id === tenantId);
    if (!tenant) return null;
    if (tenant.type === 'business') return tenant.business_name || 'Unnamed Business';
    return `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateString: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderInspection = ({ item }: { item: PropertyInspection }) => {
    const daysUntil = getDaysUntil(item.scheduled_date);
    const isUpcoming = item.status === 'scheduled' && daysUntil >= 0;
    const isOverdue = item.status === 'scheduled' && daysUntil < 0;
    const unitNumber = getUnitNumber(item.unit_id);
    const tenantName = getTenantName(item.tenant_renter_id);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/inspection/${item.id}` as any)}
        testID={`inspection-${item.id}`}
      >
        <Card style={styles.inspectionCard}>
          <View style={styles.inspectionHeader}>
            <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.inspection_type) }]} />
            <View style={styles.inspectionMainInfo}>
              <View style={styles.inspectionTitleRow}>
                <Text style={styles.inspectionType}>
                  {item.inspection_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Inspection
                </Text>
                <Badge label={item.status} variant={getStatusVariant(item.status)} />
              </View>
              
              <View style={styles.propertyInfoRow}>
                <MapPin size={14} color="#666" />
                <Text style={styles.propertyName}>{getPropertyName(item.property_id)}</Text>
                {unitNumber && (
                  <>
                    <Home size={14} color="#666" style={styles.infoIcon} />
                    <Text style={styles.unitText}>Unit {unitNumber}</Text>
                  </>
                )}
              </View>

              {tenantName && (
                <View style={styles.tenantRow}>
                  <User size={14} color="#666" />
                  <Text style={styles.tenantText}>{tenantName}</Text>
                </View>
              )}

              <View style={styles.dateRow}>
                <Calendar size={14} color="#007AFF" />
                <Text style={styles.dateText}>{formatDate(item.scheduled_date)}</Text>
                {item.scheduled_time && (
                  <>
                    <Clock size={14} color="#666" style={styles.timeIcon} />
                    <Text style={styles.timeText}>{item.scheduled_time}</Text>
                  </>
                )}
              </View>

              {isUpcoming && daysUntil <= 7 && (
                <View style={styles.urgentBadge}>
                  <AlertCircle size={12} color="#FF9500" />
                  <Text style={styles.urgentText}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                  </Text>
                </View>
              )}

              {isOverdue && (
                <View style={[styles.urgentBadge, styles.overdueBadge]}>
                  <AlertCircle size={12} color="#FF3B30" />
                  <Text style={[styles.urgentText, styles.overdueText]}>
                    {Math.abs(daysUntil)} day{Math.abs(daysUntil) !== 1 ? 's' : ''} overdue
                  </Text>
                </View>
              )}
            </View>
            <ChevronRight size={20} color="#C7C7CC" />
          </View>

          {item.findings && (
            <View style={styles.findingsPreview}>
              <FileText size={14} color="#666" />
              <Text style={styles.findingsText} numberOfLines={2}>{item.findings}</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const propertyOptions = properties.map(p => ({ label: p.name, value: p.id }));
  const unitOptions = formData.property_id
    ? units.filter(u => u.property_id === formData.property_id).map(u => ({ label: `Unit ${u.unit_number}`, value: u.id }))
    : [];

  const statusCounts = useMemo(() => {
    return {
      scheduled: propertyInspections.filter(i => i.status === 'scheduled').length,
      completed: propertyInspections.filter(i => i.status === 'completed').length,
      cancelled: propertyInspections.filter(i => i.status === 'cancelled').length,
      rescheduled: propertyInspections.filter(i => i.status === 'rescheduled').length,
    };
  }, [propertyInspections]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inspections</Text>
          <Text style={styles.headerSubtitle}>{propertyInspections.length} total</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-inspection-button"
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {upcomingInspections.length > 0 && (
        <View style={styles.upcomingSection}>
          <View style={styles.upcomingHeader}>
            <Clock size={18} color="#007AFF" />
            <Text style={styles.upcomingSectionTitle}>Upcoming Inspections</Text>
          </View>
          {upcomingInspections.map(inspection => {
            const daysUntil = getDaysUntil(inspection.scheduled_date);
            return (
              <TouchableOpacity
                key={inspection.id}
                style={styles.upcomingItem}
                onPress={() => router.push(`/inspection/${inspection.id}` as any)}
              >
                <View style={[styles.upcomingIndicator, { backgroundColor: getTypeColor(inspection.inspection_type) }]} />
                <View style={styles.upcomingContent}>
                  <Text style={styles.upcomingProperty}>{getPropertyName(inspection.property_id)}</Text>
                  <Text style={styles.upcomingDate}>{formatDate(inspection.scheduled_date)}</Text>
                </View>
                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingDays}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statusCounts.scheduled}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statusCounts.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statusCounts.rescheduled}</Text>
          <Text style={styles.statLabel}>Rescheduled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statusCounts.cancelled}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.filterButtons}>
            {(['all', 'scheduled', 'completed', 'cancelled'] as FilterStatus[]).map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.filterButtons}>
            {(['all', 'routine', 'move_in', 'move_out', 'annual'] as FilterType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
                onPress={() => setFilterType(type)}
              >
                <Text style={[styles.filterButtonText, filterType === type && styles.filterButtonTextActive]}>
                  {type === 'all' ? 'All' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {filteredInspections.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Inspections"
          message="Schedule your first property inspection"
          actionLabel="Schedule Inspection"
          onAction={handleAdd}
          testID="inspections-empty"
        />
      ) : (
        <FlatList
          data={filteredInspections}
          renderItem={renderInspection}
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
      )}

      <Modal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        title="Schedule Inspection"
        testID="inspection-modal"
      >
        <Select
          label="Property"
          options={propertyOptions}
          value={formData.property_id}
          onValueChange={value => {
            setFormData({ ...formData, property_id: value, unit_id: '' });
          }}
          placeholder="Select property"
          required
          testID="property-select"
        />

        {formData.property_id && unitOptions.length > 0 && (
          <Select
            label="Unit (Optional)"
            options={unitOptions}
            value={formData.unit_id}
            onValueChange={value => setFormData({ ...formData, unit_id: value })}
            placeholder="Select unit"
            testID="unit-select"
          />
        )}

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Inspection Type</Text>
          <View style={styles.typeSelector}>
            {(['routine', 'move_in', 'move_out', 'maintenance', 'annual', 'emergency'] as InspectionType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeItem,
                  formData.inspection_type === type && styles.typeItemActive,
                  { borderColor: getTypeColor(type) }
                ]}
                onPress={() => setFormData({ ...formData, inspection_type: type })}
              >
                <Text style={[
                  styles.typeItemText,
                  formData.inspection_type === type && { color: getTypeColor(type) }
                ]}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Scheduled Date"
          value={formData.scheduled_date}
          onChangeText={text => setFormData({ ...formData, scheduled_date: text })}
          placeholder="YYYY-MM-DD"
          required
          testID="date-input"
        />

        <Input
          label="Scheduled Time (Optional)"
          value={formData.scheduled_time}
          onChangeText={text => setFormData({ ...formData, scheduled_time: text })}
          placeholder="10:00 AM"
          testID="time-input"
        />

        <Button
          title="Schedule Inspection"
          onPress={handleSave}
          fullWidth
          testID="save-inspection-button"
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
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  upcomingSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  upcomingHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  upcomingSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  upcomingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    gap: 12,
  },
  upcomingIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingProperty: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#666',
  },
  upcomingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#007AFF15',
  },
  upcomingDays: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center' as const,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  inspectionCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden' as const,
  },
  inspectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  typeIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 12,
  },
  inspectionMainInfo: {
    flex: 1,
  },
  inspectionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  inspectionType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  propertyInfoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
    gap: 4,
  },
  propertyName: {
    fontSize: 14,
    color: '#666',
  },
  infoIcon: {
    marginLeft: 8,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
  },
  tenantRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 6,
  },
  tenantText: {
    fontSize: 13,
    color: '#666',
  },
  dateRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  timeIcon: {
    marginLeft: 8,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
  urgentBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#FF950015',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
    marginTop: 4,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FF9500',
  },
  overdueBadge: {
    backgroundColor: '#FF3B3015',
  },
  overdueText: {
    color: '#FF3B30',
  },
  findingsPreview: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  findingsText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic' as const,
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
    borderWidth: 2,
    borderColor: 'transparent' as const,
  },
  typeItemActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  typeItemText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
});
