import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  style?: ViewStyle;
  testID?: string;
}

export default function Badge({ label, variant = 'default', style, testID }: BadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return '#34C759';
      case 'warning':
        return '#FF9500';
      case 'danger':
        return '#FF3B30';
      case 'info':
        return '#007AFF';
      default:
        return '#999999';
    }
  };

  return (
    <View
      style={[styles.badge, { backgroundColor: getBackgroundColor() }, style]}
      testID={testID}
    >
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
  },
  text: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textTransform: 'capitalize' as const,
  },
});
