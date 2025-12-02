import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { FileText, Image as ImageIcon, File as FileIcon, Download, Folder, Calendar, Building2, User, Receipt, FileCheck, Filter, ExternalLink } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import EmptyState from '@/components/EmptyState';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';

type FileCategory = 'all' | 'documents' | 'photos' | 'receipts' | 'agreements' | 'invoices' | 'inspections';

interface FileItem {
  id: string;
  name: string;
  uri: string;
  type: 'image' | 'pdf' | 'other';
  category: FileCategory;
  size?: number;
  date: string;
  metadata?: {
    propertyName?: string;
    tenantName?: string;
    amount?: number;
    description?: string;
  };
  sourceId?: string;
  sourceType?: 'payment' | 'invoice' | 'lease' | 'document' | 'inspection' | 'property' | 'unit' | 'maintenance';
}

export default function FilesScreen() {
  const {
    properties,
    units,
    tenantRenters,
    leases,
    payments,
    businessDocuments,
    invoices,
    propertyInspections,
    propertyItems,
    moveInChecklists,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  const allFiles = useMemo(() => {
    const files: FileItem[] = [];

    businessDocuments.forEach(doc => {
      if (doc.file_uri) {
        const property = properties.find(p => p.id === doc.property_id);
        files.push({
          id: `doc-${doc.id}`,
          name: doc.name,
          uri: doc.file_uri,
          type: doc.file_type || 'other',
          category: 'documents',
          size: doc.file_size,
          date: doc.created_at,
          sourceId: doc.id,
          sourceType: 'document',
          metadata: {
            propertyName: property?.name,
            description: `${doc.category} - ${doc.document_number || 'N/A'}`,
          },
        });
      }
    });

    leases.forEach(lease => {
      const property = properties.find(p => p.id === lease.property_id);
      const unit = units.find(u => u.id === lease.unit_id);
      const tenant = tenantRenters.find(t => t.id === lease.tenant_renter_id);
      const tenantName = tenant?.type === 'business' ? tenant.business_name : `${tenant?.first_name} ${tenant?.last_name}`;

      if (lease.pdf_generated_uri) {
        files.push({
          id: `lease-pdf-${lease.id}`,
          name: `Lease Agreement - ${property?.name} Unit ${unit?.unit_number}`,
          uri: lease.pdf_generated_uri,
          type: 'pdf',
          category: 'agreements',
          date: lease.pdf_generated_at || lease.created_at,
          sourceId: lease.id,
          sourceType: 'lease',
          metadata: {
            propertyName: property?.name,
            tenantName,
            description: `${lease.start_date} to ${lease.end_date}`,
          },
        });
      }

      if (lease.complete_agreement_uri) {
        files.push({
          id: `lease-complete-${lease.id}`,
          name: `Complete Agreement - ${property?.name} Unit ${unit?.unit_number}`,
          uri: lease.complete_agreement_uri,
          type: 'pdf',
          category: 'agreements',
          date: lease.complete_agreement_generated_at || lease.created_at,
          sourceId: lease.id,
          sourceType: 'lease',
          metadata: {
            propertyName: property?.name,
            tenantName,
            description: 'Complete with schedules',
          },
        });
      }

      if (lease.signed_agreement) {
        files.push({
          id: `lease-signed-${lease.id}`,
          name: `Signed Agreement - ${property?.name} Unit ${unit?.unit_number}`,
          uri: lease.signed_agreement.uri,
          type: lease.signed_agreement.type === 'image' ? 'image' : 'pdf',
          category: 'agreements',
          date: lease.signed_agreement.uploadedAt,
          sourceId: lease.id,
          sourceType: 'lease',
          metadata: {
            propertyName: property?.name,
            tenantName,
            description: 'Signed by tenant',
          },
        });
      }
    });

    payments.forEach(payment => {
      if (payment.payment_proof) {
        const lease = leases.find(l => l.id === payment.lease_id);
        const property = properties.find(p => p.id === lease?.property_id);
        const tenant = tenantRenters.find(t => t.id === payment.tenant_renter_id);
        const tenantName = tenant?.type === 'business' ? tenant.business_name : `${tenant?.first_name} ${tenant?.last_name}`;

        files.push({
          id: `payment-proof-${payment.id}`,
          name: `Payment Proof - ${payment.reference_number || payment.id}`,
          uri: payment.payment_proof.uri,
          type: payment.payment_proof.type === 'image' ? 'image' : 'pdf',
          category: 'receipts',
          size: payment.payment_proof.size,
          date: payment.payment_proof.uploadedAt,
          sourceId: payment.id,
          sourceType: 'payment',
          metadata: {
            propertyName: property?.name,
            tenantName,
            amount: payment.amount,
            description: `Payment for ${payment.payment_date}`,
          },
        });
      }

      if (payment.receipt_pdf_uri) {
        const lease = leases.find(l => l.id === payment.lease_id);
        const property = properties.find(p => p.id === lease?.property_id);
        const tenant = tenantRenters.find(t => t.id === payment.tenant_renter_id);
        const tenantName = tenant?.type === 'business' ? tenant.business_name : `${tenant?.first_name} ${tenant?.last_name}`;

        files.push({
          id: `receipt-${payment.id}`,
          name: `Receipt ${payment.receipt_number || payment.id}`,
          uri: payment.receipt_pdf_uri,
          type: 'pdf',
          category: 'receipts',
          date: payment.receipt_generated_at || payment.created_at,
          sourceId: payment.id,
          sourceType: 'payment',
          metadata: {
            propertyName: property?.name,
            tenantName,
            amount: payment.amount,
            description: `Receipt for ${payment.payment_date}`,
          },
        });
      }
    });

    invoices.forEach(invoice => {
      if (invoice.pdf_uri) {
        const property = properties.find(p => p.id === invoice.property_id);
        const tenant = tenantRenters.find(t => t.id === invoice.tenant_renter_id);
        const tenantName = tenant?.type === 'business' ? tenant.business_name : `${tenant?.first_name} ${tenant?.last_name}`;

        files.push({
          id: `invoice-${invoice.id}`,
          name: `Invoice ${invoice.invoice_number}`,
          uri: invoice.pdf_uri,
          type: 'pdf',
          category: 'invoices',
          date: invoice.created_at,
          sourceId: invoice.id,
          sourceType: 'invoice',
          metadata: {
            propertyName: property?.name,
            tenantName,
            amount: invoice.total_amount,
            description: `Due ${invoice.due_date}`,
          },
        });
      }
    });

    propertyInspections.forEach(inspection => {
      const property = properties.find(p => p.id === inspection.property_id);
      const unit = units.find(u => u.id === inspection.unit_id);

      if (inspection.report_pdf_uri) {
        files.push({
          id: `inspection-report-${inspection.id}`,
          name: `Inspection Report - ${property?.name} ${unit ? `Unit ${unit.unit_number}` : ''}`,
          uri: inspection.report_pdf_uri,
          type: 'pdf',
          category: 'inspections',
          date: inspection.completed_date || inspection.created_at,
          sourceId: inspection.id,
          sourceType: 'inspection',
          metadata: {
            propertyName: property?.name,
            description: `${inspection.inspection_type} inspection`,
          },
        });
      }

      if (inspection.images && inspection.images.length > 0) {
        inspection.images.forEach((imageUri, index) => {
          files.push({
            id: `inspection-img-${inspection.id}-${index}`,
            name: `Inspection Photo ${index + 1} - ${property?.name}`,
            uri: imageUri,
            type: 'image',
            category: 'photos',
            date: inspection.completed_date || inspection.created_at,
            sourceId: inspection.id,
            sourceType: 'inspection',
            metadata: {
              propertyName: property?.name,
              description: `${inspection.inspection_type} inspection`,
            },
          });
        });
      }
    });

    properties.forEach(property => {
      if (property.images && property.images.length > 0) {
        property.images.forEach((imageUri, index) => {
          files.push({
            id: `property-img-${property.id}-${index}`,
            name: `${property.name} - Photo ${index + 1}`,
            uri: imageUri,
            type: 'image',
            category: 'photos',
            date: property.created_at,
            sourceId: property.id,
            sourceType: 'property',
            metadata: {
              propertyName: property.name,
              description: 'Property photo',
            },
          });
        });
      }
    });

    units.forEach(unit => {
      const property = properties.find(p => p.id === unit.property_id);
      if (unit.images && unit.images.length > 0) {
        unit.images.forEach((imageUri, index) => {
          files.push({
            id: `unit-img-${unit.id}-${index}`,
            name: `${property?.name} Unit ${unit.unit_number} - Photo ${index + 1}`,
            uri: imageUri,
            type: 'image',
            category: 'photos',
            date: unit.created_at,
            sourceId: unit.id,
            sourceType: 'unit',
            metadata: {
              propertyName: property?.name,
              description: `Unit ${unit.unit_number}`,
            },
          });
        });
      }
    });

    propertyItems.forEach(item => {
      const property = properties.find(p => p.id === item.property_id);
      if (item.images && item.images.length > 0) {
        item.images.forEach((imageUri, index) => {
          files.push({
            id: `item-img-${item.id}-${index}`,
            name: `${item.name} - Photo ${index + 1}`,
            uri: imageUri,
            type: 'image',
            category: 'photos',
            date: item.created_at,
            metadata: {
              propertyName: property?.name,
              description: `Inventory: ${item.category}`,
            },
          });
        });
      }
    });

    moveInChecklists.forEach(checklist => {
      const property = properties.find(p => {
        const unit = units.find(u => u.id === checklist.unit_id);
        return unit?.property_id === p.id;
      });

      if (checklist.damage_images && checklist.damage_images.length > 0) {
        checklist.damage_images.forEach((imageUri, index) => {
          files.push({
            id: `checklist-damage-${checklist.id}-${index}`,
            name: `Move-in Damage Photo ${index + 1}`,
            uri: imageUri,
            type: 'image',
            category: 'photos',
            date: checklist.created_at,
            metadata: {
              propertyName: property?.name,
              description: 'Move-in checklist damage',
            },
          });
        });
      }

      checklist.items.forEach(item => {
        if (item.images && item.images.length > 0) {
          item.images.forEach((imageUri, index) => {
            files.push({
              id: `checklist-item-${checklist.id}-${item.id}-${index}`,
              name: `${item.name} - Photo ${index + 1}`,
              uri: imageUri,
              type: 'image',
              category: 'photos',
              date: checklist.created_at,
              metadata: {
                propertyName: property?.name,
                description: `Move-in checklist: ${item.condition}`,
              },
            });
          });
        }
      });
    });

    return files;
  }, [businessDocuments, leases, payments, invoices, propertyInspections, properties, units, tenantRenters, propertyItems, moveInChecklists]);

  const filteredFiles = useMemo(() => {
    let filtered = allFiles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return (b.size || 0) - (a.size || 0);
      }
    });

    return filtered;
  }, [allFiles, selectedCategory, sortBy]);

  const categoryStats = useMemo(() => {
    const stats = {
      all: allFiles.length,
      documents: 0,
      photos: 0,
      receipts: 0,
      agreements: 0,
      invoices: 0,
      inspections: 0,
    };

    allFiles.forEach(file => {
      if (file.category !== 'all') {
        stats[file.category]++;
      }
    });

    return stats;
  }, [allFiles]);

  const handleShare = async (file: FileItem) => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'File sharing is not available on web');
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: file.type === 'pdf' ? 'application/pdf' : 'image/*',
          dialogTitle: `Share ${file.name}`,
        });
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const handleNavigateToSource = (file: FileItem) => {
    if (!file.sourceId || !file.sourceType) {
      Alert.alert('Info', 'Cannot navigate to source - no source information available');
      return;
    }

    switch (file.sourceType) {
      case 'payment':
        router.push('/(tabs)/payments');
        Alert.alert('Navigate', `Navigating to Payments tab. Look for payment with ID: ${file.sourceId}`);
        break;
      case 'invoice':
        router.push('/(tabs)/invoices');
        Alert.alert('Navigate', `Navigating to Invoices tab. Look for invoice with ID: ${file.sourceId}`);
        break;
      case 'lease':
        router.push(`/lease/${file.sourceId}`);
        break;
      case 'document':
        router.push('/(tabs)/documents');
        Alert.alert('Navigate', `Navigating to Documents tab. Look for document with ID: ${file.sourceId}`);
        break;
      case 'inspection':
        router.push(`/inspection/${file.sourceId}`);
        break;
      case 'property':
        router.push('/(tabs)/properties');
        Alert.alert('Navigate', `Navigating to Properties tab. Look for property with ID: ${file.sourceId}`);
        break;
      case 'unit':
        router.push('/(tabs)/properties');
        Alert.alert('Navigate', `Navigating to Properties tab. Look for unit with ID: ${file.sourceId}`);
        break;
      case 'maintenance':
        router.push('/(tabs)/maintenance');
        Alert.alert('Navigate', `Navigating to Maintenance tab. Look for request with ID: ${file.sourceId}`);
        break;
      default:
        Alert.alert('Info', 'Navigation not implemented for this file type');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'documents': return FileText;
      case 'photos': return ImageIcon;
      case 'receipts': return Receipt;
      case 'agreements': return FileCheck;
      case 'invoices': return FileIcon;
      case 'inspections': return Building2;
      default: return Folder;
    }
  };

  const getCategoryLabel = (category: FileCategory): string => {
    const labels: Record<FileCategory, string> = {
      all: 'All Files',
      documents: 'Business Documents',
      photos: 'Photos',
      receipts: 'Receipts',
      agreements: 'Agreements',
      invoices: 'Invoices',
      inspections: 'Inspections',
    };
    return labels[category];
  };

  const categories: FileCategory[] = ['all', 'documents', 'photos', 'receipts', 'agreements', 'invoices', 'inspections'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>File Management</Text>
        <Text style={styles.headerSubtitle}>{categoryStats.all} total files</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map(category => {
          const Icon = getCategoryIcon(category);
          const count = categoryStats[category];
          const isActive = selectedCategory === category;

          return (
            <TouchableOpacity
              key={category}
              style={[styles.categoryCard, isActive && styles.categoryCardActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <View style={[styles.categoryIconContainer, isActive && styles.categoryIconContainerActive]}>
                <Icon size={20} color={isActive ? '#007AFF' : '#666'} />
              </View>
              <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                {getCategoryLabel(category)}
              </Text>
              <Text style={[styles.categoryCount, isActive && styles.categoryCountActive]}>
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => setSortBy('date')}
          >
            <Calendar size={14} color={sortBy === 'date' ? '#007AFF' : '#666'} />
            <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
              Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
          >
            <Filter size={14} color={sortBy === 'name' ? '#007AFF' : '#666'} />
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'size' && styles.sortButtonActive]}
            onPress={() => setSortBy('size')}
          >
            <FileIcon size={14} color={sortBy === 'size' ? '#007AFF' : '#666'} />
            <Text style={[styles.sortButtonText, sortBy === 'size' && styles.sortButtonTextActive]}>
              Size
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filteredFiles.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No Files"
            message={`No ${selectedCategory === 'all' ? '' : getCategoryLabel(selectedCategory).toLowerCase()} files found`}
          />
        ) : (
          filteredFiles.map(file => {
            const Icon = file.type === 'image' ? ImageIcon : file.type === 'pdf' ? FileText : FileIcon;

            return (
              <View key={file.id} style={styles.fileCard}>
                <TouchableOpacity 
                  style={styles.filePreviewContainer}
                  onPress={() => handleShare(file)}
                >
                  {file.type === 'image' ? (
                    <Image source={{ uri: file.uri }} style={styles.filePreviewImage} />
                  ) : (
                    <View style={styles.fileIconContainer}>
                      <Icon size={28} color="#007AFF" />
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {file.name}
                  </Text>
                  
                  {file.metadata?.propertyName && (
                    <View style={styles.metadataRow}>
                      <Building2 size={12} color="#999" />
                      <Text style={styles.metadataText}>{file.metadata.propertyName}</Text>
                    </View>
                  )}

                  {file.metadata?.tenantName && (
                    <View style={styles.metadataRow}>
                      <User size={12} color="#999" />
                      <Text style={styles.metadataText}>{file.metadata.tenantName}</Text>
                    </View>
                  )}

                  {file.metadata?.description && (
                    <Text style={styles.fileDescription} numberOfLines={1}>
                      {file.metadata.description}
                    </Text>
                  )}

                  <View style={styles.fileFooter}>
                    <View style={styles.fileMeta}>
                      <Calendar size={12} color="#999" />
                      <Text style={styles.fileMetaText}>{formatDate(file.date)}</Text>
                    </View>
                    {file.size && (
                      <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                    )}
                  </View>

                  {file.metadata?.amount !== undefined && (
                    <View style={styles.amountBadge}>
                      <Text style={styles.amountText}>
                        ₨{file.metadata.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.fileActions}>
                  {file.sourceId && file.sourceType && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleNavigateToSource(file)}
                    >
                      <ExternalLink size={18} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleShare(file)}
                  >
                    <Download size={18} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  categoriesScroll: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryCard: {
    width: 120,
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  categoryIconContainerActive: {
    backgroundColor: '#007AFF15',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  categoryLabelActive: {
    color: '#007AFF',
  },
  categoryCount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  categoryCountActive: {
    color: '#007AFF',
  },
  sortContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    fontWeight: '500' as const,
  },
  sortButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortButtonActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500' as const,
  },
  sortButtonTextActive: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fileCard: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filePreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden' as const,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  filePreviewImage: {
    width: '100%' as const,
    height: '100%' as const,
    resizeMode: 'cover' as const,
  },
  fileIconContainer: {
    width: '100%' as const,
    height: '100%' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#E8F4FF',
  },
  fileInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  metadataRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
  },
  fileDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  fileFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  fileMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  fileMetaText: {
    fontSize: 12,
    color: '#999',
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
  },
  amountBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  fileActions: {
    flexDirection: 'row' as const,
    gap: 8,
    alignSelf: 'center' as const,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});
