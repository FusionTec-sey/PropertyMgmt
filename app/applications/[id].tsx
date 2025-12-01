import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin, 
  Briefcase, DollarSign, Home, Users, PawPrint, Calendar, Shield, FileText,
  Eye, AlertCircle, CheckCircle2
} from 'lucide-react-native';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { useApp } from '@/contexts/AppContext';
import type { TenantRenter, TenantApplication } from '@/types';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams();
  const { tenantApplications, updateTenantApplication, properties, units, addTenantRenter } = useApp();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedScreeningType, setSelectedScreeningType] = useState<'credit' | 'background' | 'reference' | null>(null);
  const [screeningResult, setScreeningResult] = useState<'pass' | 'fail'>('pass');
  const [creditScore, setCreditScore] = useState('');

  const application = useMemo(() => 
    tenantApplications.find(a => a.id === id),
    [tenantApplications, id]
  );

  const property = useMemo(() => 
    properties.find(p => p.id === application?.property_id),
    [properties, application]
  );

  const unit = useMemo(() => 
    units.find(u => u.id === application?.unit_id),
    [units, application]
  );

  React.useEffect(() => {
    console.log('Application ID:', id);
    console.log('Application:', application);
  }, [id, application]);

  if (!application) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Application Not Found' }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Application not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const handleApprove = async () => {
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    await updateTenantApplication(application.id, {
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
    });
    
    Alert.alert(
      'Create Tenant?',
      'Application approved! Would you like to automatically create a tenant from this application?',
      [
        {
          text: 'No, Later',
          style: 'cancel',
          onPress: () => {
            setShowApproveModal(false);
            router.back();
          },
        },
        {
          text: 'Yes, Create Tenant',
          onPress: async () => {
            await createTenantFromApplication();
            setShowApproveModal(false);
          },
        },
      ]
    );
  };

  const createTenantFromApplication = async () => {
    const tenantData: Omit<TenantRenter, 'id' | 'created_at' | 'updated_at' | 'tenant_id'> = {
      type: application.applicant_type,
      first_name: application.applicant_type === 'individual' ? application.applicant_first_name : undefined,
      last_name: application.applicant_type === 'individual' ? application.applicant_last_name : undefined,
      business_name: application.applicant_type === 'business' ? application.business_name : undefined,
      email: application.applicant_email,
      phone: application.applicant_phone,
      date_of_birth: application.date_of_birth,
      emergency_contact_name: application.emergency_contact_name,
      emergency_contact_phone: application.emergency_contact_phone,
      id_number: application.id_number,
      id_type: application.id_type,
      address: application.current_address,
      island: application.island,
      postal_code: application.postal_code,
      country: application.country,
      notes: application.additional_notes,
    };

    try {
      const newTenant = await addTenantRenter(tenantData);
      
      await updateTenantApplication(application.id, {
        tenant_renter_id: newTenant?.id,
      });

      Alert.alert(
        'Tenant Created',
        'Tenant created successfully! Would you like to create a lease for them now?',
        [
          {
            text: 'Later',
            onPress: () => router.back(),
          },
          {
            text: 'Create Lease',
            onPress: () => {
              router.back();
              setTimeout(() => {
                router.push('/(tabs)/tenants');
              }, 100);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating tenant:', error);
      Alert.alert('Error', 'Failed to create tenant. Please try again manually.');
      router.back();
    }
  };

  const handleReject = async () => {
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection.');
      return;
    }
    await updateTenantApplication(application.id, {
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectReason,
      review_notes: reviewNotes,
    });
    setShowRejectModal(false);
    Alert.alert('Application Rejected', 'The applicant will be notified.');
    router.back();
  };

  const handleScreeningUpdate = (type: 'credit' | 'background' | 'reference') => {
    setSelectedScreeningType(type);
    setScreeningResult('pass');
    setCreditScore('');
    setShowScreeningModal(true);
  };

  const confirmScreeningUpdate = async () => {
    if (!selectedScreeningType) return;
    
    const updates: Partial<TenantApplication> = {
      status: application.status === 'pending' ? 'under_review' : application.status,
    };

    if (selectedScreeningType === 'credit') {
      updates.credit_check_result = screeningResult;
      if (creditScore) {
        updates.credit_score = parseInt(creditScore);
      }
    } else if (selectedScreeningType === 'background') {
      updates.background_check_result = screeningResult;
    } else if (selectedScreeningType === 'reference') {
      updates.reference_check_result = screeningResult;
    }

    await updateTenantApplication(application.id, updates);
    setShowScreeningModal(false);
    Alert.alert('Success', 'Screening result updated successfully.');
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
                <Text style={styles.applicantName}>
                  {application.applicant_type === 'business' 
                    ? application.business_name 
                    : `${application.applicant_first_name} ${application.applicant_last_name}`}
                </Text>
                <Text style={styles.applicantEmail}>{application.applicant_email}</Text>
                <Text style={styles.applicationDate}>
                  Applied: {new Date(application.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Badge 
                label={application.status.replace('_', ' ').toUpperCase()} 
                variant={getStatusVariant(application.status)} 
              />
            </View>
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Card style={styles.infoCard}>
              <InfoRow icon={<Mail size={18} color="#666" />} label="Email" value={application.applicant_email} />
              <InfoRow icon={<Phone size={18} color="#666" />} label="Phone" value={application.applicant_phone} />
              {application.current_address && (
                <InfoRow icon={<MapPin size={18} color="#666" />} label="Current Address" value={application.current_address} />
              )}
              {application.date_of_birth && (
                <InfoRow icon={<Calendar size={18} color="#666" />} label="Date of Birth" value={new Date(application.date_of_birth).toLocaleDateString()} />
              )}
              {application.id_type && (
                <InfoRow icon={<FileText size={18} color="#666" />} label="ID Type" value={application.id_type} />
              )}
              {application.id_number && (
                <InfoRow icon={<FileText size={18} color="#666" />} label="ID Number" value={application.id_number} />
              )}
            </Card>
          </View>

          {application.employment_status && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Employment & Income</Text>
              <Card style={styles.infoCard}>
                <InfoRow icon={<Briefcase size={18} color="#666" />} label="Employment Status" value={application.employment_status} />
                {application.employer_name && (
                  <InfoRow icon={<Briefcase size={18} color="#666" />} label="Employer" value={application.employer_name} />
                )}
                {application.job_title && (
                  <InfoRow icon={<Briefcase size={18} color="#666" />} label="Job Title" value={application.job_title} />
                )}
                {application.monthly_income && (
                  <InfoRow icon={<DollarSign size={18} color="#666" />} label="Monthly Income" value={`₨${application.monthly_income.toLocaleString()} SCR`} />
                )}
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <Card style={styles.infoCard}>
              <InfoRow 
                icon={<Home size={18} color="#666" />} 
                label="Property" 
                value={property ? `${property.name}${unit ? ` - Unit ${unit.unit_number}` : ''}` : 'N/A'} 
              />
              {application.desired_move_in_date && (
                <InfoRow 
                  icon={<Calendar size={18} color="#666" />} 
                  label="Desired Move-in" 
                  value={new Date(application.desired_move_in_date).toLocaleDateString()} 
                />
              )}
              {application.number_of_occupants && (
                <InfoRow icon={<Users size={18} color="#666" />} label="Occupants" value={application.number_of_occupants.toString()} />
              )}
              <InfoRow 
                icon={<PawPrint size={18} color="#666" />} 
                label="Pets" 
                value={application.has_pets ? `${application.pet_type} (${application.pet_count})` : 'None'} 
              />
              {application.lease_duration_preference && (
                <InfoRow 
                  icon={<Calendar size={18} color="#666" />} 
                  label="Lease Duration" 
                  value={application.lease_duration_preference} 
                />
              )}
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screening Results</Text>
            <Card style={styles.screeningCard}>
              <ScreeningItem 
                label="Credit Check" 
                status={application.credit_check_result || 'pending'}
                score={application.credit_score}
                onUpdate={() => handleScreeningUpdate('credit')}
                disabled={application.status === 'approved' || application.status === 'rejected'}
              />
              <ScreeningItem 
                label="Background Check" 
                status={application.background_check_result || 'pending'}
                onUpdate={() => handleScreeningUpdate('background')}
                disabled={application.status === 'approved' || application.status === 'rejected'}
              />
              <ScreeningItem 
                label="Reference Check" 
                status={application.reference_check_result || 'pending'}
                onUpdate={() => handleScreeningUpdate('reference')}
                disabled={application.status === 'approved' || application.status === 'rejected'}
              />
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted Documents</Text>
            <Card style={styles.documentsCard}>
              {application.documents && application.documents.length > 0 ? (
                application.documents.map((doc) => (
                  <DocumentItem key={doc.id} document={doc} />
                ))
              ) : (
                <Text style={styles.noDocuments}>No documents uploaded yet</Text>
              )}
            </Card>
          </View>

          {application.additional_notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <Card style={styles.notesCard}>
                <Text style={styles.notesText}>{application.additional_notes}</Text>
              </Card>
            </View>
          )}

          {application.review_notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Review Notes</Text>
              <Card style={styles.notesCard}>
                <Text style={styles.notesText}>{application.review_notes}</Text>
                {application.reviewed_at && (
                  <Text style={styles.reviewDate}>
                    Reviewed: {new Date(application.reviewed_at).toLocaleString()}
                  </Text>
                )}
              </Card>
            </View>
          )}

          {application.status === 'rejected' && application.rejection_reason && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rejection Reason</Text>
              <Card style={[styles.notesCard, styles.rejectionCard]}>
                <Text style={styles.notesText}>{application.rejection_reason}</Text>
              </Card>
            </View>
          )}

          {application.status !== 'approved' && application.status !== 'rejected' && (
            <View style={styles.actions}>
              <Button
                title="Reject"
                onPress={handleReject}
                variant="outline"
                fullWidth
                testID="reject-button"
              />
              <Button
                title="Approve"
                onPress={handleApprove}
                fullWidth
                testID="approve-button"
              />
            </View>
          )}

          {application.status === 'approved' && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={24} color="#34C759" />
              <Text style={styles.successText}>Application Approved</Text>
            </View>
          )}

          {application.status === 'rejected' && (
            <View style={styles.errorBanner}>
              <XCircle size={24} color="#FF3B30" />
              <Text style={styles.errorBannerText}>Application Rejected</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Application"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            This will approve the application and allow you to create a lease for the applicant.
          </Text>
          
          <Text style={styles.inputLabel}>Review Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={reviewNotes}
            onChangeText={setReviewNotes}
            placeholder="Add any notes about your review..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setShowApproveModal(false)}
              variant="outline"
              fullWidth
            />
            <Button
              title="Approve"
              onPress={confirmApprove}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Application"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            Please provide a reason for rejecting this application.
          </Text>
          
          <Text style={styles.inputLabel}>Rejection Reason *</Text>
          <TextInput
            style={styles.textArea}
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Provide a clear reason for rejection..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={reviewNotes}
            onChangeText={setReviewNotes}
            placeholder="Add any additional notes..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setShowRejectModal(false)}
              variant="outline"
              fullWidth
            />
            <Button
              title="Reject"
              onPress={confirmReject}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showScreeningModal}
        onClose={() => setShowScreeningModal(false)}
        title={`Update ${selectedScreeningType?.charAt(0).toUpperCase()}${selectedScreeningType?.slice(1)} Check`}
      >
        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Result</Text>
          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[
                styles.resultButton,
                screeningResult === 'pass' && styles.resultButtonActive,
              ]}
              onPress={() => setScreeningResult('pass')}
            >
              <CheckCircle size={20} color={screeningResult === 'pass' ? '#34C759' : '#999'} />
              <Text style={[
                styles.resultButtonText,
                screeningResult === 'pass' && styles.resultButtonTextActive,
              ]}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resultButton,
                screeningResult === 'fail' && styles.resultButtonActive,
              ]}
              onPress={() => setScreeningResult('fail')}
            >
              <XCircle size={20} color={screeningResult === 'fail' ? '#FF3B30' : '#999'} />
              <Text style={[
                styles.resultButtonText,
                screeningResult === 'fail' && styles.resultButtonTextActive,
              ]}>Fail</Text>
            </TouchableOpacity>
          </View>

          {selectedScreeningType === 'credit' && (
            <>
              <Text style={styles.inputLabel}>Credit Score (Optional)</Text>
              <TextInput
                style={styles.input}
                value={creditScore}
                onChangeText={setCreditScore}
                placeholder="e.g., 720"
                keyboardType="numeric"
              />
            </>
          )}

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setShowScreeningModal(false)}
              variant="outline"
              fullWidth
            />
            <Button
              title="Update"
              onPress={confirmScreeningUpdate}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected': return 'danger';
    case 'under_review': return 'warning';
    default: return 'default';
  }
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

interface DocumentItemProps {
  document: {
    id: string;
    type: string;
    name: string;
    uri: string;
    uploaded_at: string;
  };
}

function DocumentItem({ document }: DocumentItemProps) {
  const getDocumentTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleView = () => {
    if (Platform.OS === 'web') {
      window.open(document.uri, '_blank');
    } else {
      Alert.alert('Document', `View: ${document.name}`);
    }
  };

  return (
    <View style={styles.documentItem}>
      <View style={styles.documentInfo}>
        <FileText size={18} color="#007AFF" />
        <View style={styles.documentDetails}>
          <Text style={styles.documentName}>{document.name}</Text>
          <Text style={styles.documentType}>{getDocumentTypeLabel(document.type)}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handleView} style={styles.documentAction}>
        <Eye size={18} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

interface ScreeningItemProps {
  label: string;
  status: 'pass' | 'fail' | 'pending' | 'not_required';
  score?: number;
  onUpdate?: () => void;
  disabled?: boolean;
}

function ScreeningItem({ label, status, score, onUpdate, disabled }: ScreeningItemProps) {
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
        <View>
          <Text style={styles.screeningLabelText}>{label}</Text>
          {score && (
            <Text style={styles.creditScoreText}>Score: {score}</Text>
          )}
        </View>
      </View>
      <View style={styles.screeningRight}>
        <View style={styles.screeningStatus}>
          {getIcon()}
          <Text style={[styles.screeningStatusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        {onUpdate && !disabled && (
          <TouchableOpacity onPress={onUpdate} style={styles.updateButton}>
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        )}
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
  applicationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    textAlign: 'center' as const,
  },
  notesCard: {
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },
  rejectionCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  successBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F0FFF4',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  errorBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  errorBannerText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
  modalContent: {
    gap: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#F8F9FA',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 8,
  },
  resultButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  resultButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  resultButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  resultButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#999',
  },
  resultButtonTextActive: {
    color: '#007AFF',
  },
  documentItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#666',
  },
  documentAction: {
    padding: 8,
  },
  screeningRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  updateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  creditScoreText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
});
