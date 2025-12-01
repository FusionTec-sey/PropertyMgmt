import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { 
  Building2, 
  Home, 
  Users, 
  FileText, 
  DollarSign, 
  AlertCircle,
  Calendar,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const { dashboardStats, currentTenant, properties, leases, maintenanceRequests } = useApp();

  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
    onPress,
  }: {
    icon: any;
    title: string;
    value: string | number;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SCR`;
  };

  const recentLeases = leases.slice(-3).reverse();
  const urgentMaintenance = maintenanceRequests.filter(
    (m) => m.priority === 'urgent' || m.priority === 'high'
  ).slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.tenantName}>{currentTenant?.name}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon={Building2}
          title="Properties"
          value={dashboardStats.total_properties}
          color="#007AFF"
          onPress={() => router.push('/(tabs)/properties')}
        />
        <StatCard
          icon={Home}
          title="Total Units"
          value={dashboardStats.total_units}
          color="#34C759"
        />
        <StatCard
          icon={Home}
          title="Occupied"
          value={dashboardStats.occupied_units}
          color="#5856D6"
        />
        <StatCard
          icon={Home}
          title="Available"
          value={dashboardStats.available_units}
          color="#FF9500"
        />
        <StatCard
          icon={Users}
          title="Tenants"
          value={dashboardStats.total_tenant_renters}
          color="#FF2D55"
          onPress={() => router.push('/(tabs)/tenants')}
        />
        <StatCard
          icon={FileText}
          title="Active Leases"
          value={dashboardStats.active_leases}
          color="#00C7BE"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Revenue</Text>
        </View>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>This Month</Text>
          <Text style={styles.revenueValue}>
            {formatCurrency(dashboardStats.total_revenue_month)}
          </Text>
          <View style={styles.paymentStats}>
            <View style={styles.paymentStat}>
              <View style={[styles.dot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.paymentStatText}>
                Pending: {dashboardStats.pending_payments}
              </Text>
            </View>
            <View style={styles.paymentStat}>
              <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.paymentStatText}>
                Overdue: {dashboardStats.overdue_payments}
              </Text>
            </View>
          </View>
        </View>
      </View>

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
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tenantName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: 12,
  },
  statCard: {
    width: '31%' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    margin: '1%' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center' as const,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  revenueCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  paymentStats: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  paymentStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentStatText: {
    fontSize: 14,
    color: '#666',
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
});
