import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Settings as SettingsIcon, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { currentTenant, currentUser, logout } = useApp();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Business Name</Text>
            <Text style={styles.value}>{currentTenant?.name || 'N/A'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{currentTenant?.email || 'N/A'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Subscription Plan</Text>
            <Text style={styles.value}>
              {currentTenant?.subscription_plan || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>
              {currentUser?.first_name} {currentUser?.last_name}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{currentUser?.role || 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  value: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  logoutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
