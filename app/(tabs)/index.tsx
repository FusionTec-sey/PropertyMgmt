import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { 
  Building2, 
  Home, 
  Users, 
  FileText, 
  DollarSign, 
  AlertCircle,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Bell,
  Plus,
  TrendingUp,
  ArrowRight,
  Wrench,
  Receipt,
  ClipboardCheck,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { Todo, TodoStatus } from '@/types';
import * as Notifications from 'expo-notifications';
import { addTodoToCalendar, addInspectionToCalendar, addLeaseToCalendar } from '@/utils/calendarHelper';
import UpcomingEventsWidget, { UpcomingEvent } from '@/components/UpcomingEventsWidget';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function DashboardScreen() {
  const router = useRouter();
  const { dashboardStats, currentTenant, properties, units, tenantRenters, leases, maintenanceRequests, todos, updateTodo, tenantApplications, propertyInspections, invoices, businessDocuments } = useApp();
  const [requestingNotificationPermission, setRequestingNotificationPermission] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const QuickActionCard = ({
    icon: Icon,
    title,
    color,
    onPress,
    badge,
  }: {
    icon: any;
    title: string;
    color: string;
    onPress: () => void;
    badge?: number;
  }) => (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={24} color={color} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SCR`;
  };

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

  const draftLeases = leases.filter((l) => l.status === 'draft');
  const recentLeases = leases.filter((l) => l.status !== 'draft').slice(-3).reverse();
  const urgentMaintenance = maintenanceRequests.filter(
    (m) => m.priority === 'urgent' || m.priority === 'high'
  ).slice(0, 3);

  const pendingApplications = tenantApplications.filter((a) => a.status === 'pending' || a.status === 'under_review');
  
  const upcomingInspections = propertyInspections.filter((i) => {
    if (i.status !== 'scheduled') return false;
    const inspDate = new Date(i.scheduled_date);
    const thirtyDaysOut = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    return inspDate >= today && inspDate <= thirtyDaysOut;
  }).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const overdueInvoices = invoices.filter((inv) => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    return new Date(inv.due_date) < today;
  });

  const expiringDocuments = businessDocuments.filter((doc) => {
    if (!doc.expiry_date) return false;
    const expiryDate = new Date(doc.expiry_date);
    const sixtyDaysFromNow = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000));
    return expiryDate >= today && expiryDate <= sixtyDaysFromNow;
  }).sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime()).slice(0, 3);
  const expiringLeases = leases.filter((l) => {
    if (l.status !== 'active') return false;
    const endDate = new Date(l.end_date);
    return endDate >= today && endDate <= thirtyDaysFromNow;
  }).sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());

  const pendingRenewalOffers = leases.filter((l) => l.renewal_offer && l.renewal_offer.status === 'pending');

  const pendingTodos = todos.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const todayTodos = pendingTodos.filter((t) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  });
  const overdueTodos = pendingTodos.filter((t) => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date() && t.status !== 'completed';
  });
  const upcomingTodos = pendingTodos
    .filter((t) => {
      if (!t.due_date) return true;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return dueDate > today;
    })
    .slice(0, 5);

  const handleToggleTodoStatus = async (todo: Todo) => {
    const newStatus: TodoStatus = todo.status === 'completed' ? 'pending' : 'completed';
    await updateTodo(todo.id, {
      status: newStatus,
      completed_date: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  const requestNotificationPermission = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  };

  const scheduleNotification = async (todo: Todo) => {
    setRequestingNotificationPermission(true);
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!todo.due_date) {
        Alert.alert(
          'No Due Date',
          'This task doesn\'t have a due date. Would you like to set a reminder for a specific time?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Set Custom',
              onPress: () => {
                Alert.alert(
                  'Custom Reminder',
                  'For custom reminders, please edit the task and set a due date first.',
                  [{ text: 'OK' }]
                );
              },
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Set Reminder',
        'When would you like to be reminded?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: '1 hour before',
            onPress: async () => {
              const dueDate = new Date(todo.due_date!);
              const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
              await scheduleNotificationAtTime(todo, reminderTime, '1 hour before');
            },
          },
          {
            text: '1 day before',
            onPress: async () => {
              const dueDate = new Date(todo.due_date!);
              const reminderTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
              await scheduleNotificationAtTime(todo, reminderTime, '1 day before');
            },
          },
          {
            text: 'On due date',
            onPress: async () => {
              const dueDate = new Date(todo.due_date!);
              await scheduleNotificationAtTime(todo, dueDate, 'on due date');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    } finally {
      setRequestingNotificationPermission(false);
    }
  };

  const scheduleNotificationAtTime = async (
    todo: Todo,
    reminderTime: Date,
    timeDescription: string
  ) => {
    const now = new Date();
    if (reminderTime < now) {
      Alert.alert(
        'Past Time',
        `The reminder time (${timeDescription}) is in the past. Please choose a future time.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const secondsUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Task Reminder',
          body: todo.title,
          data: { todoId: todo.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilReminder > 0 ? secondsUntilReminder : 1,
        },
      });

      Alert.alert(
        'Reminder Set',
        `You'll be reminded ${timeDescription} at ${reminderTime.toLocaleString()}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule reminder');
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      default:
        return Circle;
    }
  };

  const getTodoStatusColor = (status: TodoStatus) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in_progress':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#007AFF"
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.tenantName}>{currentTenant?.name}</Text>
        </View>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.metricRow}>
          <TouchableOpacity 
            style={[styles.metricCard, styles.primaryMetric]}
            onPress={() => router.push('/(tabs)/properties')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <View style={styles.metricIconContainer}>
                <Building2 size={28} color="#007AFF" />
              </View>
              <TrendingUp size={18} color="#34C759" />
            </View>
            <Text style={styles.metricValue}>{dashboardStats.total_properties}</Text>
            <Text style={styles.metricLabel}>Properties</Text>
            <View style={styles.metricDetails}>
              <View style={styles.metricDetailItem}>
                <Home size={14} color="#666" />
                <Text style={styles.metricDetailText}>{dashboardStats.total_units} units</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.metricColumn}>
            <TouchableOpacity 
              style={[styles.metricCard, styles.secondaryMetric]}
              activeOpacity={0.8}
            >
              <View style={styles.metricIconContainer}>
                <Home size={22} color="#34C759" />
              </View>
              <Text style={styles.metricValue}>{dashboardStats.occupied_units}</Text>
              <Text style={styles.metricLabel}>Occupied</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricCard, styles.secondaryMetric]}
              activeOpacity={0.8}
            >
              <View style={styles.metricIconContainer}>
                <Home size={22} color="#FF9500" />
              </View>
              <Text style={styles.metricValue}>{dashboardStats.available_units}</Text>
              <Text style={styles.metricLabel}>Available</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricRow}>
          <TouchableOpacity 
            style={[styles.metricCard, styles.wideMetric]}
            onPress={() => router.push('/(tabs)/tenants')}
            activeOpacity={0.8}
          >
            <View style={styles.metricIconContainer}>
              <Users size={24} color="#5856D6" />
            </View>
            <Text style={styles.metricValue}>{dashboardStats.total_tenant_renters}</Text>
            <Text style={styles.metricLabel}>Active Tenants</Text>
            <View style={styles.metricFooter}>
              <Text style={styles.metricSubtext}>{dashboardStats.active_leases} leases</Text>
              <ArrowRight size={14} color="#5856D6" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.metricCard, styles.wideMetric]}
            onPress={() => router.push('/(tabs)/payments')}
            activeOpacity={0.8}
          >
            <View style={styles.metricIconContainer}>
              <DollarSign size={24} color="#34C759" />
            </View>
            <Text style={styles.metricValue}>{formatCurrency(dashboardStats.total_revenue_month)}</Text>
            <Text style={styles.metricLabel}>This Month</Text>
            <View style={styles.metricFooter}>
              <Text style={styles.metricSubtext}>Revenue</Text>
              <ArrowRight size={14} color="#34C759" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            icon={FileText}
            title="Applications"
            color="#AF52DE"
            badge={pendingApplications.length}
            onPress={() => router.push('/(tabs)/applications')}
          />
          <QuickActionCard
            icon={Users}
            title="Tenants"
            color="#5856D6"
            onPress={() => router.push('/(tabs)/tenants')}
          />
          <QuickActionCard
            icon={Receipt}
            title="Payments"
            color="#34C759"
            badge={dashboardStats.pending_payments + dashboardStats.overdue_payments}
            onPress={() => router.push('/(tabs)/payments')}
          />
          <QuickActionCard
            icon={Wrench}
            title="Maintenance"
            color="#FF9500"
            badge={dashboardStats.open_maintenance}
            onPress={() => router.push('/(tabs)/maintenance')}
          />
          <QuickActionCard
            icon={ClipboardCheck}
            title="Inspections"
            color="#007AFF"
            badge={upcomingInspections.length}
            onPress={() => router.push('/(tabs)/inspections')}
          />
          <QuickActionCard
            icon={FileText}
            title="Documents"
            color="#FF2D55"
            badge={expiringDocuments.length}
            onPress={() => router.push('/(tabs)/documents')}
          />
        </View>
      </View>

      <UpcomingEventsWidget
        events={(
          [
            ...expiringLeases.slice(0, 3).map((lease) => {
              const property = properties.find((p) => p.id === lease.property_id);
              const unit = units.find((u) => u.id === lease.unit_id);
              const tenant = tenantRenters.find((t) => t.id === lease.tenant_renter_id);
              const tenantName = tenant
                ? tenant.type === 'business'
                  ? tenant.business_name || 'Unnamed Business'
                  : `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed'
                : 'Unknown';
              const daysUntil = Math.ceil((new Date(lease.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return {
                id: lease.id,
                title: `Lease Expiring: ${property?.name || 'Unknown'}`,
                subtitle: `${tenantName} • Unit ${unit?.unit_number || 'N/A'}`,
                date: lease.end_date,
                type: 'lease' as const,
                priority: daysUntil <= 7 ? 'high' as const : 'medium' as const,
              };
            }),
            ...upcomingInspections.slice(0, 3).map((inspection) => {
              const property = properties.find((p) => p.id === inspection.property_id);
              const unit = units.find((u) => u.id === inspection.unit_id);
              const daysUntil = Math.ceil((new Date(inspection.scheduled_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return {
                id: inspection.id,
                title: `${inspection.inspection_type.replace('_', ' ')} Inspection`,
                subtitle: `${property?.name || 'Unknown'}${unit ? ` • Unit ${unit.unit_number}` : ''}`,
                date: inspection.scheduled_date,
                type: 'inspection' as const,
                priority: daysUntil <= 3 ? 'high' as const : 'medium' as const,
              };
            }),
            ...overdueTodos.slice(0, 2).map((todo) => ({
              id: todo.id,
              title: todo.title,
              subtitle: 'Overdue',
              date: todo.due_date!,
              type: 'todo' as const,
              priority: 'urgent' as const,
            })),
            ...todayTodos.slice(0, 2).map((todo) => ({
              id: todo.id,
              title: todo.title,
              subtitle: 'Due today',
              date: todo.due_date!,
              type: 'todo' as const,
              priority: 'high' as const,
            })),
            ...expiringDocuments.slice(0, 2).map((doc) => {
              const property = doc.property_id ? properties.find((p) => p.id === doc.property_id) : null;
              const daysUntil = Math.ceil((new Date(doc.expiry_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return {
                id: doc.id,
                title: `${doc.name} Expiring`,
                subtitle: property?.name || doc.category.replace('_', ' '),
                date: doc.expiry_date!,
                type: 'document' as const,
                priority: daysUntil <= 14 ? 'high' as const : 'medium' as const,
              };
            }),
          ] as UpcomingEvent[]
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
        maxEvents={8}
        onEventPress={(event) => {
          if (event.type === 'lease') {
            router.push(`/lease/${event.id}`);
          } else if (event.type === 'inspection') {
            router.push(`/inspection/${event.id}` as any);
          } else if (event.type === 'todo') {
            router.push('/(tabs)/todos');
          }
        }}
        testID="dashboard-upcoming-events"
      />

      {pendingApplications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#AF52DE" />
            <Text style={styles.sectionTitle}>New Applications</Text>
          </View>
          <TouchableOpacity
            style={[styles.alertBanner, { borderLeftColor: '#AF52DE' }]}
            onPress={() => router.push('/(tabs)/applications')}
            activeOpacity={0.8}
          >
            <Users size={20} color="#AF52DE" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {pendingApplications.length} Pending Application{pendingApplications.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertSubtext}>Review and process tenant applications</Text>
            </View>
            <ArrowRight size={20} color="#AF52DE" />
          </TouchableOpacity>
        </View>
      )}

      {(dashboardStats.pending_payments > 0 || dashboardStats.overdue_payments > 0 || overdueInvoices.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Payment Alerts</Text>
          </View>
          <View style={styles.alertsContainer}>
            {dashboardStats.overdue_payments > 0 && (
              <TouchableOpacity 
                style={[styles.alertBanner, styles.urgentAlert]}
                onPress={() => router.push('/(tabs)/payments')}
                activeOpacity={0.8}
              >
                <AlertCircle size={20} color="#FF3B30" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{dashboardStats.overdue_payments} Overdue Payment{dashboardStats.overdue_payments > 1 ? 's' : ''}</Text>
                  <Text style={styles.alertSubtext}>Requires immediate attention</Text>
                </View>
                <ArrowRight size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
            {dashboardStats.pending_payments > 0 && (
              <TouchableOpacity 
                style={[styles.alertBanner, styles.warningAlert]}
                onPress={() => router.push('/(tabs)/payments')}
                activeOpacity={0.8}
              >
                <Clock size={20} color="#FF9500" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{dashboardStats.pending_payments} Pending Payment{dashboardStats.pending_payments > 1 ? 's' : ''}</Text>
                  <Text style={styles.alertSubtext}>Awaiting processing</Text>
                </View>
                <ArrowRight size={20} color="#FF9500" />
              </TouchableOpacity>
            )}
            {overdueInvoices.length > 0 && (
              <TouchableOpacity 
                style={[styles.alertBanner, styles.urgentAlert]}
                onPress={() => router.push('/(tabs)/invoices')}
                activeOpacity={0.8}
              >
                <Receipt size={20} color="#FF3B30" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{overdueInvoices.length} Overdue Invoice{overdueInvoices.length > 1 ? 's' : ''}</Text>
                  <Text style={styles.alertSubtext}>Follow up with tenants</Text>
                </View>
                <ArrowRight size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {upcomingInspections.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ClipboardCheck size={20} color="#5856D6" />
            <Text style={styles.sectionTitle}>Upcoming Inspections</Text>
          </View>
          {upcomingInspections.slice(0, 3).map((inspection) => {
            const property = properties.find((p) => p.id === inspection.property_id);
            const unit = units.find((u) => u.id === inspection.unit_id);
            const inspDate = new Date(inspection.scheduled_date);
            const daysUntil = Math.ceil((inspDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <View key={inspection.id} style={styles.inspectionCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/inspection/${inspection.id}` as any)}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                <View style={styles.leaseInfo}>
                  <Text style={styles.leaseProperty}>{property?.name || 'Unknown'}</Text>
                  <Text style={styles.leaseDetails}>
                    {inspection.inspection_type.replace('_', ' ')} • {unit ? `Unit ${unit.unit_number}` : 'Property-wide'}
                  </Text>
                  <Text style={[styles.leaseExpiry, daysUntil <= 3 && styles.leaseExpiryUrgent]}>
                    {daysUntil === 0 
                      ? 'Today' 
                      : daysUntil === 1 
                      ? 'Tomorrow' 
                      : `In ${daysUntil} days`} • {inspDate.toLocaleDateString()}
                  </Text>
                </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inspectionCalendarButton}
                  onPress={async () => {
                    await addInspectionToCalendar({
                      property_name: property?.name || 'Unknown',
                      unit_number: unit?.unit_number,
                      inspection_type: inspection.inspection_type,
                      scheduled_date: inspection.scheduled_date,
                      scheduled_time: inspection.scheduled_time,
                      notes: `${inspection.inspection_type.replace('_', ' ')} inspection`,
                    });
                  }}
                >
                  <Calendar size={16} color="#34C759" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {expiringDocuments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Expiring Documents</Text>
          </View>
          {expiringDocuments.map((doc) => {
            const property = doc.property_id ? properties.find((p) => p.id === doc.property_id) : null;
            const expiryDate = new Date(doc.expiry_date!);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <View key={doc.id} style={styles.expiringDocCard}>
                <View style={styles.leaseInfo}>
                  <Text style={styles.leaseProperty}>{doc.name}</Text>
                  <Text style={styles.leaseDetails}>
                    {doc.category.replace('_', ' ')} {property && `• ${property.name}`}
                  </Text>
                  <Text style={[styles.leaseExpiry, daysUntilExpiry <= 14 && styles.leaseExpiryUrgent]}>
                    {daysUntilExpiry === 0 
                      ? 'Expires today' 
                      : daysUntilExpiry === 1 
                      ? 'Expires tomorrow' 
                      : `Expires in ${daysUntilExpiry} days`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {expiringLeases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Expiring Leases</Text>
          </View>
          {expiringLeases.map((lease) => {
            const property = properties.find((p) => p.id === lease.property_id);
            const unit = units.find((u) => u.id === lease.unit_id);
            const tenant = tenantRenters.find((t) => t.id === lease.tenant_renter_id);
            const tenantName = tenant
              ? tenant.type === 'business'
                ? tenant.business_name || 'Unnamed Business'
                : `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed'
              : 'Unknown';
            
            const endDate = new Date(lease.end_date);
            const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <TouchableOpacity
                key={lease.id}
                style={styles.expiringLeaseCard}
                onPress={() => router.push(`/lease/${lease.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.leaseInfo}>
                  <Text style={styles.leaseProperty}>{property?.name || 'Unknown'}</Text>
                  <Text style={styles.leaseDetails}>
                    {tenantName} • Unit {unit?.unit_number || 'N/A'}
                  </Text>
                  <Text style={[styles.leaseExpiry, daysUntilExpiry <= 7 && styles.leaseExpiryUrgent]}>
                    {daysUntilExpiry === 0 
                      ? 'Expires today' 
                      : daysUntilExpiry === 1 
                      ? 'Expires tomorrow' 
                      : `Expires in ${daysUntilExpiry} days`}
                  </Text>
                </View>
                <View style={styles.leaseActions}>
                  <TouchableOpacity
                    style={styles.leaseCalendarButton}
                    onPress={async () => {
                      await addLeaseToCalendar({
                        property_name: property?.name || 'Unknown',
                        unit_number: unit?.unit_number || 'N/A',
                        start_date: lease.start_date,
                        end_date: lease.end_date,
                        tenant_name: tenantName,
                        rent_amount: lease.rent_amount,
                        currency: 'SCR',
                      });
                    }}
                  >
                    <Calendar size={16} color="#34C759" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.renewButton}
                    onPress={() => {
                      const monthsDiff = Math.round(
                        (new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) / 
                        (1000 * 60 * 60 * 24 * 30)
                      );
                      const leasePeriod = [6, 12, 24].includes(monthsDiff) ? monthsDiff : 12;
                      router.push(`/renewLease/${lease.id}?leasePeriod=${leasePeriod}` as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.renewButtonText}>Renew</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {pendingRenewalOffers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#5856D6" />
            <Text style={styles.sectionTitle}>Pending Renewal Offers</Text>
          </View>
          {pendingRenewalOffers.map((lease) => {
            if (!lease.renewal_offer) return null;
            const property = properties.find((p) => p.id === lease.property_id);
            const unit = units.find((u) => u.id === lease.unit_id);
            const tenant = tenantRenters.find((t) => t.id === lease.tenant_renter_id);
            const tenantName = tenant
              ? tenant.type === 'business'
                ? tenant.business_name || 'Unnamed Business'
                : `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed'
              : 'Unknown';
            
            const deadline = new Date(lease.renewal_offer.response_deadline);
            const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntilDeadline < 0;

            return (
              <View
                key={lease.id}
                style={[styles.renewalOfferCard, isOverdue && styles.renewalOfferOverdue]}
              >
                <View style={styles.leaseInfo}>
                  <Text style={styles.leaseProperty}>{property?.name || 'Unknown'}</Text>
                  <Text style={styles.leaseDetails}>
                    {tenantName} • Unit {unit?.unit_number || 'N/A'}
                  </Text>
                  <View style={styles.renewalOfferDetails}>
                    <View style={styles.renewalOfferRow}>
                      <Text style={styles.renewalOfferLabel}>New Rent:</Text>
                      <Text style={styles.renewalOfferValue}>
                        {formatCurrency(lease.renewal_offer.new_rent_amount)}
                      </Text>
                    </View>
                    {lease.renewal_offer.rent_increase !== 0 && (
                      <View style={styles.renewalOfferRow}>
                        <Text style={styles.renewalOfferLabel}>Change:</Text>
                        <Text style={[styles.renewalOfferValue, lease.renewal_offer.rent_increase > 0 ? styles.rentIncrease : styles.rentDecrease]}>
                          {lease.renewal_offer.rent_increase > 0 ? '+' : ''}{formatCurrency(lease.renewal_offer.rent_increase)} ({lease.renewal_offer.rent_increase_percentage > 0 ? '+' : ''}{lease.renewal_offer.rent_increase_percentage.toFixed(1)}%)
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.offerDeadline, isOverdue && styles.offerDeadlineOverdue]}>
                      {isOverdue
                        ? `Deadline passed ${Math.abs(daysUntilDeadline)} day${Math.abs(daysUntilDeadline) !== 1 ? 's' : ''} ago`
                        : daysUntilDeadline === 0
                        ? 'Deadline today'
                        : daysUntilDeadline === 1
                        ? 'Deadline tomorrow'
                        : `${daysUntilDeadline} days until deadline`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {dashboardStats.open_maintenance > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color="#FF3B30" />
            <Text style={styles.sectionTitle}>Maintenance</Text>
          </View>
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>
              {dashboardStats.open_maintenance} open maintenance request{dashboardStats.open_maintenance !== 1 ? 's' : ''}
            </Text>
            {urgentMaintenance.length > 0 && (
              <View style={styles.urgentList}>
                {urgentMaintenance.map((m) => {
                  const property = properties.find((p) => p.id === m.property_id);
                  return (
                    <View key={m.id} style={styles.urgentItem}>
                      <View style={[styles.priorityBadge, { backgroundColor: m.priority === 'urgent' ? '#FF3B30' : '#FF9500' }]}>
                        <Text style={styles.priorityText}>{m.priority}</Text>
                      </View>
                      <View style={styles.urgentInfo}>
                        <Text style={styles.urgentTitle}>{m.title}</Text>
                        <Text style={styles.urgentProperty}>{property?.name || 'Unknown'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {draftLeases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Draft Leases</Text>
          </View>
          {draftLeases.map((lease) => {
            const property = properties.find((p) => p.id === lease.property_id);
            const unit = units.find((u) => u.id === lease.unit_id);
            const tenant = tenantRenters.find((t) => t.id === lease.tenant_renter_id);
            const tenantName = tenant
              ? tenant.type === 'business'
                ? tenant.business_name || 'Unnamed Business'
                : `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unnamed'
              : 'Unknown';
            
            const hasGeneratedPDF = !!lease.pdf_generated_uri;
            const hasSignedDoc = !!lease.signed_agreement;

            return (
              <TouchableOpacity
                key={lease.id}
                style={styles.draftLeaseCard}
                onPress={() => router.push(`/lease/${lease.id}`)}
              >
                <View style={styles.leaseInfo}>
                  <Text style={styles.leaseProperty}>{property?.name || 'Unknown'}</Text>
                  <Text style={styles.leaseDetails}>
                    {tenantName} • Unit {unit?.unit_number || 'N/A'}
                  </Text>
                  <Text style={styles.leaseAmount}>
                    ₨{lease.rent_amount.toLocaleString()} SCR/month
                  </Text>
                </View>
                <View style={styles.draftProgress}>
                  <View style={styles.progressSteps}>
                    <View style={[styles.progressStep, styles.progressStepComplete]}>
                      <CheckCircle size={16} color="#34C759" />
                    </View>
                    <View style={[styles.progressStep, hasGeneratedPDF && styles.progressStepComplete]}>
                      {hasGeneratedPDF ? (
                        <CheckCircle size={16} color="#34C759" />
                      ) : (
                        <Circle size={16} color="#999" />
                      )}
                    </View>
                    <View style={[styles.progressStep, hasSignedDoc && styles.progressStepComplete]}>
                      {hasSignedDoc ? (
                        <CheckCircle size={16} color="#34C759" />
                      ) : (
                        <Circle size={16} color="#999" />
                      )}
                    </View>
                  </View>
                  <Text style={styles.progressText}>
                    {hasSignedDoc ? 'Ready to finalize' : hasGeneratedPDF ? 'Upload signed copy' : 'Generate PDF'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {recentLeases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#5856D6" />
            <Text style={styles.sectionTitle}>Recent Leases</Text>
          </View>
          {recentLeases.map((lease) => {
            const property = properties.find((p) => p.id === lease.property_id);
            return (
              <View key={lease.id} style={styles.leaseCard}>
                <View style={styles.leaseInfo}>
                  <Text style={styles.leaseProperty}>{property?.name || 'Unknown'}</Text>
                  <Text style={styles.leaseDetails}>
                    ₨{lease.rent_amount.toLocaleString()} SCR/month
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lease.status) }]}>
                  <Text style={styles.statusText}>{lease.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {pendingTodos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Tasks & To-Do</Text>
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => router.push('/(tabs)/todos')}
            >
              <Plus size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {overdueTodos.length > 0 && (
            <View style={styles.taskSummary}>
              <AlertCircle size={16} color="#FF3B30" />
              <Text style={styles.taskSummaryText}>
                {overdueTodos.length} overdue task{overdueTodos.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {todayTodos.length > 0 && (
            <View style={[styles.taskSummary, { marginTop: 4 }]}>
              <Clock size={16} color="#FF9500" />
              <Text style={styles.taskSummaryText}>
                {todayTodos.length} task{todayTodos.length !== 1 ? 's' : ''} due today
              </Text>
            </View>
          )}

          <View style={styles.todosList}>
            {upcomingTodos.map((todo) => {
              const StatusIcon = getStatusIcon(todo.status);
              const isOverdue =
                todo.due_date &&
                new Date(todo.due_date) < new Date() &&
                todo.status !== 'completed';
              const isDueToday =
                todo.due_date &&
                new Date(todo.due_date).toDateString() === new Date().toDateString();

              return (
                <View key={todo.id} style={styles.todoItem}>
                  <TouchableOpacity
                    style={styles.todoCheckbox}
                    onPress={() => handleToggleTodoStatus(todo)}
                  >
                    <StatusIcon size={20} color={getTodoStatusColor(todo.status)} />
                  </TouchableOpacity>

                  <View style={styles.todoContent}>
                    <Text
                      style={[
                        styles.todoTitle,
                        todo.status === 'completed' && styles.completedTodoTitle,
                      ]}
                      numberOfLines={1}
                    >
                      {todo.title}
                    </Text>
                    <View style={styles.todoMeta}>
                      <View
                        style={[
                          styles.todoPriorityBadge,
                          { backgroundColor: getPriorityColor(todo.priority) },
                        ]}
                      >
                        <Text style={styles.todoPriorityText}>{todo.priority}</Text>
                      </View>
                      {todo.due_date && (
                        <Text
                          style={[
                            styles.todoDueDate,
                            isOverdue && styles.todoOverdue,
                            isDueToday && styles.todoDueToday,
                          ]}
                        >
                          {isOverdue
                            ? 'Overdue'
                            : isDueToday
                            ? 'Due today'
                            : new Date(todo.due_date).toLocaleDateString('en-GB')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.todoActions}>
                    <TouchableOpacity
                      style={styles.reminderButton}
                      onPress={() => scheduleNotification(todo)}
                      disabled={requestingNotificationPermission}
                    >
                      <Bell size={18} color="#007AFF" />
                    </TouchableOpacity>
                    {todo.due_date && (
                      <TouchableOpacity
                        style={styles.calendarButton}
                        onPress={async () => {
                          if (todo.due_date) {
                            await addTodoToCalendar({
                              title: todo.title,
                              description: todo.description,
                              due_date: todo.due_date,
                              priority: todo.priority,
                            });
                          }
                        }}
                      >
                        <Calendar size={18} color="#34C759" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/todos')}
          >
            <Text style={styles.viewAllText}>View All Tasks</Text>
          </TouchableOpacity>
        </View>
      )}

      {properties.length === 0 && (
        <View style={styles.emptyState}>
          <Building2 size={48} color="#999" />
          <Text style={styles.emptyTitle}>Get Started</Text>
          <Text style={styles.emptyText}>
            Add your first property to start managing your real estate
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/properties')}
          >
            <Text style={styles.emptyButtonText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#34C759';
    case 'expired':
      return '#FF3B30';
    case 'draft':
      return '#999';
    default:
      return '#007AFF';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#FFF',
  },
  greeting: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  tenantName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  metricsSection: {
    padding: 16,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryMetric: {
    flex: 1.2,
  },
  secondaryMetric: {
    flex: 1,
    marginBottom: 12,
  },
  wideMetric: {
    flex: 1,
  },
  metricColumn: {
    flex: 1,
    gap: 12,
  },
  metricHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  metricIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500' as const,
  },
  metricDetails: {
    flexDirection: 'row' as const,
    marginTop: 8,
    gap: 12,
  },
  metricDetailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  metricDetailText: {
    fontSize: 13,
    color: '#666',
  },
  metricFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  metricSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500' as const,
  },
  quickActionsSection: {
    padding: 16,
    paddingTop: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  quickAction: {
    width: '48%' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    flex: 1,
  },
  alertsContainer: {
    gap: 12,
  },
  alertBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  urgentAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  warningAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  alertSubtext: {
    fontSize: 13,
    color: '#8E8E93',
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  urgentList: {
    gap: 8,
  },
  urgentItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
    textTransform: 'uppercase' as const,
  },
  urgentInfo: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  urgentProperty: {
    fontSize: 12,
    color: '#666',
  },
  leaseCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leaseInfo: {
    flex: 1,
  },
  leaseProperty: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  leaseDetails: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
    textTransform: 'capitalize' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  draftLeaseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  leaseAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#34C759',
    marginTop: 4,
  },
  draftProgress: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progressSteps: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 8,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  progressStepComplete: {
    backgroundColor: '#E8F5E9',
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  addTaskButton: {
    marginLeft: 'auto' as const,
    padding: 4,
  },
  taskSummary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  taskSummaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  todosList: {
    gap: 8,
    marginTop: 8,
  },
  todoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  todoCheckbox: {
    padding: 4,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  completedTodoTitle: {
    textDecorationLine: 'line-through' as const,
    color: '#8E8E93',
  },
  todoMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  todoPriorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todoPriorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
    textTransform: 'uppercase' as const,
  },
  todoDueDate: {
    fontSize: 12,
    color: '#666',
  },
  todoOverdue: {
    color: '#FF3B30',
    fontWeight: '600' as const,
  },
  todoDueToday: {
    color: '#FF9500',
    fontWeight: '600' as const,
  },
  expiringLeaseCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  leaseExpiry: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  leaseExpiryUrgent: {
    color: '#FF3B30',
  },
  renewalOfferCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#5856D6',
  },
  renewalOfferOverdue: {
    borderLeftColor: '#FF3B30',
  },
  renewalOfferDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  renewalOfferRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  renewalOfferLabel: {
    fontSize: 13,
    color: '#666',
  },
  renewalOfferValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  rentIncrease: {
    color: '#FF9500',
  },
  rentDecrease: {
    color: '#34C759',
  },
  offerDeadline: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  offerDeadlineOverdue: {
    color: '#FF3B30',
    fontWeight: '600' as const,
  },
  renewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#FFF',
  },
  renewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  inspectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#5856D6',
  },
  expiringDocCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  todoActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  reminderButton: {
    padding: 8,
    backgroundColor: '#007AFF15',
    borderRadius: 8,
  },
  calendarButton: {
    padding: 8,
    backgroundColor: '#34C75915',
    borderRadius: 8,
  },
  inspectionCalendarButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: '#34C75915',
    borderRadius: 8,
  },
  leaseActions: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
  },
  leaseCalendarButton: {
    padding: 8,
    backgroundColor: '#34C75915',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  viewAllButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
