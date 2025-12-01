import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { 
  FileText, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { TenantApplication, TenantApplicationStatus } from '@/types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import SwipeableItem, { SwipeAction } from '@/components/SwipeableItem';

export default function ApplicationsScreen() {
  const { tenantApplications, properties, units } = useApp();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusVariant = (status: TenantApplicationStatus): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'under_review':
        return 'info';
      case 'rejected':
      case 'withdrawn':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: TenantApplicationStatus) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
      case 'withdrawn':
        return XCircle;
      case 'under_review':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: TenantApplicationStatus): string => {
    switch (status) {
      case 'approved':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'under_review':
        return '#007AFF';
      case 'rejected':
      case 'withdrawn':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getApplicantName = (application: TenantApplication) => {
    if (application.applicant_type === 'business') {
      return application.business_name || 'Unnamed Business';
    }
    return `${application.applicant_first_name || ''} ${application.applicant_last_name || ''}`.trim() || 'Unnamed';
  };

  const handleViewApplication = (application: TenantApplication) => {
    router.push(`/applications/${application.id}`);
  };

  const renderApplication = ({ item }: { item: TenantApplication }) => {
    const property = properties.find(p => p.id === item.property_id);
    const unit = item.unit_id ? units.find(u => u.id === item.unit_id) : null;
    const StatusIcon = getStatusIcon(item.status);

    const swipeActions: SwipeAction[] = [
      {
        text: 'View',
        backgroundColor: '#007AFF',
        color: '#FFFFFF',
        icon: <Eye size={20} color="#FFFFFF" />,
        onPress: () => handleViewApplication(item),
        testID: `swipe-view-application-${item.id}`,
      },
    ];

    return (
      <SwipeableItem rightActions={swipeActions} testID={`swipeable-application-${item.id}`}>
        <Card style={styles.applicationCard}>
          <TouchableOpacity onPress={() => handleViewApplication(item)} activeOpacity={0.7}>
            <View style={styles.applicationHeader}>
              <View style={styles.applicantInfo}>
                <View style={styles.avatarContainer}>
                  {item.applicant_type === 'business' ? (
                    <Building size={24} color="#007AFF" />
                  ) : (
                    <User size={24} color="#007AFF" />
                  )}
                </View>
                <View style={styles.applicantDetails}>
                  <Text style={styles.applicantName}>{getApplicantName(item)}</Text>
                  <Text style={styles.applicantType}>
                    {item.applicant_type === 'business' ? 'Business' : 'Individual'}
                  </Text>
                </View>
              </View>
              <Badge label={item.status} variant={getStatusVariant(item.status)} />
            </View>

            <View style={styles.propertyInfo}>
              <View style={styles.infoRow}>
                <FileText size={16} color="#666" />
                <Text style={styles.infoText}>
                  {property?.name || 'Unknown Property'}
                  {unit && ` • Unit ${unit.unit_number}`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Calendar size={16} color="#666" />
                <Text style={styles.infoText}>Applied {formatDate(item.created_at)}</Text>
              </View>
            </View>

            <View style={styles.contactInfo}>
              <View style={styles.contactRow}>
                <Mail size={14} color="#666" />
                <Text style={styles.contactText} numberOfLines={1}>{item.applicant_email}</Text>
              </View>
              <View style={styles.contactRow}>
                <Phone size={14} color="#666" />
                <Text style={styles.contactText}>{item.applicant_phone}</Text>
              </View>
            </View>

            {item.desired_move_in_date && (
              <View style={styles.moveInInfo}>
                <Text style={styles.moveInLabel}>Desired Move-in:</Text>
                <Text style={styles.moveInDate}>{formatDate(item.desired_move_in_date)}</Text>
              </View>
            )}

            {item.status === 'pending' && (
              <View style={styles.statusIndicator}>
                <StatusIcon size={16} color={getStatusColor(item.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  Awaiting Review
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Card>
      </SwipeableItem>
    );
  };

  const pendingApplications = tenantApplications.filter(a => a.status === 'pending');
  const underReviewApplications = tenantApplications.filter(a => a.status === 'under_review');
  const approvedApplications = tenantApplications.filter(a => a.status === 'approved');
  const otherApplications = tenantApplications.filter(a => 
    a.status !== 'pending' && a.status !== 'under_review' && a.status !== 'approved'
  );

  const sortedApplications = [
    ...pendingApplications,
    ...underReviewApplications,
    ...approvedApplications,
    ...otherApplications,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Applications</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingApplications.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{underReviewApplications.length}</Text>
            <Text style={styles.statLabel}>Under Review</Text>
          </View>
        </View>
      </View>

      {sortedApplications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Applications"
          message="Applications from prospective tenants will appear here"
          testID="applications-empty"
        />
      ) : (
        <FlatList
          data={sortedApplications}
          renderItem={renderApplication}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#007AFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  list: {
    padding: 16,
  },
  applicationCard: {
    marginBottom: 16,
  },
  applicationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  applicantInfo: {
    flex: 1,
    flexDirection: 'row' as const,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  applicantDetails: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  applicantName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  applicantType: {
    fontSize: 12,
    color: '#999',
  },
  propertyInfo: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  contactInfo: {
    flexDirection: 'row' as const,
    gap: 16,
    marginBottom: 12,
  },
  contactRow: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  moveInInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 8,
  },
  moveInLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  moveInDate: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  statusIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
