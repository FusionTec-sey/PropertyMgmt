import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image, Platform } from 'react-native';
import { Plus, Calendar, AlertCircle, Search, Trash2, Edit, Building2, FileText as FileTextIcon, Upload, File, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import type { BusinessDocument, DocumentCategory } from '@/types';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  business_license: 'Business License',
  insurance_policy: 'Insurance Policy',
  registration: 'Registration',
  tax_certificate: 'Tax Certificate',
  permit: 'Permit',
  contract: 'Contract',
  certification: 'Certification',
  other: 'Other',
};

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  business_license: '#FF9500',
  insurance_policy: '#34C759',
  registration: '#007AFF',
  tax_certificate: '#AF52DE',
  permit: '#FF3B30',
  contract: '#5856D6',
  certification: '#FF2D55',
  other: '#8E8E93',
};

export default function DocumentsScreen() {
  const {
    businessDocuments,
    properties,
    addBusinessDocument,
    updateBusinessDocument,
    deleteBusinessDocument,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<BusinessDocument | null>(null);
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<DocumentCategory>('business_license');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [issuingAuthority, setIssuingAuthority] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [reminderDays, setReminderDays] = useState<string>('30');
  const [notes, setNotes] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [fileUri, setFileUri] = useState<string>('');
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'other'>('image');
  const [fileSize, setFileSize] = useState<number>(0);

  const resetForm = () => {
    setName('');
    setCategory('business_license');
    setDocumentNumber('');
    setIssuingAuthority('');
    setIssueDate('');
    setExpiryDate('');
    setReminderDays('30');
    setNotes('');
    setSelectedPropertyId('');
    setFileUri('');
    setFileType('image');
    setFileSize(0);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter document name');
      return;
    }

    await addBusinessDocument({
      name: name.trim(),
      category,
      document_number: documentNumber.trim() || undefined,
      issuing_authority: issuingAuthority.trim() || undefined,
      issue_date: issueDate || undefined,
      expiry_date: expiryDate || undefined,
      reminder_days_before: reminderDays ? parseInt(reminderDays, 10) : undefined,
      notes: notes.trim() || undefined,
      property_id: selectedPropertyId || undefined,
      file_uri: fileUri || undefined,
      file_type: fileUri ? fileType : undefined,
      file_size: fileUri ? fileSize : undefined,
    });

    Alert.alert('Success', 'Document added successfully');
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (doc: BusinessDocument) => {
    setEditingDoc(doc);
    setName(doc.name);
    setCategory(doc.category);
    setDocumentNumber(doc.document_number || '');
    setIssuingAuthority(doc.issuing_authority || '');
    setIssueDate(doc.issue_date || '');
    setExpiryDate(doc.expiry_date || '');
    setReminderDays(doc.reminder_days_before?.toString() || '30');
    setNotes(doc.notes || '');
    setSelectedPropertyId(doc.property_id || '');
    setFileUri(doc.file_uri || '');
    setFileType(doc.file_type || 'image');
    setFileSize(doc.file_size || 0);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!name.trim() || !editingDoc) {
      Alert.alert('Error', 'Please enter document name');
      return;
    }

    await updateBusinessDocument(editingDoc.id, {
      name: name.trim(),
      category,
      document_number: documentNumber.trim() || undefined,
      issuing_authority: issuingAuthority.trim() || undefined,
      issue_date: issueDate || undefined,
      expiry_date: expiryDate || undefined,
      reminder_days_before: reminderDays ? parseInt(reminderDays, 10) : undefined,
      notes: notes.trim() || undefined,
      property_id: selectedPropertyId || undefined,
      file_uri: fileUri || undefined,
      file_type: fileUri ? fileType : undefined,
      file_size: fileUri ? fileSize : undefined,
    });

    Alert.alert('Success', 'Document updated successfully');
    resetForm();
    setEditingDoc(null);
    setShowEditModal(false);
  };

  const handleDelete = (doc: BusinessDocument) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${doc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBusinessDocument(doc.id);
            Alert.alert('Success', 'Document deleted successfully');
          },
        },
      ]
    );
  };

  const filteredDocuments = useMemo(() => {
    return businessDocuments.filter((doc) => {
      const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
      const matchesSearch =
        searchQuery === '' ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.document_number?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [businessDocuments, filterCategory, searchQuery]);

  const expiringDocs = useMemo(() => {
    const now = new Date();
    return businessDocuments.filter((doc) => {
      if (!doc.expiry_date) return false;
      const expiry = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const reminderDays = doc.reminder_days_before || 30;
      return daysUntilExpiry <= reminderDays && daysUntilExpiry >= 0;
    });
  }, [businessDocuments]);

  const expiredDocs = useMemo(() => {
    const now = new Date();
    return businessDocuments.filter((doc) => {
      if (!doc.expiry_date) return false;
      const expiry = new Date(doc.expiry_date);
      return expiry < now;
    });
  }, [businessDocuments]);



  const getDaysUntilExpiry = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (doc: BusinessDocument): 'expired' | 'expiring' | 'valid' | 'none' => {
    if (!doc.expiry_date) return 'none';
    const daysUntilExpiry = getDaysUntilExpiry(doc.expiry_date);
    const reminderDays = doc.reminder_days_before || 30;
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= reminderDays) return 'expiring';
    return 'valid';
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your camera to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileType('image');
        setFileSize(asset.fileSize || 0);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileType('image');
        setFileSize(asset.fileSize || 0);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        
        if (asset.mimeType?.includes('pdf')) {
          setFileType('pdf');
        } else if (asset.mimeType?.includes('image')) {
          setFileType('image');
        } else {
          setFileType('other');
        }
        
        setFileSize(asset.size || 0);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleAddFile = () => {
    if (Platform.OS === 'web') {
      handlePickDocument();
      return;
    }

    Alert.alert(
      'Add File',
      'Choose a source',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: handlePickImage,
        },
        {
          text: 'Browse Files',
          onPress: handlePickDocument,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleRemoveFile = () => {
    setFileUri('');
    setFileType('image');
    setFileSize(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search documents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {(expiringDocs.length > 0 || expiredDocs.length > 0) && (
          <View style={styles.alertsSection}>
            {expiredDocs.length > 0 && (
              <View style={[styles.alertCard, styles.expiredCard]}>
                <AlertCircle size={20} color="#FF3B30" />
                <Text style={styles.alertText}>
                  {expiredDocs.length} document{expiredDocs.length !== 1 ? 's' : ''} expired
                </Text>
              </View>
            )}
            {expiringDocs.length > 0 && (
              <View style={[styles.alertCard, styles.expiringCard]}>
                <AlertCircle size={20} color="#FF9500" />
                <Text style={styles.alertText}>
                  {expiringDocs.length} document{expiringDocs.length !== 1 ? 's' : ''} expiring soon
                </Text>
              </View>
            )}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, filterCategory === key && styles.filterChipActive]}
              onPress={() => setFilterCategory(key as DocumentCategory)}
            >
              <Text style={[styles.filterChipText, filterCategory === key && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.content}>
          {filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FileTextIcon}
              title="No Documents"
              message="Add your first business document to get started"
            />
          ) : (
            filteredDocuments.map((doc) => {
              const status = getExpiryStatus(doc);
              const property = properties.find(p => p.id === doc.property_id);
              
              return (
                <View key={doc.id} style={styles.docCard}>
                  <View style={styles.docHeader}>
                    <View style={styles.docTitleRow}>
                      <Text style={styles.docName}>{doc.name}</Text>
                      {status === 'expired' && (
                        <Badge label="Expired" variant="danger" />
                      )}
                      {status === 'expiring' && (
                        <Badge label="Expiring Soon" variant="warning" />
                      )}
                    </View>
                    <View style={styles.docActions}>
                      <TouchableOpacity onPress={() => handleEdit(doc)} style={styles.iconButton}>
                        <Edit size={18} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(doc)} style={styles.iconButton}>
                        <Trash2 size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[doc.category] + '20' }]}>
                    <Text style={[styles.categoryText, { color: CATEGORY_COLORS[doc.category] }]}>
                      {CATEGORY_LABELS[doc.category]}
                    </Text>
                  </View>

                  {property && (
                    <View style={styles.propertyRow}>
                      <Building2 size={14} color="#666" />
                      <Text style={styles.propertyText}>{property.name}</Text>
                    </View>
                  )}

                  {doc.document_number && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Document No:</Text>
                      <Text style={styles.infoValue}>{doc.document_number}</Text>
                    </View>
                  )}

                  {doc.issuing_authority && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Issuing Authority:</Text>
                      <Text style={styles.infoValue}>{doc.issuing_authority}</Text>
                    </View>
                  )}

                  <View style={styles.datesRow}>
                    {doc.issue_date && (
                      <View style={styles.dateItem}>
                        <Calendar size={14} color="#666" />
                        <View style={styles.dateTextContainer}>
                          <Text style={styles.dateLabel}>Issued</Text>
                          <Text style={styles.dateValue}>{formatDate(doc.issue_date)}</Text>
                        </View>
                      </View>
                    )}
                    {doc.expiry_date && (
                      <View style={styles.dateItem}>
                        <Calendar size={14} color={status === 'expired' ? '#FF3B30' : status === 'expiring' ? '#FF9500' : '#666'} />
                        <View style={styles.dateTextContainer}>
                          <Text style={styles.dateLabel}>Expires</Text>
                          <Text style={[
                            styles.dateValue,
                            status === 'expired' && styles.expiredText,
                            status === 'expiring' && styles.expiringText,
                          ]}>
                            {formatDate(doc.expiry_date)}
                          </Text>
                          {status === 'expiring' && (
                            <Text style={styles.daysRemaining}>
                              {getDaysUntilExpiry(doc.expiry_date)} days left
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>

                  {doc.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>{doc.notes}</Text>
                    </View>
                  )}

                  {doc.file_uri && (
                    <View style={styles.fileContainer}>
                      {doc.file_type === 'image' ? (
                        <Image source={{ uri: doc.file_uri }} style={styles.filePreview} />
                      ) : (
                        <View style={styles.fileIcon}>
                          <File size={24} color="#007AFF" />
                          <Text style={styles.fileTypeBadge}>{doc.file_type?.toUpperCase()}</Text>
                        </View>
                      )}
                      {doc.file_size && (
                        <Text style={styles.fileSize}>{formatFileSize(doc.file_size)}</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add Business Document"
      >
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Document Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Business License 2025"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryOption,
                    category === key && styles.categoryOptionActive,
                    { borderColor: CATEGORY_COLORS[key as DocumentCategory] }
                  ]}
                  onPress={() => setCategory(key as DocumentCategory)}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    category === key && { color: CATEGORY_COLORS[key as DocumentCategory] }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {properties.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Property (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                <TouchableOpacity
                  style={[styles.categoryOption, !selectedPropertyId && styles.categoryOptionActive]}
                  onPress={() => setSelectedPropertyId('')}
                >
                  <Text style={[styles.categoryOptionText, !selectedPropertyId && styles.categoryOptionTextActive]}>
                    None
                  </Text>
                </TouchableOpacity>
                {properties.map((prop) => (
                  <TouchableOpacity
                    key={prop.id}
                    style={[styles.categoryOption, selectedPropertyId === prop.id && styles.categoryOptionActive]}
                    onPress={() => setSelectedPropertyId(prop.id)}
                  >
                    <Text style={[styles.categoryOptionText, selectedPropertyId === prop.id && styles.categoryOptionTextActive]}>
                      {prop.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Document Number</Text>
            <TextInput
              style={styles.input}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder="e.g., BL-2025-1234"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Issuing Authority</Text>
            <TextInput
              style={styles.input}
              value={issuingAuthority}
              onChangeText={setIssuingAuthority}
              placeholder="e.g., Ministry of Finance"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Issue Date</Text>
            <TextInput
              style={styles.input}
              value={issueDate}
              onChangeText={setIssueDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expiry Date</Text>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reminder (days before expiry)</Text>
            <TextInput
              style={styles.input}
              value={reminderDays}
              onChangeText={setReminderDays}
              placeholder="30"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>File Attachment (Optional)</Text>
            {fileUri ? (
              <View style={styles.fileUploadPreview}>
                {fileType === 'image' ? (
                  <Image source={{ uri: fileUri }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.uploadedFileIcon}>
                    <File size={40} color="#007AFF" />
                    <Text style={styles.uploadedFileType}>{fileType?.toUpperCase()}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeFileButton} onPress={handleRemoveFile}>
                  <X size={18} color="#FFF" />
                </TouchableOpacity>
                {fileSize > 0 && (
                  <Text style={styles.uploadedFileSize}>{formatFileSize(fileSize)}</Text>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={handleAddFile}>
                <Upload size={24} color="#007AFF" />
                <Text style={styles.uploadButtonText}>Upload File</Text>
                <Text style={styles.uploadButtonHint}>Take photo, choose image, or upload PDF</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
            <Text style={styles.submitButtonText}>Add Document</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDoc(null);
          resetForm();
        }}
        title="Edit Business Document"
      >
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Document Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Business License 2025"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryOption,
                    category === key && styles.categoryOptionActive,
                    { borderColor: CATEGORY_COLORS[key as DocumentCategory] }
                  ]}
                  onPress={() => setCategory(key as DocumentCategory)}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    category === key && { color: CATEGORY_COLORS[key as DocumentCategory] }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {properties.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Property (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                <TouchableOpacity
                  style={[styles.categoryOption, !selectedPropertyId && styles.categoryOptionActive]}
                  onPress={() => setSelectedPropertyId('')}
                >
                  <Text style={[styles.categoryOptionText, !selectedPropertyId && styles.categoryOptionTextActive]}>
                    None
                  </Text>
                </TouchableOpacity>
                {properties.map((prop) => (
                  <TouchableOpacity
                    key={prop.id}
                    style={[styles.categoryOption, selectedPropertyId === prop.id && styles.categoryOptionActive]}
                    onPress={() => setSelectedPropertyId(prop.id)}
                  >
                    <Text style={[styles.categoryOptionText, selectedPropertyId === prop.id && styles.categoryOptionTextActive]}>
                      {prop.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Document Number</Text>
            <TextInput
              style={styles.input}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder="e.g., BL-2025-1234"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Issuing Authority</Text>
            <TextInput
              style={styles.input}
              value={issuingAuthority}
              onChangeText={setIssuingAuthority}
              placeholder="e.g., Ministry of Finance"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Issue Date</Text>
            <TextInput
              style={styles.input}
              value={issueDate}
              onChangeText={setIssueDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expiry Date</Text>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reminder (days before expiry)</Text>
            <TextInput
              style={styles.input}
              value={reminderDays}
              onChangeText={setReminderDays}
              placeholder="30"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>File Attachment (Optional)</Text>
            {fileUri ? (
              <View style={styles.fileUploadPreview}>
                {fileType === 'image' ? (
                  <Image source={{ uri: fileUri }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.uploadedFileIcon}>
                    <File size={40} color="#007AFF" />
                    <Text style={styles.uploadedFileType}>{fileType?.toUpperCase()}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeFileButton} onPress={handleRemoveFile}>
                  <X size={18} color="#FFF" />
                </TouchableOpacity>
                {fileSize > 0 && (
                  <Text style={styles.uploadedFileSize}>{formatFileSize(fileSize)}</Text>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={handleAddFile}>
                <Upload size={24} color="#007AFF" />
                <Text style={styles.uploadButtonText}>Upload File</Text>
                <Text style={styles.uploadButtonHint}>Take photo, choose image, or upload PDF</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
            <Text style={styles.submitButtonText}>Update Document</Text>
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
  header: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1A1A1A',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  alertsSection: {
    padding: 16,
    gap: 12,
  },
  alertCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  expiredCard: {
    backgroundColor: '#FF3B3015',
  },
  expiringCard: {
    backgroundColor: '#FF950015',
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  docCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  docHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  docTitleRow: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  docName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    flexShrink: 1,
  },
  docActions: {
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
  categoryBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  propertyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  propertyText: {
    fontSize: 13,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row' as const,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    marginRight: 8,
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 13,
    color: '#1A1A1A',
    flex: 1,
  },
  datesRow: {
    flexDirection: 'row' as const,
    gap: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
  },
  dateValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  expiredText: {
    color: '#FF3B30',
  },
  expiringText: {
    color: '#FF9500',
  },
  daysRemaining: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 2,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  categorySelector: {
    marginTop: 4,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
    backgroundColor: '#FFF',
  },
  categoryOptionActive: {
    backgroundColor: '#F8F9FA',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  categoryOptionTextActive: {
    color: '#007AFF',
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
  fileContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center' as const,
    gap: 8,
  },
  filePreview: {
    width: '100%' as const,
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover' as const,
  },
  fileIcon: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  fileTypeBadge: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
  },
  uploadButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed' as const,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center' as const,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  uploadButtonHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center' as const,
  },
  fileUploadPreview: {
    position: 'relative' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  uploadedImage: {
    width: '100%' as const,
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover' as const,
  },
  uploadedFileIcon: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  uploadedFileType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  uploadedFileSize: {
    fontSize: 12,
    color: '#999',
  },
  removeFileButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});
