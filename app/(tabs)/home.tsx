import React, { useState, useMemo } from 'react';
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
  File,
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
  const { dashboardStats, currentTenant, properties, units, tenantRenters, leases, maintenanceRequests, todos, updateTodo, tenantApplications, propertyInspections, invoices, businessDocuments, payments } = useApp();
  const [requestingNotificationPermission, setRequestingNotificationPermission] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overdue_payments' | 'pending_maintenance' | 'expiring_leases' | 'recent_files'>('overdue_payments');

  type ActivityItem = {
    id: string;
    title: string;
    subtitle: string;
    timestamp: string;
    type: string;
  };

  const recentActivity = useMemo((): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    payments.slice(0, 5).forEach((payment) => {
      const lease = leases.find((l) => l.id === payment.lease_id);
      const renter = tenantRenters.find((r) => r.id === payment.tenant_renter_id);
      const renterName = renter?.type === 'business' ? renter.business_name : `${renter?.first_name} ${renter?.last_name}`;
      
      activities.push({
        id: payment.id,
        title: `Payment ${payment.status}`,
        subtitle: `${renterName} - ${payment.currency} ${payment.amount}`,
        timestamp: payment.updated_at,
        type: 'payment',
      });
    });

    maintenanceRequests.slice(0, 5).forEach((req) => {
      const property = properties.find((p) => p.id === req.property_id);
      
      activities.push({
        id: req.id,
        title: `Maintenance ${req.status}`,
        subtitle: `${property?.name} - ${req.title}`,
        timestamp: req.updated_at,
        type: 'maintenance',
      });
    });

    leases.slice(0, 5).forEach((lease) => {
      const property = properties.find((p) => p.id === lease.property_id);
      const unit = units.find((u) => u.id === lease.unit_id);
      const renter = tenantRenters.find((r) => r.id === lease.tenant_renter_id);
      const renterName = renter?.type === 'business' ? renter.business_name : `${renter?.first_name} ${renter?.last_name}`;
      
      activities.push({
        id: lease.id,
        title: `Lease ${lease.status}`,
        subtitle: `${property?.name} ${unit?.unit_number} - ${renterName}`,
        timestamp: lease.updated_at,
        type: 'lease',
      });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [payments, maintenanceRequests, leases, properties, units, tenantRenters]);

  const overduePayments = useMemo(() => {
    return payments.filter(p => p.status === 'overdue');
  }, [payments]);

  const pendingMaintenance = useMemo(() => {
    return maintenanceRequests.filter(m => m.status === 'open' || m.status === 'in_progress');
  }, [maintenanceRequests]);

  const expiringLeases = useMemo(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return leases.filter(lease => {
      if (lease.status !== 'active') return false;
      const endDate = new Date(lease.end_date);
      return endDate <= thirtyDaysFromNow && endDate >= new Date();
    });
  }, [leases]);

  const recentFiles = useMemo(() => {
    return businessDocuments
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [businessDocuments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overdue_payments':
        if (overduePayments.length === 0) {
          return (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#34C759" />
              <Text style={styles.emptyStateText}>No overdue payments</Text>
            </View>
          );
        }
        return overduePayments.map(payment => {
          const lease = leases.find(l => l.id === payment.lease_id);
          const renter = tenantRenters.find(r => r.id === payment.tenant_renter_id);
          const property = properties.find(p => p.id === lease?.property_id);
          const unit = units.find(u => u.id === lease?.unit_id);
          const renterName = renter?.type === 'business' ? renter.business_name : `${renter?.first_name} ${renter?.last_name}`;

          return (
            <TouchableOpacity 
              key={payment.id} 
              style={styles.tabCard}
              onPress={() => router.push('/(tabs)/payments')}
            >
              <View style={styles.tabCardHeader}>
                <View>
                  <Text style={styles.tabCardTitle}>{renterName}</Text>
                  <Text style={styles.tabCardSubtitle}>{property?.name} {unit?.unit_number}</Text>
                </View>
                <View style={[styles.badge, styles.badgeError]}>
                  <Text style={styles.badgeText}>{payment.currency} {payment.amount}</Text>
                </View>
              </View>
              <Text style={styles.tabCardMeta}>Due: {new Date(payment.due_date).toLocaleDateString()}</Text>
            </TouchableOpacity>
          );
        });

      case 'pending_maintenance':
        if (pendingMaintenance.length === 0) {
          return (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#34C759" />
              <Text style={styles.emptyStateText}>No pending maintenance</Text>
            </View>
          );
        }
        return pendingMaintenance.map(req => {
          const property = properties.find(p => p.id === req.property_id);
          const unit = units.find(u => u.id === req.unit_id);

          return (
            <TouchableOpacity 
              key={req.id} 
              style={styles.tabCard}
              onPress={() => router.push('/(tabs)/maintenance')}
            >
              <View style={styles.tabCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tabCardTitle}>{req.title}</Text>
                  <Text style={styles.tabCardSubtitle}>{property?.name} {unit?.unit_number || ''}</Text>
                </View>
                <View style={[styles.badge, req.priority === 'urgent' ? styles.badgeError : req.priority === 'high' ? styles.badgeWarning : styles.badgeInfo]}>
                  <Text style={styles.badgeText}>{req.priority}</Text>
                </View>
              </View>
              <Text style={styles.tabCardMeta}>Status: {req.status}</Text>
            </TouchableOpacity>
          );
        });

      case 'expiring_leases':
        if (expiringLeases.length === 0) {
          return (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#34C759" />
              <Text style={styles.emptyStateText}>No leases expiring soon</Text>
            </View>
          );
        }
        return expiringLeases.map(lease => {
          const property = properties.find(p => p.id === lease.property_id);
          const unit = units.find(u => u.id === lease.unit_id);
          const renter = tenantRenters.find(r => r.id === lease.tenant_renter_id);
          const renterName = renter?.type === 'business' ? renter.business_name : `${renter?.first_name} ${renter?.last_name}`;
          const daysUntilExpiry = Math.ceil((new Date(lease.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          return (
            <TouchableOpacity 
              key={lease.id} 
              style={styles.tabCard}
              onPress={() => router.push(`/renewLease/${lease.id}`)}
            >
              <View style={styles.tabCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tabCardTitle}>{renterName}</Text>
                  <Text style={styles.tabCardSubtitle}>{property?.name} {unit?.unit_number}</Text>
                </View>
                <View style={[styles.badge, daysUntilExpiry <= 14 ? styles.badgeError : styles.badgeWarning]}>
                  <Text style={styles.badgeText}>{daysUntilExpiry} days</Text>
                </View>
              </View>
              <Text style={styles.tabCardMeta}>Expires: {new Date(lease.end_date).toLocaleDateString()}</Text>
            </TouchableOpacity>
          );
        });

      case 'recent_files':
        if (recentFiles.length === 0) {
          return (
            <View style={styles.emptyState}>
              <File size={48} color="#8E8E93" />
              <Text style={styles.emptyStateText}>No files yet</Text>
            </View>
          );
        }
        return recentFiles.map(doc => {
          return (
            <TouchableOpacity 
              key={doc.id} 
              style={styles.tabCard}
              onPress={() => router.push('/(tabs)/files')}
            >
              <View style={styles.tabCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tabCardTitle}>{doc.name}</Text>
                  <Text style={styles.tabCardSubtitle}>{doc.category}</Text>
                </View>
                <File size={20} color="#8E8E93" />
              </View>
              <Text style={styles.tabCardMeta}>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
          );
        });
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/properties')}>
          <Building2 size={24} color="#007AFF" />
          <Text style={styles.statValue}>{dashboardStats.total_properties}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/properties')}>
          <Home size={24} color="#34C759" />
          <Text style={styles.statValue}>{dashboardStats.occupied_units}/{dashboardStats.total_units}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/tenants')}>
          <Users size={24} color="#AF52DE" />
          <Text style={styles.statValue}>{dashboardStats.total_tenant_renters}</Text>
          <Text style={styles.statLabel}>Tenants</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/payments')}>
          <DollarSign size={24} color="#FF9500" />
          <Text style={styles.statValue}>SCR {dashboardStats.total_revenue_month}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        
        {recentActivity.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color="#8E8E93" />
            <Text style={styles.emptyStateText}>No recent activity</Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  {activity.type === 'payment' && <DollarSign size={16} color="#007AFF" />}
                  {activity.type === 'maintenance' && <Wrench size={16} color="#FF9500" />}
                  {activity.type === 'lease' && <FileText size={16} color="#34C759" />}
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                </View>
                <Text style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overdue_payments' && styles.tabActive]}
              onPress={() => setActiveTab('overdue_payments')}
            >
              <AlertCircle size={18} color={activeTab === 'overdue_payments' ? '#007AFF' : '#8E8E93'} />
              <Text style={[styles.tabText, activeTab === 'overdue_payments' && styles.tabTextActive]}>
                Overdue Payments
              </Text>
              {overduePayments.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{overduePayments.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'pending_maintenance' && styles.tabActive]}
              onPress={() => setActiveTab('pending_maintenance')}
            >
              <Wrench size={18} color={activeTab === 'pending_maintenance' ? '#007AFF' : '#8E8E93'} />
              <Text style={[styles.tabText, activeTab === 'pending_maintenance' && styles.tabTextActive]}>
                Pending Maintenance
              </Text>
              {pendingMaintenance.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{pendingMaintenance.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'expiring_leases' && styles.tabActive]}
              onPress={() => setActiveTab('expiring_leases')}
            >
              <Calendar size={18} color={activeTab === 'expiring_leases' ? '#007AFF' : '#8E8E93'} />
              <Text style={[styles.tabText, activeTab === 'expiring_leases' && styles.tabTextActive]}>
                Expiring Leases
              </Text>
              {expiringLeases.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{expiringLeases.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'recent_files' && styles.tabActive]}
              onPress={() => setActiveTab('recent_files')}
            >
              <File size={18} color={activeTab === 'recent_files' ? '#007AFF' : '#8E8E93'} />
              <Text style={[styles.tabText, activeTab === 'recent_files' && styles.tabTextActive]}>
                Recent Files
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.tabContentContainer}>
          {renderTabContent()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  activityList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  activityItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabsScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600' as const,
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tabContentContainer: {
    padding: 16,
  },
  tabCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tabCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  tabCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tabCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabCardMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeError: {
    backgroundColor: '#FFEBEE',
  },
  badgeWarning: {
    backgroundColor: '#FFF3E0',
  },
  badgeInfo: {
    backgroundColor: '#E3F2FD',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
});
