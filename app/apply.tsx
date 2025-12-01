import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { ArrowLeft, User, Building, Upload, FileText } from 'lucide-react-native';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';

export default function TenantApplicationScreen() {
  const [step, setStep] = useState<number>(1);
  const [applicationType, setApplicationType] = useState<'individual' | 'business'>('individual');
  
  const [formData, setFormData] = useState({
    applicant_type: 'individual' as 'individual' | 'business',
    first_name: '',
    last_name: '',
    business_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    id_type: '',
    id_number: '',
    current_address: '',
    employment_status: '',
    employer_name: '',
    job_title: '',
    monthly_income: '',
    previous_address: '',
    previous_landlord_name: '',
    previous_landlord_phone: '',
    reason_for_moving: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    number_of_occupants: '',
    has_pets: false,
    pet_type: '',
    pet_count: '',
    desired_move_in_date: '',
    property_id: '',
    unit_id: '',
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.email || !formData.phone) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      if (applicationType === 'individual' && (!formData.first_name || !formData.last_name)) {
        Alert.alert('Error', 'Please fill in your name');
        return;
      }
      if (applicationType === 'business' && !formData.business_name) {
        Alert.alert('Error', 'Please fill in business name');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'Submit Application',
      'Your application will be reviewed by the property owner. You will be notified once a decision is made.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert('Success', 'Your application has been submitted successfully!');
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
          title: 'Tenant Application',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.progressBar}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 4 && styles.progressStepActive]} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Personal Information</Text>
              <Text style={styles.stepDescription}>Let's start with your basic information</Text>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Applicant Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeButton, applicationType === 'individual' && styles.typeButtonActive]}
                    onPress={() => {
                      setApplicationType('individual');
                      setFormData({ ...formData, applicant_type: 'individual' });
                    }}
                  >
                    <User size={20} color={applicationType === 'individual' ? '#FFFFFF' : '#666'} />
                    <Text style={[styles.typeButtonText, applicationType === 'individual' && styles.typeButtonTextActive]}>
                      Individual
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, applicationType === 'business' && styles.typeButtonActive]}
                    onPress={() => {
                      setApplicationType('business');
                      setFormData({ ...formData, applicant_type: 'business' });
                    }}
                  >
                    <Building size={20} color={applicationType === 'business' ? '#FFFFFF' : '#666'} />
                    <Text style={[styles.typeButtonText, applicationType === 'business' && styles.typeButtonTextActive]}>
                      Business
                    </Text>
                  </TouchableOpacity>
                </View>

                {applicationType === 'individual' ? (
                  <>
                    <View style={styles.row}>
                      <Input
                        label="First Name"
                        value={formData.first_name}
                        onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                        placeholder="John"
                        required
                        containerStyle={styles.halfInput}
                      />
                      <Input
                        label="Last Name"
                        value={formData.last_name}
                        onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                        placeholder="Doe"
                        required
                        containerStyle={styles.halfInput}
                      />
                    </View>
                    <Input
                      label="Date of Birth"
                      value={formData.date_of_birth}
                      onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
                      placeholder="YYYY-MM-DD"
                    />
                  </>
                ) : (
                  <Input
                    label="Business Name"
                    value={formData.business_name}
                    onChangeText={(text) => setFormData({ ...formData, business_name: text })}
                    placeholder="ABC Company Ltd"
                    required
                  />
                )}

                <Input
                  label="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  required
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="+248 xxx xxxx"
                  keyboardType="phone-pad"
                  required
                />
                <Input
                  label="Current Address"
                  value={formData.current_address}
                  onChangeText={(text) => setFormData({ ...formData, current_address: text })}
                  placeholder="123 Main St, Victoria"
                  multiline
                  numberOfLines={2}
                />
              </Card>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Employment & Income</Text>
              <Text style={styles.stepDescription}>Tell us about your employment status</Text>

              <Card style={styles.card}>
                <Select
                  label="Employment Status"
                  value={formData.employment_status}
                  onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
                  options={[
                    { label: 'Employed', value: 'employed' },
                    { label: 'Self-Employed', value: 'self_employed' },
                    { label: 'Unemployed', value: 'unemployed' },
                    { label: 'Retired', value: 'retired' },
                    { label: 'Student', value: 'student' },
                  ]}
                  placeholder="Select employment status"
                />
                
                <Input
                  label="Employer Name"
                  value={formData.employer_name}
                  onChangeText={(text) => setFormData({ ...formData, employer_name: text })}
                  placeholder="ABC Company"
                />
                <Input
                  label="Job Title"
                  value={formData.job_title}
                  onChangeText={(text) => setFormData({ ...formData, job_title: text })}
                  placeholder="Software Engineer"
                />
                <Input
                  label="Monthly Income (SCR)"
                  value={formData.monthly_income}
                  onChangeText={(text) => setFormData({ ...formData, monthly_income: text })}
                  placeholder="15000"
                  keyboardType="numeric"
                />

                <Text style={styles.subsectionTitle}>Previous Landlord (Optional)</Text>
                <Input
                  label="Previous Landlord Name"
                  value={formData.previous_landlord_name}
                  onChangeText={(text) => setFormData({ ...formData, previous_landlord_name: text })}
                  placeholder="John Smith"
                />
                <Input
                  label="Previous Landlord Phone"
                  value={formData.previous_landlord_phone}
                  onChangeText={(text) => setFormData({ ...formData, previous_landlord_phone: text })}
                  placeholder="+248 xxx xxxx"
                  keyboardType="phone-pad"
                />
              </Card>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Additional Details</Text>
              <Text style={styles.stepDescription}>Help us understand your needs better</Text>

              <Card style={styles.card}>
                <Input
                  label="Emergency Contact Name"
                  value={formData.emergency_contact_name}
                  onChangeText={(text) => setFormData({ ...formData, emergency_contact_name: text })}
                  placeholder="Jane Doe"
                  required
                />
                <Input
                  label="Emergency Contact Phone"
                  value={formData.emergency_contact_phone}
                  onChangeText={(text) => setFormData({ ...formData, emergency_contact_phone: text })}
                  placeholder="+248 xxx xxxx"
                  keyboardType="phone-pad"
                  required
                />
                <Input
                  label="Relationship"
                  value={formData.emergency_contact_relationship}
                  onChangeText={(text) => setFormData({ ...formData, emergency_contact_relationship: text })}
                  placeholder="Spouse, Parent, etc."
                />

                <Input
                  label="Number of Occupants"
                  value={formData.number_of_occupants}
                  onChangeText={(text) => setFormData({ ...formData, number_of_occupants: text })}
                  placeholder="2"
                  keyboardType="numeric"
                />

                <Text style={styles.subsectionTitle}>Pets</Text>
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, formData.has_pets && styles.checkboxChecked]}
                    onPress={() => setFormData({ ...formData, has_pets: !formData.has_pets })}
                  >
                    {formData.has_pets && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>I have pets</Text>
                </View>

                {formData.has_pets && (
                  <>
                    <Input
                      label="Pet Type"
                      value={formData.pet_type}
                      onChangeText={(text) => setFormData({ ...formData, pet_type: text })}
                      placeholder="Dog, Cat, etc."
                    />
                    <Input
                      label="Number of Pets"
                      value={formData.pet_count}
                      onChangeText={(text) => setFormData({ ...formData, pet_count: text })}
                      placeholder="1"
                      keyboardType="numeric"
                    />
                  </>
                )}

                <Input
                  label="Desired Move-in Date"
                  value={formData.desired_move_in_date}
                  onChangeText={(text) => setFormData({ ...formData, desired_move_in_date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </Card>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.stepTitle}>Documents & Verification</Text>
              <Text style={styles.stepDescription}>Upload supporting documents</Text>

              <Card style={styles.card}>
                <View style={styles.uploadSection}>
                  <FileText size={48} color="#007AFF" />
                  <Text style={styles.uploadTitle}>Upload Documents</Text>
                  <Text style={styles.uploadDescription}>
                    Please upload copies of your ID, proof of income, and any reference letters
                  </Text>
                  <Button
                    title="Choose Files"
                    onPress={() => Alert.alert('Info', 'Document upload coming soon')}
                    variant="outline"
                    icon={<Upload size={20} color="#007AFF" />}
                  />
                </View>

                <View style={styles.consentSection}>
                  <Text style={styles.consentTitle}>Screening Authorization</Text>
                  <Text style={styles.consentText}>
                    By submitting this application, you authorize the landlord to conduct background,{' '}
                    credit, and reference checks as part of the tenant screening process.
                  </Text>
                </View>
              </Card>
            </>
          )}

          <View style={styles.actions}>
            {step < 4 && (
              <Button
                title="Continue"
                onPress={handleNext}
                fullWidth
                testID="continue-button"
              />
            )}
            {step === 4 && (
              <Button
                title="Submit Application"
                onPress={handleSubmit}
                fullWidth
                testID="submit-button"
              />
            )}
          </View>
        </View>
      </ScrollView>
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
  progressBar: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  uploadSection: {
    alignItems: 'center' as const,
    padding: 32,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed' as const,
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  consentSection: {
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  consentText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    marginBottom: 32,
  },
});
