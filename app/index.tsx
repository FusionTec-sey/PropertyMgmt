import { Redirect } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { currentTenant, isLoading } = useApp();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!currentTenant) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
