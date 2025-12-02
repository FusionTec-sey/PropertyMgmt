import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import { Bell, Calendar, Clock, Settings as SettingsIcon, ChevronRight } from 'lucide-react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import { useApp } from '@/contexts/AppContext';
import type { UpcomingEvent, DateReminderType } from '@/types';
import EmptyState from '@/components/EmptyState';

const TYPE_COLORS: Record<DateReminderType, string> = {
  lease_start: '#007AFF',
  lease_end: '#FF3B30',
  lease_renewal: '#FF9500',
  document_expiry: '#AF52DE',
  invoice_due: '#FF2D55',
  payment_due: '#FF2D55',
  maintenance_scheduled: '#5856D6',
  todo_due: '#34C759',
  warranty_expiry: '#FF9500',
  custom: '#8E8E93',
};

const TYPE_LABELS: Record<DateReminderType, string> = {
  lease_start: 'Lease Start',
  lease_end: 'Lease End',
  lease_renewal: 'Lease Renewal',
  document_expiry: 'Document Expiry',
  invoice_due: 'Invoice Due',
  payment_due: 'Payment Due',
  maintenance_scheduled: 'Maintenance',
  todo_due: 'Todo Due',
  warranty_expiry: 'Warranty Expiry',
  custom: 'Custom',
};

export default function NotificationsScreen() {
  const {
    getUpcomingEvents,
    urgentEventsCount,
    settings,
    updateSettings,
    syncRemindersFromData,
    permissionsGranted,
    requestPermissions,
  } = useNotifications();

  const {
    currentTenant,
    currentUser,
    leases,
    businessDocuments,
    invoices,
    payments,
    maintenanceSchedules,
    todos,
    propertyItems,
  } = useApp();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<DateReminderType | 'all'>('all');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    if (currentTenant && currentUser && settings) {
      syncRemindersFromData(
        currentTenant.id,
        currentUser.id,
        leases,
        businessDocuments,
        invoices,
        payments,
        maintenanceSchedules,
        todos,
        propertyItems
      );
    }
  }, [
    currentTenant,
    currentUser,
    settings,
    leases,
    businessDocuments,
    invoices,
    payments,
    maintenanceSchedules,
    todos,
    propertyItems,
    syncRemindersFromData,
  ]);

  const upcomingEvents = useMemo(() => {
    const events = getUpcomingEvents(60);
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [getUpcomingEvents, filterType]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (currentTenant && currentUser) {
      await syncRemindersFromData(
        currentTenant.id,
        currentUser.id,
        leases,
        businessDocuments,
        invoices,
        payments,
        maintenanceSchedules,
        todos,
        propertyItems
      );
    }
    setRefreshing(false);
  };

  const handleToggleNotifications = async () => {
    if (!permissionsGranted) {
      await requestPermissions();
      return;
    }
    
    if (settings) {
      await updateSettings({
        push_notifications_enabled: !settings.push_notifications_enabled,
      });
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent'): string => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      default: return '#8E8E93';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderEvent = (event: UpcomingEvent) => {
    return (
      <View key={event.id} style={styles.eventCard}>
        <View style={[styles.eventIndicator, { backgroundColor: TYPE_COLORS[event.type] }]} />
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(event.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(event.priority) }]}>
                  {event.priority}
                </Text>
              </View>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[event.type] + '20' }]}>
              <Text style={[styles.typeText, { color: TYPE_COLORS[event.type] }]}>
                {TYPE_LABELS[event.type]}
              </Text>
            </View>
          </View>
          {event.description && (
            <Text style={styles.eventDescription}>{event.description}</Text>
          )}
          <View style={styles.eventFooter}>
            <View style={styles.eventDate}>
              <Calendar size={14} color="#666" />
              <Text style={styles.eventDateText}>{formatDate(event.date)}</Text>
            </View>
            <View style={[styles.daysUntilBadge, event.days_until <= 3 && styles.daysUntilUrgent]}>
              <Clock size={12} color={event.days_until <= 3 ? '#FF3B30' : '#666'} />
              <Text style={[styles.daysUntilText, event.days_until <= 3 && styles.daysUntilTextUrgent]}>
                {event.days_until === 0 ? 'Today' : 
                 event.days_until === 1 ? 'Tomorrow' :
                 `${event.days_until} days`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (showSettings) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowSettings(false)}
          >
            <ChevronRight size={24} color="#007AFF" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Push Notifications</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Bell size={20} color="#666" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Enable Notifications</Text>
                  <Text style={styles.settingDescription}>
                    {permissionsGranted ? 'Receive reminders for upcoming events' : 'Permission required'}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings?.push_notifications_enabled || false}
                onValueChange={handleToggleNotifications}
              />
            </View>
          </View>

          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Reminder Days Before</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Lease End</Text>
              <Text style={styles.settingValue}>
                {settings?.lease_end_days.join(', ')} days
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Document Expiry</Text>
              <Text style={styles.settingValue}>
                {settings?.document_expiry_days.join(', ')} days
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Invoice Due</Text>
              <Text style={styles.settingValue}>
                {settings?.invoice_due_days.join(', ')} days
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Payment Due</Text>
              <Text style={styles.settingValue}>
                {settings?.payment_due_days.join(', ')} days
              </Text>
            </View>
          </View>

          <Text style={styles.infoText}>
            Notifications are automatically created for leases, documents, invoices, payments, maintenance, todos, and warranties with dates.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {urgentEventsCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {urgentEventsCount} urgent {urgentEventsCount === 1 ? 'event' : 'events'}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <SettingsIcon size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterChip, 
              filterType === key && styles.filterChipActive,
              filterType === key && { backgroundColor: TYPE_COLORS[key as DateReminderType] }
            ]}
            onPress={() => setFilterType(key as DateReminderType)}
          >
            <Text style={[styles.filterChipText, filterType === key && styles.filterChipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {upcomingEvents.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Upcoming Events"
            message="All notifications will appear here when dates approach"
          />
        ) : (
          upcomingEvents.map(renderEvent)
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  settingsButton: {
    padding: 8,
  },
  filterScroll: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row' as const,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventIndicator: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    marginBottom: 8,
  },
  eventTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
    gap: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flexShrink: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  typeBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  eventDate: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  eventDateText: {
    fontSize: 13,
    color: '#666',
  },
  daysUntilBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  daysUntilUrgent: {
    backgroundColor: '#FF3B3015',
  },
  daysUntilText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  daysUntilTextUrgent: {
    color: '#FF3B30',
  },
  settingsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 16,
  },
});
