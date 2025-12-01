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
import { Building2, Plus } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import type { Tenant, User } from '@/types';

export default function LoginScreen() {
  const router = useRouter();
  const { isLoading, currentTenant, currentUser, tenants, login, addTenant } = useApp();
  const [showNewTenant, setShowNewTenant] = useState<boolean>(false);
  const [newTenantName, setNewTenantName] = useState<string>('');
  const [newTenantEmail, setNewTenantEmail] = useState<string>('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

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
        first_name: 'Admin',
        last_name: 'User',
        role: 'owner',
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

  const handleSelectTenant = async (tenant: Tenant) => {
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
                  <TouchableOpacity
                    key={tenant.id}
                    style={styles.tenantCard}
                    onPress={() => handleSelectTenant(tenant)}
                  >
                    <View style={styles.tenantIcon}>
                      <Building2 size={24} color="#007AFF" />
                    </View>
                    <View style={styles.tenantInfo}>
                      <Text style={styles.tenantName}>{tenant.name}</Text>
                      <Text style={styles.tenantEmail}>{tenant.email}</Text>
                    </View>
                  </TouchableOpacity>
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
  tenantCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
  tenantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  tenantEmail: {
    fontSize: 14,
    color: '#666',
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
});
