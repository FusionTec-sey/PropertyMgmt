import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin, 
  Briefcase, DollarSign, Home, Users, PawPrint, Calendar, Shield
} from 'lucide-react-native';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams();

  React.useEffect(() => {
    console.log('Application ID:', id);
  }, [id]);

  const handleApprove = () => {
    Alert.alert(
      'Approve Application',
      'This will approve the application and allow you to proceed with creating a lease.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            Alert.alert('Success', 'Application approved! You can now create a lease.');
            router.back();
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.prompt(
      'Reject Application',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: (_reason?: string) => {
            Alert.alert('Application Rejected', 'The applicant will be notified.');
            router.back();
          },
        },
      ]
    );
  };



  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Application Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Card style={styles.headerCard}>
            <View style={styles.applicantHeader}>
              <View style={styles.avatar}>
                <User size={32} color="#007AFF" />
              </View>
              <View style={styles.applicantInfo}>
                <Text style={styles.applicantName}>Sample Applicant</Text>
                <Text style={styles.applicantEmail}>applicant@example.com</Text>
              </View>
              <Badge label="Pending" variant="default" />
            </View>
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Card style={styles.infoCard}>
              <InfoRow icon={<Mail size={18} color="#666" />} label="Email" value="applicant@example.com" />
              <InfoRow icon={<Phone size={18} color="#666" />} label="Phone" value="+248 123 4567" />
              <InfoRow icon={<MapPin size={18} color="#666" />} label="Current Address" value="123 Main St, Victoria" />
              <InfoRow icon={<Calendar size={18} color="#666" />} label="Date of Birth" value="1990-01-01" />
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employment & Income</Text>
            <Card style={styles.infoCard}>
              <InfoRow icon={<Briefcase size={18} color="#666" />} label="Employment Status" value="Employed" />
              <InfoRow icon={<Briefcase size={18} color="#666" />} label="Employer" value="ABC Company" />
              <InfoRow icon={<DollarSign size={18} color="#666" />} label="Monthly Income" value="₨15,000 SCR" />
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <Card style={styles.infoCard}>
              <InfoRow icon={<Home size={18} color="#666" />} label="Property" value="Sample Property" />
              <InfoRow icon={<Calendar size={18} color="#666" />} label="Desired Move-in" value="2025-01-01" />
              <InfoRow icon={<Users size={18} color="#666" />} label="Occupants" value="2" />
              <InfoRow icon={<PawPrint size={18} color="#666" />} label="Pets" value="None" />
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screening Results</Text>
            <Card style={styles.screeningCard}>
              <ScreeningItem label="Credit Check" status="pending" />
              <ScreeningItem label="Background Check" status="pending" />
              <ScreeningItem label="Reference Check" status="pending" />
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted Documents</Text>
            <Card style={styles.documentsCard}>
              <Text style={styles.noDocuments}>No documents uploaded yet</Text>
            </Card>
          </View>

          <View style={styles.actions}>
            <Button
              title="Reject"
              onPress={handleReject}
              variant="outline"
              fullWidth
              testID="reject-button"
            />
            <Button
              title="Approve & Create Lease"
              onPress={handleApprove}
              fullWidth
              testID="approve-button"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

interface ScreeningItemProps {
  label: string;
  status: 'pass' | 'fail' | 'pending';
}

function ScreeningItem({ label, status }: ScreeningItemProps) {
  const getIcon = () => {
    if (status === 'pass') return <CheckCircle size={20} color="#34C759" />;
    if (status === 'fail') return <XCircle size={20} color="#FF3B30" />;
    return <Clock size={20} color="#FF9500" />;
  };

  const getStatusText = () => {
    if (status === 'pass') return 'Passed';
    if (status === 'fail') return 'Failed';
    return 'Pending';
  };

  const getStatusColor = () => {
    if (status === 'pass') return '#34C759';
    if (status === 'fail') return '#FF3B30';
    return '#FF9500';
  };

  return (
    <View style={styles.screeningItem}>
      <View style={styles.screeningLabel}>
        <Shield size={18} color="#666" />
        <Text style={styles.screeningLabelText}>{label}</Text>
      </View>
      <View style={styles.screeningStatus}>
        {getIcon()}
        <Text style={[styles.screeningStatusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 20,
  },
  applicantHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  applicantEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  infoCard: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  infoLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  infoLabelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  screeningCard: {
    gap: 16,
  },
  screeningItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  screeningLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  screeningLabelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  screeningStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  screeningStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  documentsCard: {
    minHeight: 100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  noDocuments: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic' as const,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
});
