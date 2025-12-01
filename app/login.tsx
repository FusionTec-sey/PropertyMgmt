import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Plus, Wifi, WifiOff } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import type { Tenant, User } from '@/types';

export default function LoginScreen() {
  const router = useRouter();
  const { isLoading, currentTenant, currentUser, tenants, login, addTenant, staffUsers } = useApp();
  const [showNewTenant, setShowNewTenant] = useState<boolean>(false);
  const [showStaffLogin, setShowStaffLogin] = useState<boolean>(false);
  const [selectedTenantForStaff, setSelectedTenantForStaff] = useState<Tenant | null>(null);
  const [newTenantName, setNewTenantName] = useState<string>('');
  const [newTenantEmail, setNewTenantEmail] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'staff'>('owner');
  
  const healthQuery = trpc.health.useQuery(undefined, {
    retry: 1,
    refetchInterval: false,
  });

  useEffect(() => {
    if (currentTenant && currentUser) {
      router.replace('/(tabs)');
    }
  }, [currentTenant, currentUser, router]);

  const handleCreateTenant = async () => {
    if (!newTenantName.trim() || !newTenantEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const tenant = await addTenant({
      name: newTenantName.trim(),
      email: newTenantEmail.trim(),
      subscription_plan: 'professional',
      subscription_status: 'active',
    });

    if (tenant) {
      const defaultUser: User = {
        id: Date.now().toString(),
        tenant_id: tenant.id,
        email: newTenantEmail.trim(),
        first_name: selectedRole === 'owner' ? 'Admin' : 'Staff',
        last_name: 'User',
        role: selectedRole === 'owner' ? 'owner' : 'maintenance',
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await login(tenant, defaultUser);
      setNewTenantName('');
      setNewTenantEmail('');
      setShowNewTenant(false);
      router.replace('/(tabs)');
    }
  };

  const handleSelectTenant = async (tenant: Tenant, role: 'owner') => {
    const defaultUser: User = {
      id: Date.now().toString(),
      tenant_id: tenant.id,
      email: tenant.email,
      first_name: 'Admin',
      last_name: 'User',
      role: 'owner',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    await login(tenant, defaultUser);
    router.replace('/(tabs)');
  };

  const handleSelectStaffLogin = (tenant: Tenant) => {
    setSelectedTenantForStaff(tenant);
    setShowStaffLogin(true);
  };

  const handleStaffUserSelect = async (staff: User) => {
    if (!selectedTenantForStaff) return;
    await login(selectedTenantForStaff, staff);
    router.replace('/(tabs)');
  };

  const availableStaffForTenant = selectedTenantForStaff ? 
    staffUsers.filter(u => u.tenant_id === selectedTenantForStaff.id) : [];

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Building2 size={48} color="#007AFF" />
          </View>
          <Text style={styles.title}>Property Manager</Text>
          <Text style={styles.subtitle}>Manage your properties with ease</Text>
          
          <View style={styles.backendStatus}>
            {healthQuery.isLoading ? (
              <ActivityIndicator size="small" color="#999" />
            ) : healthQuery.isSuccess ? (
              <View style={styles.statusRow}>
                <Wifi size={16} color="#4CAF50" />
                <Text style={styles.statusTextSuccess}>Backend Connected</Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <WifiOff size={16} color="#F44336" />
                <Text style={styles.statusTextError}>Backend Offline</Text>
              </View>
            )}
          </View>
        </View>

        {!showNewTenant && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Your Business</Text>
              {tenants.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No businesses found</Text>
                  <Text style={styles.emptySubtext}>Create your first business to get started</Text>
                </View>
              ) : (
                tenants.map((tenant) => (
                  <View key={tenant.id} style={styles.tenantCardContainer}>
                    <View style={styles.tenantCardHeader}>
                      <Building2 size={20} color="#007AFF" />
                      <Text style={styles.tenantCardTitle}>{tenant.name}</Text>
                    </View>
                    <Text style={styles.tenantCardEmail}>{tenant.email}</Text>
                    <View style={styles.roleButtons}>
                      <TouchableOpacity
                        style={[styles.roleButton, styles.ownerButton]}
                        onPress={() => handleSelectTenant(tenant, 'owner')}
                        testID={`login-owner-${tenant.id}`}
                      >
                        <Text style={styles.roleButtonText}>Login as Owner</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.roleButton, styles.staffButton]}
                        onPress={() => handleSelectStaffLogin(tenant)}
                        testID={`login-staff-${tenant.id}`}
                      >
                        <Text style={styles.roleButtonText}>Staff Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowNewTenant(true)}
            >
              <Plus size={20} color="#FFF" />
              <Text style={styles.createButtonText}>Create New Business</Text>
            </TouchableOpacity>
          </>
        )}

        {showNewTenant && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create New Business</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={newTenantName}
                onChangeText={setNewTenantName}
                placeholder="Acme Property Management"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={newTenantEmail}
                onChangeText={setNewTenantEmail}
                placeholder="admin@acme.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[styles.roleSelectorButton, selectedRole === 'owner' && styles.roleSelectorButtonActive]}
                  onPress={() => setSelectedRole('owner')}
                  testID="role-owner"
                >
                  <Text style={[styles.roleSelectorText, selectedRole === 'owner' && styles.roleSelectorTextActive]}>
                    Owner/Admin
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleSelectorButton, selectedRole === 'staff' && styles.roleSelectorButtonActive]}
                  onPress={() => setSelectedRole('staff')}
                  testID="role-staff"
                >
                  <Text style={[styles.roleSelectorText, selectedRole === 'staff' && styles.roleSelectorTextActive]}>
                    Staff
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateTenant}
            >
              <Text style={styles.submitButtonText}>Create Business</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowNewTenant(false);
                setNewTenantName('');
                setNewTenantEmail('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {showStaffLogin && selectedTenantForStaff && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Staff Account</Text>
            <Text style={styles.businessName}>{selectedTenantForStaff.name}</Text>
            
            {availableStaffForTenant.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No staff accounts found</Text>
                <Text style={styles.emptySubtext}>Contact your administrator to create a staff account</Text>
              </View>
            ) : (
              availableStaffForTenant.map((staff) => (
                <TouchableOpacity
                  key={staff.id}
                  style={styles.staffLoginCard}
                  onPress={() => handleStaffUserSelect(staff)}
                  testID={`select-staff-${staff.id}`}
                >
                  <View style={styles.staffLoginInfo}>
                    <Text style={styles.staffLoginName}>
                      {staff.first_name} {staff.last_name}
                    </Text>
                    <Text style={styles.staffLoginEmail}>{staff.email}</Text>
                  </View>
                  <View style={styles.staffRoleBadge}>
                    <Text style={styles.staffRoleBadgeText}>{staff.role}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowStaffLogin(false);
                setSelectedTenantForStaff(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 40,
    marginTop: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  backendStatus: {
    marginTop: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  statusTextSuccess: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500' as const,
  },
  statusTextError: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  tenantCardContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tenantCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  tenantCardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  tenantCardEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  ownerButton: {
    backgroundColor: '#007AFF',
  },
  staffButton: {
    backgroundColor: '#34C759',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  roleSelector: {
    flexDirection: 'row' as const,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
  },
  roleSelectorButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center' as const,
  },
  roleSelectorButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  roleSelectorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8E8E93',
  },
  roleSelectorTextActive: {
    color: '#007AFF',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  staffLoginCard: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  staffLoginInfo: {
    flex: 1,
  },
  staffLoginName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  staffLoginEmail: {
    fontSize: 14,
    color: '#666',
  },
  staffRoleBadge: {
    backgroundColor: '#34C75915',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  staffRoleBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#34C759',
  },
});
