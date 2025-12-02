import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Image, ActivityIndicator, FlatList } from 'react-native';
import { LogOut, UserPlus, Mail, Phone, Shield, Trash2, Edit, FileText, ChevronRight, CheckSquare, Bell, Upload, X, Download, HardDrive, BarChart3, Archive, Clock, RotateCcw, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import type { UserRole, UserPermissions } from '@/types';
import Modal from '@/components/Modal';
import { showPhotoOptions } from '@/components/PhotoPicker';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import { DataExport, BackupMetadata } from '@/utils/dataExport';
import { Analytics } from '@/utils/analytics';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { CacheManager } from '@/utils/cacheManager';

export default function SettingsScreen() {
  const router = useRouter();
  const { currentTenant, currentUser, logout, staffUsers, addStaffUser, updateStaffUser, deleteStaffUser, businessLogo, updateBusinessLogo } = useApp();
  
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [showBackupsModal, setShowBackupsModal] = useState<boolean>(false);
  const [backupsList, setBackupsList] = useState<BackupMetadata[]>([]);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null);
  
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffFirstName, setStaffFirstName] = useState<string>('');
  const [staffLastName, setStaffLastName] = useState<string>('');
  const [staffPhone, setStaffPhone] = useState<string>('');
  const [staffRole, setStaffRole] = useState<UserRole>('maintenance');
  const [permissions, setPermissions] = useState<UserPermissions>({
    properties: false,
    tenants: false,
    leases: false,
    payments: false,
    maintenance: true,
    todos: true,
    settings: false,
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const resetForm = () => {
    setStaffEmail('');
    setStaffFirstName('');
    setStaffLastName('');
    setStaffPhone('');
    setStaffRole('maintenance');
    setPermissions({
      properties: false,
      tenants: false,
      leases: false,
      payments: false,
      maintenance: true,
      todos: true,
      settings: false,
    });
  };

  const handleAddStaff = async () => {
    if (!staffEmail.trim() || !staffFirstName.trim() || !staffLastName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    await addStaffUser({
      email: staffEmail.trim(),
      first_name: staffFirstName.trim(),
      last_name: staffLastName.trim(),
      phone: staffPhone.trim() || undefined,
      role: staffRole,
      is_active: true,
      permissions,
    });

    Alert.alert('Success', 'Staff member added successfully');
    resetForm();
    setShowAddStaffModal(false);
  };

  const handleEditStaff = (staff: any) => {
    setEditingStaff(staff);
    setStaffEmail(staff.email);
    setStaffFirstName(staff.first_name);
    setStaffLastName(staff.last_name);
    setStaffPhone(staff.phone || '');
    setStaffRole(staff.role);
    setPermissions(staff.permissions || {
      properties: false,
      tenants: false,
      leases: false,
      payments: false,
      maintenance: true,
      todos: true,
      settings: false,
    });
    setShowEditStaffModal(true);
  };

  const handleUpdateStaff = async () => {
    if (!staffEmail.trim() || !staffFirstName.trim() || !staffLastName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    await updateStaffUser(editingStaff.id, {
      email: staffEmail.trim(),
      first_name: staffFirstName.trim(),
      last_name: staffLastName.trim(),
      phone: staffPhone.trim() || undefined,
      role: staffRole,
      permissions,
    });

    Alert.alert('Success', 'Staff member updated successfully');
    resetForm();
    setEditingStaff(null);
    setShowEditStaffModal(false);
  };

  const handleDeleteStaff = (staff: any) => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to delete ${staff.first_name} ${staff.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteStaffUser(staff.id);
            Alert.alert('Success', 'Staff member deleted successfully');
          },
        },
      ]
    );
  };

  const isOwner = currentUser?.role === 'owner';

  return (
    <>
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <SyncStatusIndicator />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>Business Logo</Text>
            {businessLogo ? (
              <View style={styles.logoContainer}>
                <Image source={{ uri: businessLogo }} style={styles.logoImage} />
                <View style={styles.logoActions}>
                  <TouchableOpacity
                    style={styles.changeLogoButton}
                    onPress={() => {
                      showPhotoOptions((uri: string | null) => {
                        if (uri) {
                          updateBusinessLogo(uri);
                          Alert.alert('Success', 'Business logo updated successfully');
                        }
                      });
                    }}
                    testID="change-logo-button"
                  >
                    <Upload size={16} color="#007AFF" />
                    <Text style={styles.changeLogoText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeLogoButton}
                    onPress={() => {
                      Alert.alert(
                        'Remove Logo',
                        'Are you sure you want to remove the business logo?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              updateBusinessLogo(null);
                              Alert.alert('Success', 'Business logo removed');
                            },
                          },
                        ]
                      );
                    }}
                    testID="remove-logo-button"
                  >
                    <X size={16} color="#FF3B30" />
                    <Text style={styles.removeLogoText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadLogoButton}
                onPress={() => {
                  showPhotoOptions((uri: string | null) => {
                    if (uri) {
                      updateBusinessLogo(uri);
                      Alert.alert('Success', 'Business logo added successfully');
                    }
                  });
                }}
                testID="upload-logo-button"
              >
                <Upload size={24} color="#007AFF" />
                <Text style={styles.uploadLogoText}>Upload Logo</Text>
                <Text style={styles.uploadLogoSubtext}>Add your business logo to appear on documents</Text>
              </TouchableOpacity>
            )}
          </View>

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
            <View style={styles.roleBadgeContainer}>
              <View style={[styles.roleBadge, currentUser?.role === 'owner' ? styles.ownerBadge : styles.staffBadge]}>
                <Text style={styles.roleBadgeText}>
                  {currentUser?.role === 'owner' ? 'Owner/Admin' : 
                   currentUser?.role === 'maintenance' ? 'Staff (Maintenance)' : 
                   currentUser?.role || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          
          <TouchableOpacity
            style={styles.managementCard}
            onPress={() => router.push('/(tabs)/todos')}
            testID="manage-todos-button"
          >
            <View style={styles.managementIconContainer}>
              <CheckSquare size={20} color="#34C759" />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Tasks & To-Do</Text>
              <Text style={styles.managementSubtitle}>
                Manage your tasks and to-do items
              </Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementCard}
            onPress={() => router.push('/(tabs)/documents')}
            testID="manage-documents-button"
          >
            <View style={styles.managementIconContainer}>
              <FileText size={20} color="#007AFF" />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Documents</Text>
              <Text style={styles.managementSubtitle}>
                Business licenses, insurance, and other documents
              </Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementCard}
            onPress={() => router.push('/(tabs)/notifications')}
            testID="manage-notifications-button"
          >
            <View style={styles.managementIconContainer}>
              <Bell size={20} color="#FF9500" />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Notifications & Reminders</Text>
              <Text style={styles.managementSubtitle}>
                View upcoming events and manage notification settings
              </Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity
            style={styles.managementCard}
            onPress={async () => {
              if (!currentTenant) return;
              try {
                setIsExporting(true);
                await DataExport.exportToFile(currentTenant.id, currentTenant.name);
                Alert.alert('Success', 'Data exported successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to export data');
                Analytics.trackError(error as Error, 'high', 'data_export');
              } finally {
                setIsExporting(false);
              }
            }}
            testID="export-data-button"
            disabled={isExporting}
          >
            <View style={styles.managementIconContainer}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Download size={20} color="#007AFF" />
              )}
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Export Data</Text>
              <Text style={styles.managementSubtitle}>
                Download all your data as a JSON file
              </Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementCard}
            onPress={async () => {
              if (!currentTenant) return;
              try {
                setIsCreatingBackup(true);
                await DataExport.createBackup(currentTenant.id);
                Alert.alert('Success', 'Backup created successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to create backup');
                Analytics.trackError(error as Error, 'high', 'backup_creation');
              } finally {
                setIsCreatingBackup(false);
              }
            }}
            testID="create-backup-button"
            disabled={isCreatingBackup}
          >
            <View style={styles.managementIconContainer}>
              {isCreatingBackup ? (
                <ActivityIndicator size="small" color="#34C759" />
              ) : (
                <HardDrive size={20} color="#34C759" />
              )}
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Create Backup</Text>
              <Text style={styles.managementSubtitle}>
                Create a local backup for quick restore
              </Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementCard}
            onPress={async () => {
              setLoadingBackups(true);
              setShowBackupsModal(true);
              try {
                const backups = await DataExport.getBackupMetadata();
                setBackupsList(backups);
              } catch (error) {
                Alert.alert('Error', 'Failed to load backups');
                Analytics.trackError(error as Error, 'medium', 'load_backups');
              } finally {
                setLoadingBackups(false);
              }
            }}
            testID="manage-backups-button"
          >
            <View style={styles.managementIconContainer}>
              <Archive size={20} color="#FF9500" />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Manage Backups</Text>
              <Text style={styles.managementSubtitle}>
                View and restore previous backups
              </Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.managementCard}
            onPress={() => {
              const cacheStats = CacheManager.getStats();
              const perfStats = PerformanceMonitor.getStats();
              const errorStats = Analytics.getErrorStats();
              
              Alert.alert(
                'System Stats',
                `Cache: ${cacheStats.totalEntries} entries, ${(cacheStats.totalSize / 1024).toFixed(1)} KB\n` +
                `Hit Rate: ${cacheStats.hitRate.toFixed(1)}%\n\n` +
                `Performance: ${perfStats.totalMetrics} metrics\n` +
                `Avg Duration: ${perfStats.averageDuration.toFixed(1)}ms\n\n` +
                `Errors: ${errorStats.total} (${errorStats.bySeverity.critical} critical)`,
                [
                  { text: 'Clear Cache', onPress: () => CacheManager.clear() },
                  { text: 'Clear Stats', onPress: () => {
                    PerformanceMonitor.clearMetrics();
                    Analytics.clearAllLogs();
                  }},
                  { text: 'OK' },
                ]
              );
            }}
            testID="system-stats-button"
          >
            <View style={styles.managementIconContainer}>
              <BarChart3 size={20} color="#5856D6" />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>System Stats</Text>
              <Text style={styles.managementSubtitle}>
                View cache, performance, and error statistics
              </Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {isOwner && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Staff Management</Text>
              <TouchableOpacity
                style={styles.addStaffButton}
                onPress={() => setShowAddStaffModal(true)}
                testID="add-staff-button"
              >
                <UserPlus size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {staffUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No staff members yet</Text>
                <Text style={styles.emptySubtext}>Add your first staff member to get started</Text>
              </View>
            ) : (
              staffUsers.map((staff) => (
                <View key={staff.id} style={styles.staffCard}>
                  <View style={styles.staffHeader}>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>
                        {staff.first_name} {staff.last_name}
                      </Text>
                      <View style={[styles.roleBadge, styles.staffRoleBadge]}>
                        <Text style={styles.staffRoleBadgeText}>{staff.role}</Text>
                      </View>
                    </View>
                    <View style={styles.staffActions}>
                      <TouchableOpacity
                        onPress={() => handleEditStaff(staff)}
                        style={styles.iconButton}
                        testID={`edit-staff-${staff.id}`}
                      >
                        <Edit size={18} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteStaff(staff)}
                        style={styles.iconButton}
                        testID={`delete-staff-${staff.id}`}
                      >
                        <Trash2 size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.staffDetail}>
                    <Mail size={14} color="#666" />
                    <Text style={styles.staffDetailText}>{staff.email}</Text>
                  </View>
                  {staff.phone && (
                    <View style={styles.staffDetail}>
                      <Phone size={14} color="#666" />
                      <Text style={styles.staffDetailText}>{staff.phone}</Text>
                    </View>
                  )}
                  <View style={styles.permissionsContainer}>
                    <View style={styles.permissionsHeader}>
                      <Shield size={14} color="#666" />
                      <Text style={styles.permissionsTitle}>Permissions:</Text>
                    </View>
                    <View style={styles.permissionTags}>
                      {staff.permissions?.properties && <View style={styles.permissionTag}><Text style={styles.permissionTagText}>Properties</Text></View>}
                      {staff.permissions?.tenants && <View style={styles.permissionTag}><Text style={styles.permissionTagText}>Tenants</Text></View>}
                      {staff.permissions?.leases && <View style={styles.permissionTag}><Text style={styles.permissionTagText}>Leases</Text></View>}
                      {staff.permissions?.payments && <View style={styles.permissionTag}><Text style={styles.permissionTagText}>Payments</Text></View>}
                      {staff.permissions?.maintenance && <View style={styles.permissionTag}><Text style={styles.permissionTagText}>Maintenance</Text></View>}
                      {staff.permissions?.todos && <View style={styles.permissionTag}><Text style={styles.permissionTagText}>Tasks</Text></View>}
                      {staff.permissions?.settings && <View style={styles.permissionTag}><Text style={styles.permissionTagText}>Settings</Text></View>}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    <Modal
      visible={showAddStaffModal}
      onClose={() => {
        setShowAddStaffModal(false);
        resetForm();
      }}
      title="Add Staff Member"
    >
      <ScrollView style={styles.modalContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            value={staffEmail}
            onChangeText={setStaffEmail}
            placeholder="staff@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            testID="staff-email-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={staffFirstName}
            onChangeText={setStaffFirstName}
            placeholder="John"
            testID="staff-first-name-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={staffLastName}
            onChangeText={setStaffLastName}
            placeholder="Doe"
            testID="staff-last-name-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={staffPhone}
            onChangeText={setStaffPhone}
            placeholder="+248 xxx xxxx"
            keyboardType="phone-pad"
            testID="staff-phone-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Permissions</Text>
          <View style={styles.permissionsList}>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Properties</Text>
              <Switch
                value={permissions.properties}
                onValueChange={(value) => setPermissions({ ...permissions, properties: value })}
                testID="permission-properties"
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Tenants</Text>
              <Switch
                value={permissions.tenants}
                onValueChange={(value) => setPermissions({ ...permissions, tenants: value })}
                testID="permission-tenants"
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Leases</Text>
              <Switch
                value={permissions.leases}
                onValueChange={(value) => setPermissions({ ...permissions, leases: value })}
                testID="permission-leases"
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Payments</Text>
              <Switch
                value={permissions.payments}
                onValueChange={(value) => setPermissions({ ...permissions, payments: value })}
                testID="permission-payments"
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Maintenance</Text>
              <Switch
                value={permissions.maintenance}
                onValueChange={(value) => setPermissions({ ...permissions, maintenance: value })}
                testID="permission-maintenance"
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Tasks/Todos</Text>
              <Switch
                value={permissions.todos}
                onValueChange={(value) => setPermissions({ ...permissions, todos: value })}
                testID="permission-todos"
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Settings</Text>
              <Switch
                value={permissions.settings}
                onValueChange={(value) => setPermissions({ ...permissions, settings: value })}
                testID="permission-settings"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAddStaff}
          testID="submit-add-staff"
        >
          <Text style={styles.submitButtonText}>Add Staff Member</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>

    <Modal
      visible={showBackupsModal}
      onClose={() => {
        setShowBackupsModal(false);
        setBackupsList([]);
      }}
      title="Manage Backups"
    >
      <View style={styles.backupsModalContent}>
        {loadingBackups ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading backups...</Text>
          </View>
        ) : backupsList.length === 0 ? (
          <View style={styles.emptyBackupsContainer}>
            <AlertCircle size={48} color="#999" />
            <Text style={styles.emptyBackupsText}>No backups found</Text>
            <Text style={styles.emptyBackupsSubtext}>
              Create your first backup to enable quick restore
            </Text>
          </View>
        ) : (
          <FlatList
            data={backupsList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.backupCard}>
                <View style={styles.backupHeader}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.backupDate}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.backupSize}>
                  Size: {DataExport.formatFileSize(item.dataSize)}
                </Text>
                <Text style={styles.backupVersion}>Version: {item.version}</Text>
                
                <View style={styles.backupActions}>
                  <TouchableOpacity
                    style={[styles.backupButton, styles.restoreButton]}
                    onPress={() => {
                      Alert.alert(
                        'Restore Backup',
                        'This will replace all current data with the backup. Are you sure?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Restore',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                setRestoringBackupId(item.id);
                                await DataExport.restoreFromBackup(item.id);
                                Alert.alert(
                                  'Success',
                                  'Backup restored successfully. Please restart the app.',
                                  [
                                    {
                                      text: 'OK',
                                      onPress: () => {
                                        setShowBackupsModal(false);
                                        setBackupsList([]);
                                      },
                                    },
                                  ]
                                );
                              } catch (error) {
                                Alert.alert('Error', 'Failed to restore backup');
                                Analytics.trackError(error as Error, 'high', 'backup_restore');
                              } finally {
                                setRestoringBackupId(null);
                              }
                            },
                          },
                        ]
                      );
                    }}
                    disabled={restoringBackupId === item.id || deletingBackupId !== null}
                    testID={`restore-backup-${item.id}`}
                  >
                    {restoringBackupId === item.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <RotateCcw size={16} color="#FFF" />
                    )}
                    <Text style={styles.backupButtonText}>Restore</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.backupButton, styles.deleteBackupButton]}
                    onPress={() => {
                      Alert.alert(
                        'Delete Backup',
                        'Are you sure you want to delete this backup?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                setDeletingBackupId(item.id);
                                await DataExport.deleteBackup(item.id);
                                const updatedBackups = backupsList.filter(b => b.id !== item.id);
                                setBackupsList(updatedBackups);
                                Alert.alert('Success', 'Backup deleted successfully');
                              } catch (error) {
                                Alert.alert('Error', 'Failed to delete backup');
                                Analytics.trackError(error as Error, 'medium', 'backup_delete');
                              } finally {
                                setDeletingBackupId(null);
                              }
                            },
                          },
                        ]
                      );
                    }}
                    disabled={deletingBackupId === item.id || restoringBackupId !== null}
                    testID={`delete-backup-${item.id}`}
                  >
                    {deletingBackupId === item.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Trash2 size={16} color="#FFF" />
                    )}
                    <Text style={styles.backupButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.backupsList}
          />
        )}
      </View>
    </Modal>

    <Modal
      visible={showEditStaffModal}
      onClose={() => {
        setShowEditStaffModal(false);
        setEditingStaff(null);
        resetForm();
      }}
      title="Edit Staff Member"
    >
      <ScrollView style={styles.modalContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            value={staffEmail}
            onChangeText={setStaffEmail}
            placeholder="staff@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={staffFirstName}
            onChangeText={setStaffFirstName}
            placeholder="John"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={staffLastName}
            onChangeText={setStaffLastName}
            placeholder="Doe"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={staffPhone}
            onChangeText={setStaffPhone}
            placeholder="+248 xxx xxxx"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Permissions</Text>
          <View style={styles.permissionsList}>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Properties</Text>
              <Switch
                value={permissions.properties}
                onValueChange={(value) => setPermissions({ ...permissions, properties: value })}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Tenants</Text>
              <Switch
                value={permissions.tenants}
                onValueChange={(value) => setPermissions({ ...permissions, tenants: value })}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Leases</Text>
              <Switch
                value={permissions.leases}
                onValueChange={(value) => setPermissions({ ...permissions, leases: value })}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Payments</Text>
              <Switch
                value={permissions.payments}
                onValueChange={(value) => setPermissions({ ...permissions, payments: value })}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Maintenance</Text>
              <Switch
                value={permissions.maintenance}
                onValueChange={(value) => setPermissions({ ...permissions, maintenance: value })}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Tasks/Todos</Text>
              <Switch
                value={permissions.todos}
                onValueChange={(value) => setPermissions({ ...permissions, todos: value })}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Settings</Text>
              <Switch
                value={permissions.settings}
                onValueChange={(value) => setPermissions({ ...permissions, settings: value })}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleUpdateStaff}
        >
          <Text style={styles.submitButtonText}>Update Staff Member</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
    </>
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
  roleBadgeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: 200,
  },
  ownerBadge: {
    backgroundColor: '#007AFF15',
  },
  staffBadge: {
    backgroundColor: '#34C75915',
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flexShrink: 1,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  addStaffButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyState: {
    backgroundColor: '#FFF',
    padding: 32,
    borderRadius: 8,
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
    textAlign: 'center' as const,
  },
  staffCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  staffHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  staffRoleBadge: {
    backgroundColor: '#34C75915',
    alignSelf: 'flex-start' as const,
  },
  staffRoleBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#34C759',
  },
  staffActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  staffDetail: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  staffDetailText: {
    fontSize: 14,
    color: '#666',
  },
  permissionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  permissionsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  permissionsTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  permissionTags: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  permissionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#007AFF15',
  },
  permissionTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  modalContent: {
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  permissionsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  permissionRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  permissionLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  managementCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  managementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  managementContent: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  managementSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  logoContainer: {
    marginTop: 12,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
  },
  logoActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  changeLogoButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF15',
    borderRadius: 6,
  },
  changeLogoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  removeLogoButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FF3B3015',
    borderRadius: 6,
  },
  removeLogoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
  uploadLogoButton: {
    marginTop: 12,
    padding: 24,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center' as const,
    backgroundColor: '#F0F8FF',
  },
  uploadLogoText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#007AFF',
    marginTop: 8,
  },
  uploadLogoSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  backupsModalContent: {
    maxHeight: 500,
    minHeight: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  emptyBackupsContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyBackupsText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBackupsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
  },
  backupsList: {
    padding: 16,
  },
  backupCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backupHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  backupDate: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  backupSize: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  backupVersion: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  backupActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 8,
  },
  backupButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  restoreButton: {
    backgroundColor: '#34C759',
  },
  deleteBackupButton: {
    backgroundColor: '#FF3B30',
  },
  backupButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
