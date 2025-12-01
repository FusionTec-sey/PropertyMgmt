import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { TenantRenter, SignedDocument } from '@/types';
import { Building, User, Calendar, FileText, Download, Upload, Camera, Trash, CheckCircle, Edit2, FileStack, LogOut } from 'lucide-react-native';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Modal from '@/components/Modal';
import { generateCompleteTenancyDocument } from '@/utils/documentGenerator';

export default function LeaseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { leases, updateLease, properties, units, tenantRenters, moveInChecklists, propertyItems } = useApp();
  
  const lease = leases.find((l) => l.id === id);
  const [cameraVisible, setCameraVisible] = useState<boolean>(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  if (!lease) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Lease Not Found' }} />
        <Text style={styles.errorText}>Lease not found</Text>
      </View>
    );
  }

  const property = properties.find((p) => p.id === lease.property_id);
  const unit = units.find((u) => u.id === lease.unit_id);
  const tenant = tenantRenters.find((t) => t.id === lease.tenant_renter_id);

  const getTenantName = (t: TenantRenter) => {
    if (t.type === 'business') {
      return t.business_name || 'Unnamed Business';
    }
    return `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Unnamed';
  };

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SCR`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const generatePDFHTML = () => {
    const tenantName = tenant ? getTenantName(tenant) : 'Unknown Tenant';
    const propertyName = property?.name || 'Unknown Property';
    const unitNumber = unit?.unit_number || 'N/A';
    const propertyAddress = property ? `${property.address}, ${property.city}, ${property.island}, ${property.country}` : 'Unknown Address';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Lease Agreement</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #007AFF;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #007AFF;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #007AFF;
              margin-bottom: 15px;
              border-bottom: 2px solid #E0E0E0;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              width: 180px;
              color: #666;
            }
            .info-value {
              flex: 1;
            }
            .terms {
              background: #F8F9FA;
              padding: 20px;
              border-radius: 8px;
              white-space: pre-wrap;
            }
            .signature-section {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
            }
            .signature-line {
              border-top: 2px solid #333;
              margin-top: 60px;
              padding-top: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #E0E0E0;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RESIDENTIAL LEASE AGREEMENT</h1>
            <p>Republic of Seychelles</p>
          </div>

          <div class="section">
            <div class="section-title">Property Information</div>
            <div class="info-row">
              <div class="info-label">Property:</div>
              <div class="info-value">${propertyName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Unit Number:</div>
              <div class="info-value">${unitNumber}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Address:</div>
              <div class="info-value">${propertyAddress}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tenant Information</div>
            <div class="info-row">
              <div class="info-label">Tenant Name:</div>
              <div class="info-value">${tenantName}</div>
            </div>
            ${tenant?.email ? `
            <div class="info-row">
              <div class="info-label">Email:</div>
              <div class="info-value">${tenant.email}</div>
            </div>
            ` : ''}
            ${tenant?.phone ? `
            <div class="info-row">
              <div class="info-label">Phone:</div>
              <div class="info-value">${tenant.phone}</div>
            </div>
            ` : ''}
            ${tenant?.id_type && tenant?.id_number ? `
            <div class="info-row">
              <div class="info-label">Identification:</div>
              <div class="info-value">${tenant.id_type} - ${tenant.id_number}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Lease Terms</div>
            <div class="info-row">
              <div class="info-label">Start Date:</div>
              <div class="info-value">${formatDate(lease.start_date)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">End Date:</div>
              <div class="info-value">${formatDate(lease.end_date)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Monthly Rent:</div>
              <div class="info-value">${formatCurrency(lease.rent_amount)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Security Deposit:</div>
              <div class="info-value">${formatCurrency(lease.deposit_amount)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Payment Due Day:</div>
              <div class="info-value">${lease.payment_due_day} of each month</div>
            </div>
          </div>

          ${lease.terms ? `
          <div class="section">
            <div class="section-title">Additional Terms & Conditions</div>
            <div class="terms">${lease.terms}</div>
          </div>
          ` : ''}

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <strong>Landlord/Property Manager</strong><br>
                Date: _________________
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <strong>Tenant</strong><br>
                ${tenantName}<br>
                Date: _________________
              </div>
            </div>
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}<br>
            This document is a legally binding agreement
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const html = generatePDFHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      await updateLease(lease.id, {
        pdf_generated_uri: uri,
        pdf_generated_at: new Date().toISOString(),
      });

      if (Platform.OS !== 'web') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          Alert.alert(
            'PDF Generated',
            'Would you like to share the lease agreement?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Share',
                onPress: async () => {
                  await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share Lease Agreement',
                    UTI: 'com.adobe.pdf',
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert('Success', 'Lease agreement PDF generated successfully!');
        }
      } else {
        Alert.alert('Success', 'Lease agreement PDF generated successfully!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF agreement');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleGenerateCompleteAgreement = async () => {
    if (!property || !unit || !tenant) {
      Alert.alert('Error', 'Missing property, unit, or tenant information');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const checklist = lease.move_in_checklist_id 
        ? moveInChecklists.find(c => c.id === lease.move_in_checklist_id)
        : moveInChecklists.find(c => c.lease_id === lease.id);

      const unitInventory = propertyItems.filter(item => item.unit_id === unit.id);

      if (!checklist && unitInventory.length === 0) {
        Alert.alert(
          'Missing Information',
          'No checklist or inventory items found. Would you like to generate the agreement anyway?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Generate Anyway',
              onPress: async () => {
                await generateComplete(undefined, []);
              }
            }
          ]
        );
        return;
      }

      await generateComplete(checklist, unitInventory);
    } catch (error) {
      console.error('Error generating complete agreement:', error);
      Alert.alert('Error', 'Failed to generate complete agreement');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generateComplete = async (checklist: any, inventory: any[]) => {
    if (!property || !unit || !tenant) return;

    const html = generateCompleteTenancyDocument(
      lease,
      property,
      unit,
      tenant,
      checklist,
      inventory
    );

    const { uri } = await Print.printToFileAsync({ html });
    
    await updateLease(lease.id, {
      complete_agreement_uri: uri,
      complete_agreement_generated_at: new Date().toISOString(),
      move_in_checklist_id: checklist?.id,
    });

    if (Platform.OS !== 'web') {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        Alert.alert(
          'Complete Agreement Generated',
          'Would you like to share the complete tenancy agreement with all schedules?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Share',
              onPress: async () => {
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Share Complete Tenancy Agreement',
                  UTI: 'com.adobe.pdf',
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Complete tenancy agreement generated successfully!');
      }
    } else {
      Alert.alert('Success', 'Complete tenancy agreement generated successfully!');
    }
  };

  const handlePickDocument = async () => {
    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const document: SignedDocument = {
          uri: result.assets[0].uri,
          type: result.assets[0].uri.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
          name: `signed_lease_${lease.id}.${result.assets[0].uri.split('.').pop()}`,
          size: result.assets[0].fileSize,
          uploadedAt: new Date().toISOString(),
        };

        await updateLease(lease.id, {
          signed_agreement: document,
        });

        Alert.alert('Success', 'Signed agreement uploaded successfully!');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async (camera: any) => {
    try {
      setIsUploading(true);
      const photo = await camera.takePictureAsync();
      
      const document: SignedDocument = {
        uri: photo.uri,
        type: 'image',
        name: `signed_lease_${lease.id}.jpg`,
        uploadedAt: new Date().toISOString(),
      };

      await updateLease(lease.id, {
        signed_agreement: document,
      });

      setCameraVisible(false);
      Alert.alert('Success', 'Signed agreement photo uploaded successfully!');
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenCamera = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }
    setCameraVisible(true);
  };

  const handleUploadDocument = () => {
    Alert.alert(
      'Upload Signed Agreement',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleOpenCamera },
        { text: 'Choose File', onPress: handlePickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemoveDocument = () => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove the signed agreement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await updateLease(lease.id, {
              signed_agreement: undefined,
            });
            Alert.alert('Success', 'Signed agreement removed');
          },
        },
      ]
    );
  };

  const handleFinalizeLease = () => {
    if (!lease.signed_agreement) {
      Alert.alert('Missing Document', 'Please upload the signed agreement before finalizing the lease.');
      return;
    }

    Alert.alert(
      'Finalize Lease',
      'Are you sure you want to finalize this lease? This will change its status to Active.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            await updateLease(lease.id, {
              status: 'active',
              signed_date: new Date().toISOString(),
            });
            Alert.alert('Success', 'Lease finalized successfully!', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const handleDeleteDraft = () => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft lease? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await updateLease(lease.id, { status: 'terminated' });
            Alert.alert('Success', 'Draft deleted successfully!', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.back();
    setTimeout(() => {
      router.push(`/(tabs)/tenants`);
    }, 100);
  };

  const handleRenewLease = () => {
    Alert.alert(
      'Renew Lease',
      'Would you like to renew this lease? The current lease will be marked as renewed and a new lease will be created.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Renew',
          onPress: () => {
            const monthsDiff = Math.round(
              (new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) / 
              (1000 * 60 * 60 * 24 * 30)
            );
            const leasePeriod = [6, 12, 24].includes(monthsDiff) ? monthsDiff : 12;
            
            router.push(`/renewLease/${lease.id}?leasePeriod=${leasePeriod}` as any);
          },
        },
      ]
    );
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'expired':
      case 'terminated':
        return 'danger';
      case 'renewed':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Lease Details',
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
              <Edit2 size={20} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusSection}>
          <Badge label={lease.status} variant={getStatusVariant(lease.status)} />
          {lease.status === 'draft' && (
            <Text style={styles.draftText}>Complete all steps to finalize this lease</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property & Tenant</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Building size={18} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Property</Text>
                <Text style={styles.infoValue}>{property?.name || 'Unknown'}</Text>
                <Text style={styles.infoSubValue}>Unit {unit?.unit_number || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <User size={18} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tenant</Text>
                <Text style={styles.infoValue}>{tenant ? getTenantName(tenant) : 'Unknown'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lease Period</Text>
          <View style={styles.infoCard}>
            <View style={styles.dateRow}>
              <View style={styles.dateBox}>
                <Calendar size={16} color="#007AFF" />
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>{formatDate(lease.start_date)}</Text>
              </View>
              <View style={styles.dateSeparator} />
              <View style={styles.dateBox}>
                <Calendar size={16} color="#007AFF" />
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>{formatDate(lease.end_date)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Monthly Rent</Text>
              <Text style={styles.financialValue}>{formatCurrency(lease.rent_amount)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Security Deposit</Text>
              <Text style={styles.financialValue}>{formatCurrency(lease.deposit_amount)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Payment Due Day</Text>
              <Text style={styles.financialValue}>Day {lease.payment_due_day}</Text>
            </View>
          </View>
        </View>

        {lease.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <View style={styles.termsCard}>
              <Text style={styles.termsText}>{lease.terms}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PDF Agreement</Text>
          {lease.pdf_generated_uri ? (
            <View style={styles.documentCard}>
              <View style={styles.documentInfo}>
                <FileText size={24} color="#34C759" />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>Lease Agreement.pdf</Text>
                  <Text style={styles.documentDate}>
                    Generated {formatDate(lease.pdf_generated_at || lease.created_at)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.regenerateButton}
                onPress={handleGeneratePDF}
                disabled={isGeneratingPDF}
              >
                <Download size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title="Generate PDF Agreement"
              onPress={handleGeneratePDF}
              loading={isGeneratingPDF}
              icon={<FileText size={20} color="#FFFFFF" />}
              fullWidth
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complete Tenancy Agreement</Text>
          <Text style={styles.sectionSubtitle}>
            Includes agreement + checklist (Schedule 1) + inventory (Schedule 2)
          </Text>
          {lease.complete_agreement_uri ? (
            <View style={styles.documentCard}>
              <View style={styles.documentInfo}>
                <FileStack size={24} color="#34C759" />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>Complete Tenancy Agreement.pdf</Text>
                  <Text style={styles.documentDate}>
                    Generated {formatDate(lease.complete_agreement_generated_at || lease.created_at)}
                  </Text>
                  {lease.move_in_checklist_id && (
                    <Text style={styles.documentStatus}>✓ Checklist Attached</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                style={styles.regenerateButton}
                onPress={handleGenerateCompleteAgreement}
                disabled={isGeneratingPDF}
              >
                <Download size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title="Generate Complete Agreement"
              onPress={handleGenerateCompleteAgreement}
              loading={isGeneratingPDF}
              icon={<FileStack size={20} color="#FFFFFF" />}
              fullWidth
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signed Agreement</Text>
          {lease.signed_agreement ? (
            <View style={styles.documentCard}>
              {lease.signed_agreement.type === 'image' && (
                <Image 
                  source={{ uri: lease.signed_agreement.uri }} 
                  style={styles.signedImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.documentInfo}>
                <CheckCircle size={24} color="#34C759" />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>{lease.signed_agreement.name}</Text>
                  <Text style={styles.documentDate}>
                    Uploaded {formatDate(lease.signed_agreement.uploadedAt)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={handleRemoveDocument}
              >
                <Trash size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPrompt}>
              <Upload size={32} color="#999" />
              <Text style={styles.uploadPromptText}>
                Upload scanned copy of signed agreement
              </Text>
              <Button
                title="Upload Document"
                onPress={handleUploadDocument}
                loading={isUploading}
                variant="outline"
                fullWidth
              />
            </View>
          )}
        </View>

        {lease.status === 'draft' && (
          <View style={styles.actionsSection}>
            <Button
              title="Finalize Lease"
              onPress={handleFinalizeLease}
              disabled={!lease.signed_agreement}
              icon={<CheckCircle size={20} color="#FFFFFF" />}
              fullWidth
            />
            <Button
              title="Delete Draft"
              onPress={handleDeleteDraft}
              variant="outline"
              style={styles.deleteButton}
              fullWidth
            />
          </View>
        )}

        {lease.status === 'active' && (
          <View style={styles.actionsSection}>
            <Button
              title="Start Move-Out Process"
              onPress={() => router.push(`/moveout/${lease.id}` as any)}
              icon={<LogOut size={20} color="#FFFFFF" />}
              fullWidth
              variant="outline"
            />
            <Button
              title="Renew Lease"
              onPress={handleRenewLease}
              icon={<FileText size={20} color="#FFFFFF" />}
              fullWidth
            />
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        title="Take Photo"
        testID="camera-modal"
      >
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            ref={(ref: any) => {
              if (ref) {
                (window as any).cameraRef = ref;
              }
            }}
          />
          <View style={styles.cameraActions}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => {
                const camera = (window as any).cameraRef;
                if (camera) {
                  handleTakePhoto(camera);
                }
              }}
            >
              <Camera size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center' as const,
    marginTop: 40,
  },
  statusSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  draftText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: 14,
    color: '#666',
  },
  dateRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  dateBox: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 8,
  },
  dateSeparator: {
    width: 20,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  financialRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  financialLabel: {
    fontSize: 14,
    color: '#666',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
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
  documentDate: {
    fontSize: 12,
    color: '#666',
  },
  documentStatus: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  regenerateButton: {
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
  },
  signedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadPrompt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center' as const,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed' as const,
  },
  uploadPromptText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  },
  actionsSection: {
    gap: 12,
  },
  deleteButton: {
    borderColor: '#FF3B30',
  },
  cameraContainer: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  camera: {
    flex: 1,
  },
  cameraActions: {
    position: 'absolute' as const,
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});
