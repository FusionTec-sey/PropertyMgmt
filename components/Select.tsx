import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ViewStyle } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  disabled?: boolean;
  testID?: string;
}

export default function Select({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Select an option',
  required = false,
  containerStyle,
  disabled = false,
  testID,
}: SelectProps) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.selectButton,
          disabled && styles.selectButtonDisabled,
          !selectedOption && styles.selectButtonPlaceholder,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        testID={testID}
      >
        <Text
          style={[
            styles.selectText,
            !selectedOption && styles.selectTextPlaceholder,
            disabled && styles.selectTextDisabled,
          ]}
        >
          {displayText}
        </Text>
        <ChevronDown size={20} color={disabled ? '#CCC' : '#666'} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                testID={`${testID}-close`}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect(item.value)}
                  testID={`${testID}-option-${item.value}`}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value && (
                    <Check size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No options available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  selectButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  selectButtonDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  selectButtonPlaceholder: {
    borderColor: '#E0E0E0',
  },
  selectText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  selectTextPlaceholder: {
    color: '#999',
  },
  selectTextDisabled: {
    color: '#CCC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%' as const,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  optionItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
