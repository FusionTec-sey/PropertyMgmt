import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
  icon?: ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  testID,
  icon,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return '#CCCCCC';
    if (variant === 'outline') return 'transparent';
    switch (variant) {
      case 'primary':
        return '#007AFF';
      case 'secondary':
        return '#F0F0F0';
      case 'danger':
        return '#FF3B30';
      case 'success':
        return '#34C759';
      default:
        return '#007AFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return disabled ? '#CCCCCC' : '#007AFF';
    }
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return '#999999';
    if (variant === 'outline') return '#007AFF';
    return variant === 'secondary' ? '#1A1A1A' : '#FFFFFF';
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 20 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 24 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 20 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: getBorderColor(),
          ...getPadding(),
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  iconContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  text: {
    fontWeight: '600' as const,
  },
});
