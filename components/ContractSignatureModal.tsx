import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Modal from './Modal';
import SignaturePad from './SignaturePad';
import Button from './Button';
import { FileCheck, RotateCcw } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface ContractSignatureModalProps {
  visible: boolean;
  onClose: () => void;
  contractHTML: string;
  onSave: (signedPdfUri: string) => Promise<void>;
  title?: string;
  signerName: string;
}

export default function ContractSignatureModal({
  visible,
  onClose,
  contractHTML,
  onSave,
  title = 'Sign Contract',
  signerName,
}: ContractSignatureModalProps) {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentSignature, setCurrentSignature] = useState<string>('');

  const handleClear = () => {
    setCurrentSignature('');
  };

  const handleSaveSignedContract = async () => {
    if (!currentSignature) {
      Alert.alert('Signature Required', 'Please sign the contract before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const signatureHTML = `
        <div class="signature-container">
          <div class="signature-section">
            <p style="margin-bottom: 5px;"><strong>${signerName}</strong></p>
            <div style="border-top: 2px solid #333; padding-top: 10px; margin-top: 60px;">
              <p style="font-size: 11pt; color: #666;">Digitally signed on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      `;

      const htmlWithSignature = contractHTML.replace(
        '</body>',
        `${signatureHTML}</body>`
      );

      const { uri } = await Print.printToFileAsync({
        html: htmlWithSignature,
        base64: false,
      });

      await onSave(uri);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        Alert.alert(
          'Contract Signed',
          'Would you like to share the signed contract?',
          [
            {
              text: 'Later',
              style: 'cancel',
              onPress: () => {
                setCurrentSignature('');
                onClose();
              },
            },
            {
              text: 'Share',
              onPress: async () => {
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Share Signed Contract',
                  UTI: 'com.adobe.pdf',
                });
                setCurrentSignature('');
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Contract signed and saved successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setCurrentSignature('');
              onClose();
            },
          },
        ]);
      }
    } catch (error) {
      console.error('[ContractSignature] Error saving signed contract:', error);
      Alert.alert('Error', 'Failed to save signed contract. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={title} testID="contract-signature-modal">
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionCard}>
          <FileCheck size={32} color="#007AFF" />
          <Text style={styles.instructionTitle}>Sign the Contract</Text>
          <Text style={styles.instructionText}>
            Please sign in the box below to confirm your agreement to the terms and conditions.
            Your signature will be added to the contract PDF.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Signature</Text>
          <SignaturePad
            onSignatureChange={(sig) => {
              setCurrentSignature(sig);
            }}
            strokeColor="#000000"
            strokeWidth={2}
            backgroundColor="#FFFFFF"
          />
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            disabled={!currentSignature}
          >
            <RotateCcw size={16} color={currentSignature ? '#FF3B30' : '#999'} />
            <Text style={[styles.clearButtonText, !currentSignature && styles.clearButtonTextDisabled]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signerInfo}>
          <Text style={styles.signerLabel}>Signer Name:</Text>
          <Text style={styles.signerName}>{signerName}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Sign & Save"
            onPress={handleSaveSignedContract}
            loading={isSaving}
            disabled={!currentSignature}
            icon={<FileCheck size={20} color="#FFFFFF" />}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  instructionCard: {
    backgroundColor: '#F0F8FF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#007AFF20',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  signatureSection: {
    marginBottom: 24,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  clearButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 12,
    padding: 8,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600' as const,
  },
  clearButtonTextDisabled: {
    color: '#999',
  },
  signerInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  signerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  signerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
});
