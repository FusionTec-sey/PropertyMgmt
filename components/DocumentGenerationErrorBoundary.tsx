import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCcw } from 'lucide-react-native';

interface DocumentGenerationErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface DocumentGenerationErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class DocumentGenerationErrorBoundary extends React.Component<
  DocumentGenerationErrorBoundaryProps,
  DocumentGenerationErrorBoundaryState
> {
  constructor(props: DocumentGenerationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): DocumentGenerationErrorBoundaryState {
    console.error('[DocumentGenerationErrorBoundary] Error caught:', error);
    return {
      hasError: true,
      errorMessage: error?.message || 'Document generation failed',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DocumentGenerationErrorBoundary] Error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="document-error-boundary">
          <View style={styles.card}>
            <View style={styles.iconWrapper}>
              <AlertTriangle size={32} color="#FF9500" />
            </View>
            <Text style={styles.title}>Document Generation Failed</Text>
            <Text style={styles.subtitle}>
              {this.props.fallbackMessage || this.state.errorMessage || 'Unable to generate document. Please try again.'}
            </Text>
            <TouchableOpacity 
              style={styles.button} 
              onPress={this.handleRetry} 
              testID="retry-document-button"
            >
              <RefreshCcw size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  card: {
    width: '100%' as const,
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center' as const,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF950015',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
