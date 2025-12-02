import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, Check, Building2, User, MapPin, FileText } from 'lucide-react-native';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Tenant, User as UserType } from '@/types';

const STEPS = [
  { id: 1, title: 'Business Info', icon: Building2 },
  { id: 2, title: 'Owner Details', icon: User },
  { id: 3, title: 'Location', icon: MapPin },
  { id: 4, title: 'Preferences', icon: FileText },
];

export default function OnboardingScreen() {
  const { addTenant, login } = useApp();
  const { colors, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    email: '',
    phone: '',
  });

  const [ownerInfo, setOwnerInfo] = useState({
    firstName: '',
    lastName: '',
    ownerEmail: '',
    ownerPhone: '',
  });

  const [locationInfo, setLocationInfo] = useState({
    address: '',
    city: '',
    island: '',
    country: 'Seychelles',
  });

  const [preferences, setPreferences] = useState({
    currency: 'SCR',
    timezone: 'Indian/Mahe',
    defaultRentDay: '1',
  });

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!businessInfo.businessName.trim()) {
          Alert.alert('Required', 'Please enter your business name');
          return false;
        }
        if (!businessInfo.email.trim()) {
          Alert.alert('Required', 'Please enter your business email');
          return false;
        }
        if (!businessInfo.email.includes('@')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
          return false;
        }
        return true;
      case 2:
        if (!ownerInfo.firstName.trim()) {
          Alert.alert('Required', 'Please enter your first name');
          return false;
        }
        if (!ownerInfo.lastName.trim()) {
          Alert.alert('Required', 'Please enter your last name');
          return false;
        }
        if (!ownerInfo.ownerEmail.trim()) {
          Alert.alert('Required', 'Please enter your email');
          return false;
        }
        if (!ownerInfo.ownerEmail.includes('@')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
          return false;
        }
        return true;
      case 3:
        if (!locationInfo.city.trim()) {
          Alert.alert('Required', 'Please enter your city');
          return false;
        }
        if (!locationInfo.island.trim()) {
          Alert.alert('Required', 'Please enter your island');
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      console.log('[ONBOARDING] Creating business profile...');

      const tenant: Omit<Tenant, 'id' | 'created_at'> = {
        name: businessInfo.businessName,
        email: businessInfo.email,
        phone: businessInfo.phone,
        address: locationInfo.address || `${locationInfo.city}, ${locationInfo.island}`,
        subscription_plan: 'professional',
        subscription_status: 'active',
      };

      const createdTenant = await addTenant(tenant);

      if (!createdTenant) {
        throw new Error('Failed to create business profile');
      }

      console.log('[ONBOARDING] Business profile created:', createdTenant.id);

      const user: UserType = {
        id: Date.now().toString(),
        tenant_id: createdTenant.id,
        email: ownerInfo.ownerEmail,
        first_name: ownerInfo.firstName,
        last_name: ownerInfo.lastName,
        phone: ownerInfo.ownerPhone,
        role: 'owner',
        is_active: true,
        created_at: new Date().toISOString(),
      };

      console.log('[ONBOARDING] Logging in user...');
      await login(createdTenant, user);

      console.log('[ONBOARDING] Onboarding completed successfully');
      
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('[ONBOARDING] Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor:
                  currentStep > step.id
                    ? colors.success
                    : currentStep === step.id
                    ? colors.tint
                    : isDark
                    ? colors.card
                    : '#E5E7EB',
                borderColor: currentStep >= step.id ? colors.tint : 'transparent',
              },
            ]}
          >
            {currentStep > step.id ? (
              <Check size={16} color="#fff" />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  { color: currentStep === step.id ? '#fff' : colors.textSecondary },
                ]}
              >
                {step.id}
              </Text>
            )}
          </View>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor:
                    currentStep > step.id
                      ? colors.success
                      : isDark
                      ? colors.card
                      : '#E5E7EB',
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
              <Building2 size={32} color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Business Information</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Let&apos;s start by setting up your business profile
            </Text>

            <View style={styles.form}>
              <Input
                label="Business Name *"
                value={businessInfo.businessName}
                onChangeText={(value) =>
                  setBusinessInfo({ ...businessInfo, businessName: value })
                }
                placeholder="e.g. ABC Property Management"
                testID="business-name-input"
              />
              <Input
                label="Business Email *"
                value={businessInfo.email}
                onChangeText={(value) => setBusinessInfo({ ...businessInfo, email: value })}
                placeholder="business@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="business-email-input"
              />
              <Input
                label="Business Phone"
                value={businessInfo.phone}
                onChangeText={(value) => setBusinessInfo({ ...businessInfo, phone: value })}
                placeholder="+248 xxx xxxx"
                keyboardType="phone-pad"
                testID="business-phone-input"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
              <User size={32} color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Owner Details</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Tell us about yourself as the business owner
            </Text>

            <View style={styles.form}>
              <Input
                label="First Name *"
                value={ownerInfo.firstName}
                onChangeText={(value) => setOwnerInfo({ ...ownerInfo, firstName: value })}
                placeholder="John"
                testID="owner-first-name-input"
              />
              <Input
                label="Last Name *"
                value={ownerInfo.lastName}
                onChangeText={(value) => setOwnerInfo({ ...ownerInfo, lastName: value })}
                placeholder="Doe"
                testID="owner-last-name-input"
              />
              <Input
                label="Email *"
                value={ownerInfo.ownerEmail}
                onChangeText={(value) => setOwnerInfo({ ...ownerInfo, ownerEmail: value })}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="owner-email-input"
              />
              <Input
                label="Phone"
                value={ownerInfo.ownerPhone}
                onChangeText={(value) => setOwnerInfo({ ...ownerInfo, ownerPhone: value })}
                placeholder="+248 xxx xxxx"
                keyboardType="phone-pad"
                testID="owner-phone-input"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
              <MapPin size={32} color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Location</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Where is your business located?
            </Text>

            <View style={styles.form}>
              <Input
                label="Street Address"
                value={locationInfo.address}
                onChangeText={(value) => setLocationInfo({ ...locationInfo, address: value })}
                placeholder="123 Main Street"
                testID="address-input"
              />
              <Input
                label="City *"
                value={locationInfo.city}
                onChangeText={(value) => setLocationInfo({ ...locationInfo, city: value })}
                placeholder="Victoria"
                testID="city-input"
              />
              <Input
                label="Island *"
                value={locationInfo.island}
                onChangeText={(value) => setLocationInfo({ ...locationInfo, island: value })}
                placeholder="Mahé"
                testID="island-input"
              />
              <Input
                label="Country"
                value={locationInfo.country}
                onChangeText={(value) => setLocationInfo({ ...locationInfo, country: value })}
                placeholder="Seychelles"
                testID="country-input"
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
              <FileText size={32} color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Preferences</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Set your default preferences for the app
            </Text>

            <View style={styles.form}>
              <View style={styles.preferenceSection}>
                <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                  Default Currency
                </Text>
                <View style={styles.optionsRow}>
                  {['SCR', 'EUR', 'USD'].map((currency) => (
                    <Pressable
                      key={currency}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor:
                            preferences.currency === currency
                              ? colors.tint
                              : isDark
                              ? colors.card
                              : '#F3F4F6',
                          borderColor:
                            preferences.currency === currency
                              ? colors.tint
                              : 'transparent',
                        },
                      ]}
                      onPress={() => setPreferences({ ...preferences, currency })}
                      testID={`currency-${currency.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              preferences.currency === currency
                                ? '#fff'
                                : colors.text,
                          },
                        ]}
                      >
                        {currency}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.preferenceSection}>
                <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                  Default Rent Due Day
                </Text>
                <View style={styles.optionsRow}>
                  {['1', '15', '28'].map((day) => (
                    <Pressable
                      key={day}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor:
                            preferences.defaultRentDay === day
                              ? colors.tint
                              : isDark
                              ? colors.card
                              : '#F3F4F6',
                          borderColor:
                            preferences.defaultRentDay === day
                              ? colors.tint
                              : 'transparent',
                        },
                      ]}
                      onPress={() =>
                        setPreferences({ ...preferences, defaultRentDay: day })
                      }
                      testID={`rent-day-${day}`}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              preferences.defaultRentDay === day
                                ? '#fff'
                                : colors.text,
                          },
                        ]}
                      >
                        {day}
                        {day === '1' ? 'st' : day === '28' ? 'th' : 'th'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                You can change these settings anytime in the app settings
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Welcome to Your Property Management App
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Let&apos;s get your business set up in just a few steps
            </Text>
          </View>

          {renderStepIndicator()}
          {renderStepContent()}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={[
                  styles.backButton,
                  {
                    backgroundColor: isDark ? colors.card : '#F3F4F6',
                  },
                ]}
                onPress={handleBack}
                disabled={isLoading}
                testID="back-button"
              >
                <ChevronLeft size={20} color={colors.text} />
                <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
            )}

            <Button
              title={currentStep === STEPS.length ? 'Complete Setup' : 'Next'}
              onPress={handleNext}
              loading={isLoading}
              style={[styles.nextButton, currentStep === 1 && styles.fullWidthButton]}
              testID="next-button"
              rightIcon={
                currentStep < STEPS.length ? (
                  <ChevronRight size={20} color="#fff" />
                ) : undefined
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  stepIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 40,
  },
  stepItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  stepContent: {
    alignItems: 'center' as const,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    gap: 16,
  },
  preferenceSection: {
    marginBottom: 24,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: 16,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  nextButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
});
